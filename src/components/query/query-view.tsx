"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useTransition,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { useAuth } from "@/hooks/use-auth";
import { MarkdownRenderer } from "@/components/shared";
import { Select } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { logoutAction } from "@/app/actions/auth";
import {
  createQuerySessionAction,
  submitQueryMessageAction,
  listQuerySessionsAction,
  getQuerySessionAction,
  submitQueryFeedbackAction,
  saveQueryToWikiAction,
  getDashboardSummaryAction,
  getOnboardingStateAction,
  getStoredRoleKbId,
  setStoredRoleKbId,
  getCurrentUserAction,
} from "@/lib/client-api";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "../layout/locale-switcher";
import { AppHeader } from "@/components/layout";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import type { QueryCitation, QuerySession } from "@/types/query";
import type { RoleKbDto } from "@/types/onboarding";

export interface QueryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: QueryCitation[];
  confidenceLevel: "high" | "medium" | "low" | null;
  confidenceScore?: number;
  freshnessStatus?: "fresh" | "stale" | "updating" | "verified" | "unknown";
  freshnessMessage?: string | null;
  kbGapDetected: boolean;
  kbGapSuggestion: string | null;
  kbGapActions?: string[];
  followUps?: string[];
  usedItems: number;
  createdAt: string;
  feedbackRating?: "up" | "down";
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === "en" ? "en-US" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

