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
import {
  MessageSquare,
  Send,
  Trash2,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LogOut,

  AlertTriangle,
  AlertCircle,
  Zap,
  Database,
  ExternalLink,
  Sparkles,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Select } from "../ui/select";
import { logoutAction } from "@/app/actions/auth";
import { createQuerySessionAction, submitQueryMessageAction } from "@/app/actions/query";
import { getOnboardingStateAction } from "@/app/actions/onboarding";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "../layout/locale-switcher";
import { Search } from "lucide-react";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import type { QueryCitation } from "@/types/query";
import type { RoleKbDto } from "@/types/onboarding";

export interface QueryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: QueryCitation[];
  confidenceLevel: "high" | "medium" | "low" | null;
  kbGapDetected: boolean;
  kbGapSuggestion: string | null;
  usedItems: number;
  createdAt: string;
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
          className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

/** Confidence level pill badge */
function ConfidenceBadge({ level, t }: { level: "high" | "medium" | "low"; t: (path: string) => string }) {
  const map = {
    high: {
      label: t("query.confidenceHigh"),
      cls: "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400",
      Icon: CheckCircle2,
    },
    medium: {
      label: t("query.confidenceMedium"),
      cls: "bg-amber-950/40 border border-amber-500/20 text-amber-400",
      Icon: TrendingUp,
    },
    low: {
      label: t("query.confidenceLow"),
      cls: "bg-red-950/40 border border-red-500/20 text-red-400",
      Icon: AlertTriangle,
    },
  };
  const { label, cls, Icon } = map[level];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
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
      className="flex-shrink-0 w-64 bg-auth-elevated border border-auth-border hover:border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2 transition-all group hover:shadow-[0_0_15px_rgba(52,211,153,0.08)] cursor-pointer"
    >
      {/* Index + domain */}
      <div className="flex items-center justify-between gap-2">
        <span className="h-5 w-5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-auth-text-3 bg-auth-bg/60 border border-white/[0.06] px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
          {citation.domain?.name || "Unknown"}
        </span>
        <ExternalLink className="h-3 w-3 text-auth-text-3 group-hover:text-emerald-400 transition-colors shrink-0" />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-auth-text line-clamp-2 leading-snug">
        {citation.knowledgeItemTitle}
      </p>

      {/* Snippet */}
      <p className="text-[11px] text-auth-text-2 line-clamp-2 leading-relaxed">
        {citation.excerpt}
      </p>

      {/* Relevance bar */}
      <div className="flex items-center gap-2 mt-auto">
        <div className="flex-1 h-1 bg-auth-bg rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-emerald-400">{score}%</span>
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
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <BookOpen className="h-3 w-3" />
        {t("query.citationsCount", "{count} sources").replace("{count}", citations.length.toString())}
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
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
function KbGapWarning({ suggestion, locale, t }: { suggestion: string | null; locale: string; t: (path: string) => string }) {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-amber-300">{t("query.gapTitle")}</p>
        {suggestion && (
          <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">{suggestion}</p>
        )}
        <Link
          href={`/${locale}/compile/new`}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus className="h-3 w-3" /> {t("query.gapButton")}
        </Link>
      </div>
    </div>
  );
}

/** User message bubble */
function UserMessage({ msg, locale }: { msg: QueryMessage; locale: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="bg-auth-elevated border border-auth-border rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-auth-text whitespace-pre-wrap leading-relaxed break-words">
            {msg.content}
          </p>
        </div>
        <p className="text-[10px] text-auth-text-3 mt-1 text-right">{formatTime(msg.createdAt, locale)}</p>
      </div>
    </div>
  );
}

/** Assistant message (no bubble) */
function AssistantMessage({ msg, locale, t }: { msg: QueryMessage; locale: string; t: (path: string, defaultValue?: string) => string }) {
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[90%]">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-auth-text-3 uppercase tracking-wider">
            Pulse AI
          </span>
          {msg.confidenceLevel && (
            <ConfidenceBadge level={msg.confidenceLevel} t={t} />
          )}
          <span className="ml-auto text-[10px] text-auth-text-3">
            {formatTime(msg.createdAt, locale)}
          </span>
        </div>

        {/* Answer text */}
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-sm text-auth-text-2 leading-relaxed whitespace-pre-wrap m-0 break-words">
            {msg.content}
          </p>
        </div>

        {/* KB Gap warning */}
        {msg.kbGapDetected && (
          <KbGapWarning suggestion={msg.kbGapSuggestion} locale={locale} t={t} />
        )}

        {/* Citations */}
        <CitationsPanel citations={msg.citations} t={t} />

        {/* Used items info */}
        {msg.usedItems > 0 && (
          <p className="mt-2 text-[10px] text-auth-text-3">
            {t("query.sourceSummary", "Synthesized from {count} knowledge items").replace("{count}", msg.usedItems.toString())}
          </p>
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
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.1)]">
          <MessageSquare className="h-10 w-10 text-emerald-400" />
        </div>
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-30"
          style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160) 0%, transparent 70%)" }}
        />
      </div>

      <h2 className="text-fluid-xl font-extrabold tracking-tight mb-2">
        {t("query.startTitle")}
      </h2>
      <p className="text-xs text-auth-text-2 max-w-sm leading-relaxed mb-8">
        {t("query.startDesc")}
      </p>

      {/* Example chips */}
      <div className="flex flex-col gap-2.5 w-full max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1">
          {t("query.suggestedQuestions")}
        </p>
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onExampleClick(q)}
            className="w-full text-left bg-auth-surface/40 border border-white/[0.06] hover:border-emerald-500/30 hover:bg-auth-elevated rounded-xl px-4 py-3 text-xs text-auth-text-2 hover:text-auth-text transition-all group"
          >
            <span className="text-emerald-400 mr-2 group-hover:mr-3 transition-all">→</span>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Special empty KB error state */