/** Pulsing 3-dot loading animation */
function TypingIndicator({ t }: { t: (path: string) => string }) {
  return (
    <div className="flex items-center gap-1.5 py-3 px-1">
      <span className="text-xs text-auth-text-3 mr-1">{t("query.analyzing")}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-white/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

/** Confidence level pill badge */
function ConfidenceBadge({ level, score, t }: { level: "high" | "medium" | "low"; score?: number; t: (path: string) => string }) {
  const map = {
    high: {
      label: t("query.confidenceHigh"),
      cls: "bg-white/[0.04] border border-white/[0.10] text-auth-text-2",
      Icon: "checkmark-circle",
    },
    medium: {
      label: t("query.confidenceMedium"),
      cls: "bg-zinc-800/40 border border-zinc-700/20 text-zinc-400",
      Icon: "grow",
    },
    low: {
      label: t("query.confidenceLow"),
      cls: "bg-red-950/40 border border-red-500/20 text-red-400",
      Icon: "warning",
    },
  };
  const { label, cls, Icon } = map[level];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      <LineIcon name={Icon} className="h-2.5 w-2.5" />
      {label} {score !== undefined ? ` · ${score}` : ""}
    </span>
  );
}

/** Single citation card */
function CitationCard({ citation, index, t }: { citation: QueryCitation; index: number; t: (path: string) => string }) {
  const score = Math.round((citation.score || 0) * 100);
  return (
    <a
      href={citation.sourcePointer?.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-64 bg-auth-elevated border border-auth-border hover:border-white/[0.15] rounded-xl p-3 flex flex-col gap-2 transition-all group hover:shadow-[0_0_15px_rgba(255,255,255,0.02)] cursor-pointer text-left"
    >
      {/* Index + domain */}
      <div className="flex items-center justify-between gap-2">
        <span className="h-5 w-5 rounded-full bg-white/[0.04] border border-white/[0.10] text-auth-text-2 text-[10px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-auth-text-3 bg-auth-bg/60 border border-white/[0.06] px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
          {citation.domain?.name || "Unknown"}
        </span>
        <LineIcon name="popup" className="h-3 w-3 text-auth-text-3 group-hover:text-auth-text transition-colors shrink-0" />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-auth-text line-clamp-2 leading-snug">
        {citation.knowledgeItemTitle}
      </p>

      {/* Excerpt */}
      <p className="text-[11px] text-auth-text-2 line-clamp-2 leading-relaxed">
        {citation.excerpt}
      </p>

      {/* Relevance bar */}
      <div className="flex items-center gap-2 mt-auto">
        <div className="flex-1 h-1 bg-auth-bg rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-white/30 to-white/10 rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-auth-text-2">{score}%</span>
      </div>
    </a>
  );
}

/** Citations collapsible panel */
function CitationsPanel({ citations, t }: { citations: QueryCitation[]; t: (path: string, defaultValue?: string) => string }) {
  const [open, setOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-auth-text-2 hover:text-white transition-colors"
      >
        <LineIcon name="book" className="h-3 w-3" />
        {t("query.citationsCount", "{count} sources").replace("{count}", citations.length.toString())}
        {open ? (
          <LineIcon name="chevron-up" className="h-3 w-3" />
        ) : (
          <LineIcon name="chevron-down" className="h-3 w-3" />
        )}
      </button>

      {open && (
        <div className="mt-2 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {citations.map((c, i) => (
            <CitationCard key={c.id} citation={c} index={i} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

/** KB Gap warning box */
function KbGapWarning({
  suggestion,
  locale,
  actions = [],
  t,
  roleKbId,
}: {
  suggestion: string | null;
  locale: string;
  actions?: string[];
  t: (path: string) => string;
  roleKbId?: string;
}) {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left">
      <LineIcon name="warning" className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-bold text-zinc-200">{t("query.gapTitle")}</p>
        {suggestion && (
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{suggestion}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {actions.includes("compile_source") && (
            <Link
              href={roleKbId ? `/${locale}/compile/new?roleKbId=${roleKbId}` : `/${locale}/compile/new`}
              className="inline-flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <LineIcon name="plus" className="h-2.5 w-2.5" /> {t("query.gapButton")}
            </Link>
          )}
          {actions.includes("change_scope") && (
            <span className="inline-flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] px-2.5 py-1 rounded-lg text-[10px] text-zinc-400">
              💡 {locale === "vi" ? "Đổi phạm vi hỏi" : "Change scope"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** User message bubble */
function UserMessage({ msg }: { msg: QueryMessage; locale: string }) {
  return (
    <div className="message-row user animate-fade-in">
      <div className="user-bubble">
        {msg.content}
      </div>
    </div>
  );
}

/** Assistant message (no bubble) */
function AssistantMessage({
  msg,
  locale,
  onFeedback,
  t,
  roleKbId,
}: {
  msg: QueryMessage;
  locale: string;
  onFeedback: (messageId: string, rating: "up" | "down") => void;
  t: (path: string, defaultValue?: string) => string;
  roleKbId?: string;
}) {
  const [thinkingCollapsed, setThinkingCollapsed] = useState(true);

  return (
    <div className="message-row animate-fade-in text-left">
      <div className="ai-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="ai-content">
        <div className="ai-name">Pulse AI</div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-2 select-none">
          {msg.confidenceLevel && (
            <ConfidenceBadge level={msg.confidenceLevel} score={msg.confidenceScore} t={t} />
          )}

          {/* Reasoning complete toggle button */}
          <div
            onClick={() => setThinkingCollapsed(!thinkingCollapsed)}
            className="thinking-bar done"
          >
            <div className="thinking-dot"></div>
            <span>{t("query.reasoningComplete", "Reasoning complete")}</span>
            <LineIcon
              name="chevron-down"
              className={`h-3 w-3 transition-transform duration-200 ${!thinkingCollapsed ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Collapsible Reasoning Log Panel */}
        {!thinkingCollapsed && (
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-auth-text-3 font-mono leading-relaxed mb-3.5 animate-dropdown-enter">
            {t("query.thinkingProcessMock", "Searching vector db chunks... 5 contexts matched. Synthesizing response using Gemini 2.0 Flash.")}
          </div>
        )}

        {/* Answer text */}
        <div className="ai-text">
          <MarkdownRenderer content={msg.content} />
        </div>

        {/* Freshness Badge */}
        {msg.freshnessStatus && msg.freshnessStatus !== "fresh" && msg.freshnessStatus !== "unknown" && (
          <div className={`freshness-badge ${msg.freshnessStatus} mt-3`}>
            <span className="fresh-icon">
              {msg.freshnessStatus === "stale" ? "⏳" : msg.freshnessStatus === "updating" ? "🔍" : "✅"}
            </span>
            <span className="fresh-text">
              {msg.freshnessMessage ||
                (msg.freshnessStatus === "stale"
                  ? t("query.staleInfo", "Dữ liệu có thể chưa mới nhất")
                  : msg.freshnessStatus === "updating"
                  ? t("query.updatingInfo", "Đang tìm thông tin mới nhất...")
                  : t("query.verifiedInfo", "Đã xác minh"))}
            </span>
          </div>
        )}

        {/* KB Gap Warning */}
        {msg.kbGapDetected && (
          <KbGapWarning
            suggestion={msg.kbGapSuggestion}
            locale={locale}
            actions={msg.kbGapActions}
            t={t}
            roleKbId={roleKbId}
          />
        )}

        {/* Citations */}
        <CitationsPanel citations={msg.citations} t={t} />

        {/* Actions Row */}
        <div className="ai-actions">
          <button
            onClick={() => onFeedback(msg.id, "up")}
            className={`ai-action-btn ${msg.feedbackRating === "up" ? "liked" : ""}`}
            title={t("query.actionGood", "Good")}
          >
            <LineIcon name="like" className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onFeedback(msg.id, "down")}
            className={`ai-action-btn ${msg.feedbackRating === "down" ? "disliked" : ""}`}
            title={t("query.actionBad", "Bad")}
          >
            <LineIcon name="dislike" className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                const event = new CustomEvent("prefill-query-input", { detail: msg.content });
                window.dispatchEvent(event);
              }
            }}
            className="ai-action-btn"
            title={t("query.actionRegen", "Regenerate")}
          >
            <LineIcon name="sync" className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(msg.content);
            }}
            className="ai-action-btn"
            title={t("query.actionCopy", "Copy")}
          >
            <LineIcon name="files" className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Follow-up suggestions */}
        {msg.followUps && msg.followUps.length > 0 && (
          <div className="followup-chips select-none">
            {msg.followUps.map((f, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const event = new CustomEvent("prefill-query-input", { detail: f });
                    window.dispatchEvent(event);
                  }
                }}
                className="followup-chip"
              >
                💡 {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Empty state (no messages) */
function EmptyState({
  onExampleClick,
  t,
}: {
  onExampleClick: (q: string) => void;
  t: (path: string) => string;
}) {
  const examples = [
    t("query.suggested.0"),
    t("query.suggested.1"),
    t("query.suggested.2"),
    t("query.suggested.3"),
  ];

  return (
    <div id="empty-state">
      <div className="empty-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="empty-title">{t("query.startTitle")}</div>
      <div className="empty-sub">{t("query.startDesc")}</div>
      <div className="suggestion-chips">
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onExampleClick(q)}
            className="chip"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Special empty KB error state */
function KbEmptyState({ locale, t, roleKbId }: { locale: string; t: (path: string) => string; roleKbId?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-6">
        <LineIcon name="database" className="h-10 w-10 text-zinc-400" />
      </div>
      <h2 className="text-fluid-xl font-extrabold tracking-tight mb-2">
        {t("query.emptyKbTitle")}
      </h2>
      <p className="text-xs text-auth-text-2 max-w-sm leading-relaxed mb-6">
        {t("query.emptyKbDesc")}
      </p>
      <Link
        href={roleKbId ? `/${locale}/compile/new?roleKbId=${roleKbId}` : `/${locale}/compile/new`}
        className="btn-primary-pulse text-sm"
      >
        <LineIcon name="plus" className="h-4 w-4" />
        {t("query.emptyKbButton")}
      </Link>
    </div>
  );
}

/** Missing role configuration warning state */
function MissingRoleState({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center animate-fade-in">
      <div className="h-20 w-20 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-6">
        <LineIcon name="warning" className="h-10 w-10 text-zinc-400" />
      </div>
      <h2 className="text-fluid-xl font-extrabold tracking-tight mb-2 text-zinc-200">
        {locale === "vi" ? "Chưa Thiết Lập Vai Trò Chuyên Môn" : "Professional Role Not Configured"}
      </h2>
      <p className="text-xs text-auth-text-2 max-w-sm leading-relaxed mb-6">
        {locale === "vi"
          ? "Tính năng hỏi đáp AI yêu cầu vai trò chuyên môn để tùy chỉnh cơ sở tri thức. Vui lòng hoàn tất thiết lập tại trang Cài đặt."
          : "The Query AI feature requires a professional role to customize your knowledge base. Please configure your role in Settings."}
      </p>
      <Link
        href={`/${locale}/settings#settings-section-role`}
        className="btn-primary-pulse text-sm bg-white hover:bg-zinc-200 text-black border-none"
      >
        <LineIcon name="settings" className="h-4 w-4" />
        {locale === "vi" ? "Thiết lập trong Cài đặt" : "Configure in Settings"}
      </Link>
    </div>
  );
}

/** Quota exceeded state */
function QuotaExceededBanner({ locale, t }: { locale: string; t: (path: string) => string }) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 flex items-start gap-3 text-left">
      <LineIcon name="warning" className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-red-300">{t("query.limitTitle")}</p>
        <p className="text-xs text-red-200/70 mt-1">
          {t("query.limitDesc")}
        </p>
        <Link
          href={`/${locale}/settings/billing`}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          <LineIcon name="bolt" className="h-3.5 w-3.5" /> {t("query.limitButton")}
        </Link>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────

export function QueryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useTranslation();

  // Conversation state
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Role KB state
  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [selectedRoleKbId, setSelectedRoleKbId] = useState<string>(() => searchParams.get("roleKbId") || searchParams.get("roleId") || searchParams.get("role_id") || getStoredRoleKbId() || authUser?.roleKbId || "");
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Sessions history state
  const [sessions, setSessions] = useState<QuerySession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Selector dropdowns state
  const [selectedModel, setSelectedModel] = useState("Gemini 2.0 Flash");
  const [modelDotColor, setModelDotColor] = useState("#10b981");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Floating Compile insights state
  const [showCompileBar, setShowCompileBar] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const domainDropdownRef = useRef<HTMLDivElement>(null);

  // Models list
  const models = [
    { name: "Gemini 2.0 Flash", icon: "✨", sub: "Fast · Best for most tasks", color: "#10b981", pro: false },
    { name: "Gemini 2.5 Pro", icon: "🔮", sub: "Advanced reasoning · Complex queries", color: "#8b5cf6", pro: true },
    { name: "GPT-4o", icon: "🤖", sub: "OpenAI · Multimodal", color: "#10a37f", pro: true },
    { name: "Claude Sonnet 4.5", icon: "🌿", sub: "Anthropic · Great for writing", color: "#d97706", pro: true },
    { name: "Claude Opus 4", icon: "🔒", sub: "Upgrade required", color: "#6b7280", pro: true, max: true, disabled: true },
  ];

  // ─── Bootstrap: load roles ───
  useEffect(() => {
    const initRoleKbId = searchParams.get("roleKbId") || authUser?.roleKbId || "";

    const loadRoles = async () => {
      setIsLoadingRoles(true);
      try {
        let roles: RoleKbDto[] = [];
        const userRes = await getCurrentUserAction();
        if (userRes.status === "1" && userRes.data?.roles && userRes.data.roles.length > 0) {
          roles = userRes.data.roles.map((r: any) => ({
            id: r.id,
            roleName: r.roleName,
            roleGroup: r.roleGroup,
            roleOptionId: r.roleOptionId || "",
            isCustom: r.isCustom ?? false,
            isPrimary: r.isPrimary ?? false,
            status: r.status || "active",
            createdAt: r.createdAt || new Date().toISOString(),
          }));
        } else {
          const res = await getOnboardingStateAction();
          if (res.status === "1" && res.data?.roles) {
            roles = res.data.roles;
          }
        }

        if (roles.length) {
          setUserRoles(roles);
          const isValid = roles.some((r) => r.id === initRoleKbId);
          let resolvedId = initRoleKbId;
          if (!isValid) {
            const primary = roles.find((r) => r.isPrimary) || roles[0];
            resolvedId = primary.id;
            setSelectedRoleKbId(resolvedId);
            setStoredRoleKbId(resolvedId);
            // Update URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("roleKbId", resolvedId);
            router.replace(`/${locale}/query?${newParams.toString()}`);
          } else {
            setSelectedRoleKbId(resolvedId);
            setStoredRoleKbId(resolvedId);
          }
        } else {
          setUserRoles([]);
          setSelectedRoleKbId("");
        }
      } catch (err) {
        console.error("loadRoles error:", err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadRoles();
  }, [authUser?.roleKbId, authUser?.plan, searchParams, router, locale]);

  // ─── Synchronize selectedRoleKbId when authUser finishes loading ───
  useEffect(() => {
    if (authUser?.roleKbId && authUser.roleKbId !== selectedRoleKbId) {
      console.log("🔄 [Auth State Sync Query] Updating selectedRoleKbId from authUser:", authUser.roleKbId);
      setSelectedRoleKbId(authUser.roleKbId);
      setStoredRoleKbId(authUser.roleKbId);
      
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("roleKbId", authUser.roleKbId);
      router.replace(`/${locale}/query?${newParams.toString()}`);
    }
  }, [authUser?.roleKbId, selectedRoleKbId, router, locale, searchParams]);

  // ─── Load domains of the selected role KB ───
  const loadDomains = useCallback(async (roleKbId: string) => {
    try {
      const res = await getDashboardSummaryAction(roleKbId);
      if (res.status === "1" && res.data?.domainSnapshot) {
        const fetched = res.data.domainSnapshot.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
        }));
        setDomains(fetched);
      }
    } catch (err) {
      console.error("loadDomains error:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedRoleKbId) {
      loadDomains(selectedRoleKbId);
    }
  }, [selectedRoleKbId, loadDomains]);

  // ─── Sessions: load recent history list ───
  const loadSessions = useCallback(async (roleId?: string) => {
    setIsLoadingSessions(true);
    try {
      const res = await listQuerySessionsAction({ limit: 20, roleKbId: roleId || undefined });
      console.log("🟢 [F12 API RESPONSE] listQuerySessionsAction:", res);
      if (res.status === "1" && res.data?.items) {
        setSessions(res.data.items);
      }
    } catch (err) {
      console.error("loadSessions error:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoleKbId) {
      loadSessions(selectedRoleKbId);
    }
  }, [selectedRoleKbId, loadSessions]);

  // ─── Click outside dropdowns listener ───
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (domainDropdownRef.current && !domainDropdownRef.current.contains(e.target as Node)) {
        setDomainDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ─── Prefill listener ───
  useEffect(() => {
    const handlePrefill = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setInputValue(customEvent.detail);
      setTimeout(() => textareaRef.current?.focus(), 50);
    };
    window.addEventListener("prefill-query-input", handlePrefill);
    return () => window.removeEventListener("prefill-query-input", handlePrefill);
  }, []);

  // ─── Scroll to bottom on new messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  // ─── Auto-resize textarea ───
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 180;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

  // ─── Handle logout ───
  const handleLogout = () => {
    startTransition(async () => {
      clearAuth();
      await logoutAction();
    });
  };

  // ─── Clear conversation ───
  const handleClearConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);
    setShowCompileBar(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // ─── Load specific history session ───
  const handleLoadSession = async (sessionId: string) => {
    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);
    setConversationId(sessionId);
    setMessages([]);
    setIsAnswering(true);
    setShowCompileBar(false);

    try {
      const res = await getQuerySessionAction(sessionId);
      console.log("🟢 [F12 API RESPONSE] getQuerySessionAction:", res);
      if (res.status === "1" && res.data) {
        const loadedMessages: QueryMessage[] = res.data.messages.map((m: any) => {
          if (m.role === "user") {
            return {
              id: m.id || generateId(),
              role: "user" as const,
              content: m.content || "",
              citations: [],
              confidenceLevel: null,
              kbGapDetected: false,
              kbGapSuggestion: null,
              usedItems: 0,
              createdAt: m.createdAt,
            };
          } else {
            return {
              id: m.messageId || m.id || generateId(),
              role: "assistant" as const,
              content: m.answer || "",
              citations: m.citations || [],
              confidenceLevel: m.confidence?.level || null,
              confidenceScore: m.confidence?.score,
              freshnessStatus: m.freshness?.status,
              freshnessMessage: m.freshness?.message,
              kbGapDetected: m.knowledgeGap?.hasGap || false,
              kbGapSuggestion: m.knowledgeGap?.message || null,
              kbGapActions: m.knowledgeGap?.recommendedActions || [],
              followUps: m.followUps || [],
              usedItems: m.citations?.length || 0,
              createdAt: m.createdAt,
            };
          }
        });
        setMessages(loadedMessages);
      } else {
        setInlineError(res.msg || "Không thể tải nội dung cuộc hội thoại.");
      }
    } catch (err) {
      console.error("handleLoadSession error:", err);
      setInlineError("Không thể kết nối máy chủ.");
    } finally {
      setIsAnswering(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // ─── Handle feedback ───
  const handleFeedback = async (messageId: string, rating: "up" | "down") => {
    try {
      const res = await submitQueryFeedbackAction(messageId, rating);
      console.log("🟢 [F12 API RESPONSE] submitQueryFeedbackAction:", res);
      if (res.status === "1") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, feedbackRating: rating }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  // ─── Handle Save To Wiki ───
  const handleSaveToWiki = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const titleHint = msg ? msg.content.slice(0, 40) + "..." : "Tri thức từ Hỏi đáp AI";
    try {
      const res = await saveQueryToWikiAction(messageId, {
        mode: "full_answer",
        title: titleHint,
        domainId: selectedDomainId,
      });
      console.log("🟢 [F12 API RESPONSE] saveQueryToWikiAction:", res);
      if (res.status === "1") {
        alert(locale === "vi" ? "Đã lưu vào Wiki cá nhân thành công!" : "Successfully compiled to Wiki!");
        setShowCompileBar(false);
      } else {
        alert(res.msg || (locale === "vi" ? "Không thể lưu vào Wiki." : "Could not compile to Wiki."));
      }
    } catch (err) {
      console.error("Save to Wiki error:", err);
      alert(locale === "vi" ? "Lỗi kết nối máy chủ." : "Server connection error.");
    }
  };

  // ─── Handle role change ───
  const handleRoleChange = (roleKbId: string) => {
    setSelectedRoleKbId(roleKbId);
    setStoredRoleKbId(roleKbId);
    setMessages([]);
    setConversationId(undefined);
    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);
    setShowCompileBar(false);
    setSelectedDomainId(null);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("roleKbId", roleKbId);
    router.replace(`/${locale}/query?${newParams.toString()}`);
  };

  // ─── Submit question ───
  const handleSubmit = useCallback(async () => {
    const question = inputValue.trim();
    if (question.length < 2 || isAnswering || !selectedRoleKbId) return;

    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);

    const userMsg: QueryMessage = {
      id: generateId(),
      role: "user",
      content: question,
      citations: [],
      confidenceLevel: null,
      kbGapDetected: false,
      kbGapSuggestion: null,
      usedItems: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsAnswering(true);

    try {
      let activeSessionId = conversationId;
      if (!activeSessionId) {
        const sessionRes = await createQuerySessionAction({
          roleKbId: selectedRoleKbId,
          domainId: selectedDomainId,
        });
        console.log("🟢 [F12 API RESPONSE] createQuerySessionAction:", sessionRes);
        if (sessionRes.status === "1" && sessionRes.data?.session?.id) {
          activeSessionId = sessionRes.data.session.id;
          setConversationId(activeSessionId);
          loadSessions(selectedRoleKbId);
        } else {
          const code = sessionRes.error_code;
          setErrorCode(code);
          if (code === "QUOTA_EXCEEDED") {
            setQuotaExceeded(true);
          } else if (code === "UNAUTHORIZED") {
            clearAuth();
            router.push(`/${locale}/login?returnUrl=/${locale}/query`);
          } else {
            setInlineError(sessionRes.msg || "Không thể tạo phiên hỏi đáp. Vui lòng thử lại.");
          }
          setIsAnswering(false);
          return;
        }
      }

      const res = await submitQueryMessageAction(activeSessionId, {
        question,
        scope: { roleKbId: selectedRoleKbId, domainId: selectedDomainId, knowledgeItemId: null },
      });
      console.log("🟢 [F12 API RESPONSE] submitQueryMessageAction:", res);

      if (res.status === "1" && res.data) {
        const d = res.data;
        const assistantMsg: QueryMessage = {
          id: d.assistantMessage.messageId,
          role: "assistant",
          content: d.assistantMessage.answer,
          citations: d.assistantMessage.citations || [],
          confidenceLevel: d.assistantMessage.confidence?.level || null,
          confidenceScore: d.assistantMessage.confidence?.score,
          freshnessStatus: d.assistantMessage.freshness?.status,
          freshnessMessage: d.assistantMessage.freshness?.message,
          kbGapDetected: d.assistantMessage.knowledgeGap?.hasGap || false,
          kbGapSuggestion: d.assistantMessage.knowledgeGap?.message || null,
          kbGapActions: d.assistantMessage.knowledgeGap?.recommendedActions || [],
          followUps: d.assistantMessage.followUps || [],
          usedItems: d.assistantMessage.citations?.length || 0,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        loadSessions();
        setTimeout(() => setShowCompileBar(true), 1500);
      } else {
        const code = res.error_code;
        setErrorCode(code);

        if (code === "QUOTA_EXCEEDED") {
          setQuotaExceeded(true);
        } else if (code === "UNAUTHORIZED") {
          clearAuth();
          router.push(`/${locale}/login?returnUrl=/${locale}/query`);
        } else {
          setInlineError(
            code === "KB_INSUFFICIENT"
              ? "KB_INSUFFICIENT"
              : res.msg || "Không thể xử lý câu hỏi. Vui lòng thử lại."
          );
        }
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      setInlineError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setIsAnswering(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [inputValue, isAnswering, selectedRoleKbId, selectedDomainId, conversationId, clearAuth, router, locale, loadSessions]);

  // ─── Keyboard handler ───
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ─── Example question click ───
  const handleExampleClick = (q: string) => {
    setInputValue(q);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // ─── Retry last question ───
  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((prev) => prev.filter((m) => m.id !== lastUser.id));
      setInputValue(lastUser.content);
      setInlineError(null);
      setErrorCode(null);
    }
  };

  const selectedRole = userRoles.find((r) => r.id === selectedRoleKbId);
  const canSend = inputValue.trim().length >= 2 && !isAnswering && !!selectedRoleKbId;
  const showKbEmpty = errorCode === "KB_INSUFFICIENT" || inlineError === "KB_INSUFFICIENT";
  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="h-screen w-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <AppHeader
        active="query"
        locale={locale}
        selectedRoleKbId={selectedRoleKbId}
        leftAction={!sidebarOpen ? (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.055] text-auth-text-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-colors hover:bg-white/[0.09] hover:text-white"
            title={t("query.expandSidebar", "Toggle sidebar")}
          >
            <LineIcon name="grid-alt" className="h-4 w-4" />
          </button>
        ) : undefined}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-row overflow-hidden">
      {/* Left Sidebar */}
      <aside
        id="sidebar"
        className={!sidebarOpen ? "collapsed" : ""}
      >
        <div className="sb-top">
          <div className="sb-row1 flex items-center justify-between mb-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-auth-text">
                Pulse
                <span className="text-auth-accent">
                  Knowledge
                </span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sb-collapse cursor-pointer"
              title={t("query.collapseSidebar", "Collapse")}
            >
              <LineIcon name="chevron-left" className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={handleClearConversation}
            className="btn-new-chat"
          >
            <LineIcon name="plus" className="h-3.5 w-3.5" />
            New Conversation
          </button>
        </div>

        <div className="sb-scroll select-none">
          {/* Active KB Context Selector */}
          {selectedRole && (
            <div className="mb-4 px-1 text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-auth-text-3 block mb-1">
                Active KB
              </label>
              <div className="flex items-center justify-between gap-2 bg-auth-bg/60 border border-white/[0.06] rounded-xl p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-auth-text truncate">
                    {selectedRole.roleName}
                  </p>
                  <span className="inline-block text-[9px] font-semibold text-auth-text-3 uppercase mt-0.5">
                    {selectedRole.roleGroup}
                  </span>
                </div>
                {userRoles.length > 1 && (
                  <Select
                    value={selectedRoleKbId}
                    onChange={handleRoleChange}
                    options={userRoles.map((r) => ({
                      value: r.id,
                      label: r.roleName,
                    }))}
                    align="right"
                    className="bg-auth-elevated border border-auth-border rounded-lg text-[10px] py-0.5 px-1.5"
                  />
                )}
              </div>
            </div>
          )}

          <div className="sb-group-label text-left">Recent Sessions</div>
          {isLoadingSessions ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="sb-empty text-center">
              <div className="sb-empty-icon-wrap">
                <LineIcon name="comment" className="h-4.5 w-4.5 text-auth-text-3/60" />
              </div>
              <p className="text-xs text-auth-text-3 max-w-[200px] leading-relaxed mx-auto">
                {t("query.noSessions", "Chưa có cuộc hội thoại nào.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-left">
              {sessions.map((s) => {
                const isActive = s.id === conversationId;
                const roleName = userRoles.find((r) => r.id === s.scope.roleKbId)?.roleName || "Fintech";
                return (
                  <div
                    key={s.id}
                    onClick={() => handleLoadSession(s.id)}
                    className={`conv-card ${isActive ? "active" : ""}`}
                  >
                    <div className="conv-card-head">
                      <span className="conv-card-icon">{s.scope.domainId ? "🌐" : "📚"}</span>
                      <span className="conv-card-title">{s.title || "Untitled Conversation"}</span>
                    </div>
                    {s.lastMessagePreview && (
                      <div className="conv-card-snippet">{s.lastMessagePreview}</div>
                    )}
                    <div className="conv-card-foot">
                      <span className="conv-domain-badge"> {roleName}</span>
                      <span className="conv-date">{formatTime(s.updatedAt || s.createdAt, locale)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <header className="hidden">
          <div className="px-6 flex h-full items-center justify-between relative">
            <div className="flex justify-start z-10">
              {!sidebarOpen && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
                    title={t("query.expandSidebar", "Toggle sidebar")}
                  >
                    <LineIcon name="grid-alt" className="h-4 w-4" />
                  </button>
                  <Link href={`/${locale}`} className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-auth-text">
                      Pulse
                      <span className="text-auth-accent">
                        Knowledge
                      </span>
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden justify-center items-center gap-1.5 lg:flex">
              <nav className="flex items-center gap-1.5">
                <Link
                  href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
                >
                  <LineIcon name="grid-alt" className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <Link
                  href={selectedRoleKbId ? `/${locale}/query?roleKbId=${selectedRoleKbId}` : `/${locale}/query`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
                >
                  <LineIcon name="comment" className="h-3.5 w-3.5" /> Query AI
                </Link>
                <Link
                  href={selectedRoleKbId ? `/${locale}/wiki?roleKbId=${selectedRoleKbId}` : `/${locale}/wiki`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
                >
                  <LineIcon name="book" className="h-3.5 w-3.5" /> Wiki
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4 justify-end z-10">
            {/* Search Trigger Button (Desktop - wide pill) */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 select-none cursor-pointer text-xs font-semibold"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <LineIcon name="search" className="h-3.5 w-3.5 text-auth-text-3/70" />
              <span>{locale === "vi" ? "Tìm kiếm..." : "Search..."}</span>
              <kbd className="inline-flex items-center ml-1 px-1.5 py-0.2 text-[8px] font-mono bg-white/5 border border-white/10 rounded text-auth-text-3">
                Ctrl K
              </kbd>
            </button>

            {/* Search Trigger Button (Tablet - compact icon) */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="hidden lg:flex xl:hidden h-8 w-8 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 cursor-pointer"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <LineIcon name="search" className="h-4 w-4 text-auth-text-3/70" />
            </button>

            {/* Mobile Search Trigger Icon */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
              title={locale === "vi" ? "Tìm kiếm" : "Search"}
            >
              <LineIcon name="search" className="h-4 w-4" />
            </button>

              <LocaleSwitcher id="query-header" />
              {authUser && (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-accent-400/30 border border-white/[0.12] text-[11px] font-bold text-white select-none">
                    {(authUser.displayName || authUser.email || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="hidden lg:flex flex-col items-start leading-none gap-0.5 text-left">
                    <span className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                      {authUser.displayName?.split(" ").slice(-1)[0] || authUser.email?.split("@")[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-auth-accent/80 uppercase tracking-wide">
                      {authUser.plan === "pro" ? "Pro Plan" : "Free Plan"}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isPending}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer"
                    title={t("common.logout", "Đăng xuất")}
                  >
                    {isPending ? <DotMatrixLoader variant="pulse" size="sm" /> : <LineIcon name="exit" className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <div id="chat-main" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="chat-topbar border-b border-white/[0.04]">
            <span className="chat-topbar-title text-left pl-2">
              {conversationId
                ? (sessions.find(s => s.id === conversationId)?.title || "Current Conversation")
                : "New Conversation"}
            </span>
          </div>

          {quotaExceeded && (
            <div className="px-4 pt-4 shrink-0">
              <QuotaExceededBanner locale={locale} t={t} />
            </div>
          )}

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {!selectedRoleKbId ? (
              <MissingRoleState locale={locale} />
            ) : showKbEmpty ? (
              <KbEmptyState locale={locale} t={t} roleKbId={selectedRoleKbId} />
            ) : messages.length === 0 && !isAnswering ? (
              <EmptyState onExampleClick={handleExampleClick} t={t} />
            ) : (
              <>
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <UserMessage key={msg.id} msg={msg} locale={locale} />
                  ) : (
                    <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      locale={locale}
                      onFeedback={handleFeedback}
                      t={t}
                      roleKbId={selectedRoleKbId}
                    />
                  )
                )}

                {/* Inline loading typing animation */}
                {isAnswering && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <div className="message-row text-left">
                    <div className="ai-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="ai-content">
                      <div className="ai-name">Pulse AI</div>
                      <div className="thinking-bar">
                        <div className="thinking-dot"></div>
                        <span>{t("query.thinking", "Đang nghiên cứu tri thức triệt để...")}</span>
                      </div>
                      <div className="ai-text">
                        <TypingIndicator t={t} />
                      </div>
                    </div>
                  </div>
                )}

                {inlineError && inlineError !== "KB_INSUFFICIENT" && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 mx-auto max-w-[840px] w-full text-left">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-red-300">{inlineError}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LineIcon name="sync" className="h-3 w-3" /> {t("common.retry")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer zone */}
          {!showKbEmpty && (
            <div id="input-zone">
              <div className="input-wrap select-none">
                <div className="input-box">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("query.placeholderTextarea", "Ask your knowledge base anything...")}
                    disabled={isAnswering || quotaExceeded}
                    rows={1}
                    className="input-textarea"
                  />
                  <div className="input-bar">
                    <div className="input-left">
                      {/* Nested Model Selector Dropdown */}
                      <div className="model-selector" ref={modelDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                          className={`model-btn ${modelDropdownOpen ? "open" : ""}`}
                          disabled={isAnswering}
                        >
                          <div className="model-dot" style={{ backgroundColor: modelDotColor }}></div>
                          <span>{selectedModel}</span>
                          <svg className="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <div className={`model-dropdown ${modelDropdownOpen ? "open" : ""}`}>
                          {models.map((m) => (
                            <div
                              key={m.name}
                              onClick={() => {
                                if (m.disabled) return;
                                setSelectedModel(m.name);
                                setModelDotColor(m.color);
                                setModelDropdownOpen(false);
                              }}
                              className={`model-option ${selectedModel === m.name ? "selected" : ""} ${m.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <div className="model-option-icon">{m.icon}</div>
                              <div className="model-info text-left">
                                <div className="model-info-name">
                                  {m.name}
                                  {m.pro && <span className="model-pro-tag">{m.max ? "Max" : "Pro"}</span>}
                                </div>
                                <div className="model-info-sub">{m.sub}</div>
                              </div>
                              {selectedModel === m.name && (
                                <svg className="model-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {m.disabled && <span className="model-lock">🔒</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Nested Domain Selector Dropdown */}
                      <div className="model-selector" ref={domainDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                          className={`domain-pill ${selectedDomainId ? "active" : ""} ${domainDropdownOpen ? "open" : ""}`}
                          disabled={isAnswering}
                        >
                          <span>{selectedDomainId ? "🌐" : "📚"}</span>
                          <span>{selectedDomainId ? (selectedDomain?.name || "Selected Domain") : (locale === "vi" ? "Tất cả Domain" : "All Domains")}</span>
                          <svg className="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <div className={`model-dropdown ${domainDropdownOpen ? "open" : ""}`} style={{ width: "220px" }}>
                          <div
                            onClick={() => {
                              setSelectedDomainId(null);
                              setDomainDropdownOpen(false);
                            }}
                            className={`model-option ${selectedDomainId === null ? "selected" : ""}`}
                          >
                            <div className="model-option-icon">📚</div>
                            <div className="model-info text-left">
                              <div className="model-info-name">{locale === "vi" ? "Tất cả Domain" : "All Domains"}</div>
                            </div>
                            {selectedDomainId === null && (
                              <svg className="model-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div className="model-divider"></div>
                          {domains.map((d) => (
                            <div
                              key={d.id}
                              onClick={() => {
                                setSelectedDomainId(d.id);
                                setDomainDropdownOpen(false);
                              }}
                              className={`model-option ${selectedDomainId === d.id ? "selected" : ""}`}
                            >
                              <div className="model-option-icon">🌐</div>
                              <div className="model-info text-left">
                                <div className="model-info-name">{d.name}</div>
                              </div>
                              {selectedDomainId === d.id && (
                                <svg className="model-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="input-right">
                      {/* Mic voice triggers (disabled per BA spec) */}
                      <button className="voice-btn" disabled title={locale === "vi" ? "Hỗ trợ giọng nói (Sắp ra mắt)" : "Voice input (Coming soon)"}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      </button>

                      {/* Send button */}
                      <button
                        onClick={handleSubmit}
                        disabled={!canSend || quotaExceeded}
                        className="send-btn"
                        title={t("query.button", "Gửi")}
                      >
                        {isAnswering ? (
                          <DotMatrixLoader variant="wave" size="sm" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keyboard hints footer */}
                <div className="input-footer">
                  <kbd>Enter ↵</kbd> {locale === "vi" ? "để gửi" : "to send"} &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> {locale === "vi" ? "để xuống dòng" : "for new line"} &nbsp;·&nbsp; Pulse AI may make mistakes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Floating Compile Insights Notification Bar */}
      {showCompileBar && lastAssistantMsg && (
        <div id="compileBar" className="text-left select-none animate-dropdown-enter">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.10] text-auth-text-2 flex items-center justify-center shrink-0">
              <LineIcon name="star" className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-auth-text">
                {locale === "vi" ? "Phát hiện tri thức mới!" : "New insights detected!"}
              </p>
              <p className="text-[10px] text-auth-text-2 mt-0.5 leading-relaxed">
                {locale === "vi"
                  ? "Câu trả lời này chứa các khái niệm mới. Bạn có muốn lưu vào Wiki không?"
                  : "This answer contains new concepts. Would you like to compile them to Wiki?"}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleSaveToWiki(lastAssistantMsg.id)}
                  className="bg-[var(--color-auth-error)] hover:bg-[var(--color-auth-error)]/80 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {locale === "vi" ? "Lưu vào Wiki" : "Compile to Wiki"}
                </button>
                <button
                  onClick={() => setShowCompileBar(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  {locale === "vi" ? "Để sau" : "Later"}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowCompileBar(false)}
              className="text-auth-text-3 hover:text-auth-text-2 transition-colors cursor-pointer"
            >
              <LineIcon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