function KbEmptyState({ locale, t }: { locale: string; t: (path: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-center mb-6">
        <Database className="h-10 w-10 text-amber-400" />
      </div>
      <h2 className="text-fluid-xl font-extrabold tracking-tight mb-2">
        {t("query.emptyKbTitle")}
      </h2>
      <p className="text-xs text-auth-text-2 max-w-sm leading-relaxed mb-6">
        {t("query.emptyKbDesc")}
      </p>
      <Link
        href={`/${locale}/compile/new`}
        className="btn-primary-pulse text-sm"
      >
        <Plus className="h-4 w-4" />
        {t("query.emptyKbButton")}
      </Link>
    </div>
  );
}

/** Quota exceeded state */
function QuotaExceededBanner({ locale, t }: { locale: string; t: (path: string) => string }) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-red-300">{t("query.limitTitle")}</p>
        <p className="text-xs text-red-200/70 mt-1">
          {t("query.limitDesc")}
        </p>
        <Link
          href={`/${locale}/settings/billing`}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" /> {t("query.limitButton")}
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
  const [selectedRoleKbId, setSelectedRoleKbId] = useState<string>(() => searchParams.get("roleKbId") || "");
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Bootstrap: load roles ───
  useEffect(() => {
    const initRoleKbId = searchParams.get("roleKbId") || "";

    const loadRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const res = await getOnboardingStateAction();
        if (res.status === "1" && res.data?.roles) {
          setUserRoles(res.data.roles);
          // If no roleKbId from params, use primary role
          if (!initRoleKbId) {
            const primary = res.data.roles.find((r) => r.isPrimary) || res.data.roles[0];
            if (primary) setSelectedRoleKbId(primary.id);
          }
        }
      } catch (err) {
        console.error("loadRoles error:", err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const maxH = 200; // Allow expansion up to 200px (approx 8 rows) for spacious inputting
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
    textareaRef.current?.focus();
  };

  // ─── Handle role change ───
  const handleRoleChange = (roleKbId: string) => {
    setSelectedRoleKbId(roleKbId);
    // Clear conversation when switching roles
    setMessages([]);
    setConversationId(undefined);
    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);
  };

  // ─── Submit question ───
  const handleSubmit = useCallback(async () => {
    const question = inputValue.trim();
    if (!question || isAnswering || !selectedRoleKbId) return;

    setInlineError(null);
    setErrorCode(null);
    setQuotaExceeded(false);

    // Optimistic: add user message
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
        // Create session first
        const sessionRes = await createQuerySessionAction({
          roleKbId: selectedRoleKbId,
        });
        if (sessionRes.status === "1" && sessionRes.data?.session?.id) {
          activeSessionId = sessionRes.data.session.id;
          setConversationId(activeSessionId);
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

      // Submit message
      const res = await submitQueryMessageAction(activeSessionId, {
        question,
        scope: {
          roleKbId: selectedRoleKbId,
          domainId: null,
          knowledgeItemId: null,
        },
      });

      if (res.status === "1" && res.data) {
        const d = res.data;
        const assistantMsg: QueryMessage = {
          id: d.assistantMessage.messageId,
          role: "assistant",
          content: d.assistantMessage.answer,
          citations: d.assistantMessage.citations || [],
          confidenceLevel: d.assistantMessage.confidence?.level || null,
          kbGapDetected: d.assistantMessage.knowledgeGap?.hasGap || false,
          kbGapSuggestion: d.assistantMessage.knowledgeGap?.message || null,
          usedItems: d.assistantMessage.citations?.length || 0,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
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
      textareaRef.current?.focus();
    }
  }, [inputValue, isAnswering, selectedRoleKbId, conversationId, clearAuth, router]);

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
      // Remove the last user message and re-submit
      setMessages((prev) => prev.filter((m) => m.id !== lastUser.id));
      setInputValue(lastUser.content);
      setInlineError(null);
      setErrorCode(null);
    }
  };

  // ─── Computed values ───
  const selectedRole = userRoles.find((r) => r.id === selectedRoleKbId);
  const canSend = inputValue.trim().length > 0 && !isAnswering && !!selectedRoleKbId;
  const showKbEmpty = errorCode === "KB_INSUFFICIENT" || inlineError === "KB_INSUFFICIENT";

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ──────────── Header ──────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl h-16">
        <div className="container-focused flex h-full items-center justify-between relative">
          <div className="flex justify-start z-10">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-auth-text">
                Pulse
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Knowledge
                </span>
              </span>
            </Link>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden justify-center items-center gap-1.5 md:flex">
            <nav className="flex items-center gap-1.5">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link
                href={`/${locale}/query`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Hỏi đáp AI
              </Link>
              <Link
                href={`/${locale}/wiki`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" /> Wiki Cá nhân
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 select-none cursor-pointer text-xs font-semibold"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <Search className="h-3.5 w-3.5 text-auth-text-3/70" />
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
              className="hidden md:flex lg:hidden h-8 w-8 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 cursor-pointer"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <Search className="h-4 w-4 text-auth-text-3/70" />
            </button>

            {/* Mobile Search Trigger Icon */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
              title={locale === "vi" ? "Tìm kiếm" : "Search"}
            >
              <Search className="h-4 w-4" />
            </button>

            <LocaleSwitcher id="query-header" />
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-auth-text">
                {authUser?.displayName || authUser?.email}
              </div>
              <span className="inline-flex mt-0.5 items-center gap-1 rounded-full border border-auth-accent/20 bg-auth-accent-dim px-2 py-0.5 text-[10px] font-semibold text-auth-accent">
                {authUser?.plan === "pro" ? t("common.proPlan", "Pro Plan") : t("common.freePlan", "Free Plan")}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
              title={t("common.logout", "Đăng xuất")}
            >
              {isPending ? (
                <DotMatrixLoader variant="pulse" size="sm" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ──────────── Main Split Layout ──────────── */}
      <div className="flex flex-1 overflow-hidden container-focused py-6 gap-6 relative z-10">
        {/* ──────── Left Sidebar ──────── */}
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col gap-4">
          <div className="backdrop-blur-md rounded-2xl p-5 relative premium-hover-card">

            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-3">
              {t("query.sidebarKb", "Knowledge Base đang dùng")}
            </p>

            {isLoadingRoles ? (
              <div className="flex items-center gap-2 text-xs text-auth-text-3">
                <DotMatrixLoader variant="pulse" size="sm" />
                {t("common.loading", "Đang tải...")}
              </div>
            ) : selectedRole ? (
              <>
                {/* Role name */}
                <div className="flex items-start gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-auth-text truncate">
                      {selectedRole.roleName}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-auth-text-3 bg-auth-bg/60 border border-white/[0.06] rounded-full px-2 py-0.5 mt-0.5">
                      {selectedRole.roleGroup}
                    </span>
                  </div>
                </div>

                {/* Role selector for multi-role */}
                {userRoles.length > 1 && (
                  <div className="mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 block mb-1.5">
                      {t("query.changeKb", "Chuyển KB")}
                    </label>
                    <Select
                      value={selectedRoleKbId}
                      onChange={handleRoleChange}
                      options={userRoles.map((r) => ({
                        value: r.id,
                        label: r.roleName,
                        sublabel: r.roleGroup,
                      }))}
                      fullWidth
                      className="bg-auth-elevated border border-auth-border rounded-xl py-2"
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-auth-text-3">{t("query.noKbSelected", "Chưa chọn Knowledge Base")}</p>
            )}

            {/* Conversation info */}
            {conversationId && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-auth-text-3">
                  {t("query.activeSession", "Phiên hội thoại đang hoạt động")}
                </p>
                <p className="text-[10px] font-mono text-auth-text-3 truncate mt-0.5">
                  {conversationId.slice(0, 18)}...
                </p>
              </div>
            )}
          </div>

          <div className="backdrop-blur-md rounded-2xl p-5 flex flex-col gap-2.5 relative premium-hover-card">

            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1">
              {t("query.actions", "Thao tác")}
            </p>

            <Link
              href={`/${locale}/compile/new`}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-semibold text-auth-text-2 hover:text-white transition-all"
            >
              <Plus className="h-4 w-4 text-auth-accent" />
              {t("query.gapButton", "Nạp thêm tài liệu")}
            </Link>

            <button
              onClick={handleClearConversation}
              disabled={messages.length === 0}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-950/30 hover:border-red-500/20 px-3 py-2.5 text-xs font-semibold text-auth-text-2 hover:text-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {t("query.deleteSession", "Xóa cuộc hội thoại")}
            </button>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-white/[0.04] bg-auth-surface/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-2">
              {t("query.tips", "Mẹo sử dụng")}
            </p>
            <ul className="space-y-1.5">
              {[
                t("query.tipsList.0", "Đặt câu hỏi cụ thể để có câu trả lời chính xác hơn"),
                t("query.tipsList.1", "Enter để gửi, Shift+Enter để xuống dòng"),
                t("query.tipsList.2", "Trích dẫn có thể mở rộng để xem nguồn đầy đủ"),
              ].map((tip) => (
                <li key={tip} className="text-[11px] text-auth-text-3 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ──────── Main Chat Area ──────── */}
        <div className="flex-1 flex flex-col min-h-0 backdrop-blur-md rounded-2xl overflow-hidden relative premium-hover-card">

          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-auth-text">{t("query.headerTitle", "Hỏi đáp AI")}</p>
                <p className="text-[10px] text-auth-text-3">
                  {selectedRole ? selectedRole.roleName : t("query.selectKbPlaceholder", "Chọn Knowledge Base để bắt đầu")}
                </p>
              </div>
            </div>

            {/* Mobile: clear conversation */}
            <button
              onClick={handleClearConversation}
              disabled={messages.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-auth-text-2 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("query.btnDelete", "Xóa hội thoại")}</span>
            </button>
          </div>

          {/* Quota exceeded banner */}
          {quotaExceeded && (
            <div className="px-4 pt-4 shrink-0">
              <QuotaExceededBanner locale={locale} t={t} />
            </div>
          )}

          {/* ── Messages area ── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {showKbEmpty ? (
              <KbEmptyState locale={locale} t={t} />
            ) : messages.length === 0 && !isAnswering ? (
              <EmptyState onExampleClick={handleExampleClick} t={t} />
            ) : (
              <>
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <UserMessage key={msg.id} msg={msg} locale={locale} />
                  ) : (
                    <AssistantMessage key={msg.id} msg={msg} locale={locale} t={t} />
                  )
                )}

                {/* Typing indicator */}
                {isAnswering && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <TypingIndicator t={t} />
                    </div>
                  </div>
                )}

                {/* Inline error (non-KB-empty, non-quota) */}
                {inlineError && inlineError !== "KB_INSUFFICIENT" && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-red-300">{inlineError}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> {t("common.retry")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area (sticky bottom) ── */}
          {!showKbEmpty && (
            <div className="shrink-0 border-t border-white/[0.06] px-5 py-4 bg-auth-bg/40 backdrop-blur-md">
              {/* Role selector (mobile + top of input) */}
              <div className="flex items-center justify-end mb-2.5 gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                  KB:
                </label>
                {isLoadingRoles ? (
                  <span className="text-[10px] text-auth-text-3 animate-pulse">{t("common.loading", "Đang tải...")}</span>
                ) : (
                  <Select
                    value={selectedRoleKbId}
                    onChange={handleRoleChange}
                    options={
                      userRoles.length === 0
                        ? [{ value: "", label: t("query.noKb", "Chưa có KB") }]
                        : userRoles.map((r) => ({
                            value: r.id,
                            label: r.roleName,
                            sublabel: r.roleGroup,
                          }))
                    }
                    align="right"
                    className="bg-auth-elevated border border-auth-border rounded-lg px-2.5 py-1 text-[11px] max-w-[180px]"
                  />
                )}
              </div>

              {/* Textarea + send button row */}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("query.placeholderTextarea", "Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter để xuống dòng)")}
                    disabled={isAnswering || quotaExceeded}
                    rows={1}
                    className="w-full bg-auth-elevated border border-auth-border rounded-xl text-auth-text placeholder:text-auth-text-3 text-sm pl-4 pr-12 py-3 resize-none focus:outline-none focus:border-auth-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                    style={{ minHeight: "48px", maxHeight: "200px" }}
                  />
                  {inputValue.length > 0 && (
                    <div className="absolute right-3.5 bottom-2 text-[10px] font-mono text-auth-text-3 select-none pointer-events-none bg-auth-elevated/90 px-1 rounded backdrop-blur-sm">
                      {inputValue.length}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSend || quotaExceeded}
                  className="shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-r from-[var(--color-auth-accent-dark)] to-[oklch(0.50_0.12_175)] text-white rounded-full shadow-[0_2px_12px_var(--color-auth-accent-glow)] hover:shadow-[0_6px_22px_var(--color-auth-accent-glow)] hover:-translate-y-[1px] active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title={t("query.button", "Gửi")}
                >
                  {isAnswering ? (
                    <DotMatrixLoader variant="wave" size="md" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Disclaimer */}
              <p className="mt-2 text-center text-[10px] text-auth-text-3">
                {t("query.subtitle", "Hỏi đáp dựa trên Knowledge Base của bạn. Câu trả lời có trích dẫn nguồn.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
