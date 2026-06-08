"use client";

/**
 * CompileView — Source Ingestion Page (/compile/new)
 *
 * Premium 3-step flow:
 *   Step 1 — Chọn loại nguồn (text | url | file [locked])
 *   Step 2 — Nhập nội dung + tiêu đề gợi ý + chọn Knowledge Base
 *   Step 3 — Xử lý (live progress bar + stage translation)
 *
 * Uses createSourceAction to submit, then polls getCompileJobAction every 3s
 * until isTerminal === true or max 60 polls.
 */

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { useAuth } from "@/hooks/use-auth";
import { Select } from "../ui/select";
import { logoutAction } from "@/app/actions/auth";
import { getOnboardingStateAction } from "@/lib/client-api";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "../layout/locale-switcher";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { createSourceAction, getCompileJobAction } from "@/lib/client-api";
import type { RoleKbDto } from "@/types/onboarding";
import type { CompileJob } from "@/types/compile";

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const MAX_TEXT_CHARS = 50_000;
const MIN_TEXT_CHARS = 100;
const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 60;

type SourceTypeOption = "text" | "url";
type Step = 1 | 2 | 3;

function generateIdempotencyKey(): string {
  return `compile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ────────────────────────────────────────────────────────────────
// Stage / Status helpers
// ────────────────────────────────────────────────────────────────

function translateStage(stage: string, t: (path: string, defaultValue?: string) => string): string {
  switch (stage) {
    case "queued":
      return t("dashboard.stage.queued", "Đang xếp hàng (Queued)");
    case "validating":
      return t("dashboard.stage.validating", "Xác thực nguồn dữ liệu...");
    case "fetching_or_uploading":
    case "fetching":
      return t("dashboard.stage.fetching", "Đang tải nguồn (Uploading)");
    case "extracting":
      return t("dashboard.stage.extracting", "Đang trích xuất văn bản (Parsing)");
    case "normalizing":
      return t("dashboard.stage.normalizing", "Đang chuẩn hoá văn bản...");
    case "chunking":
      return t("dashboard.stage.chunking", "Chia nhỏ tài liệu (Scanning source)");
    case "summarizing":
      return t("dashboard.stage.summarizing", "Tạo bản tóm tắt...");
    case "indexing":
      return t("dashboard.stage.indexing", "Đang biên dịch kiến thức (Compiling to Wiki)");
    case "wiki_ready":
    case "wikiReady":
      return t("dashboard.stage.wikiReady", "Biên dịch thành công (Wiki item ready)");
    case "failed":
      return t("dashboard.stage.failed", "Biên dịch thất bại — Thử lại");
    case "cancelled":
      return t("dashboard.stage.cancelled", "Đã hủy bỏ");
    default:
      return t("dashboard.stage.compiling", "Đang xử lý...");
  }
}

function isURLValid(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

interface SourceTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

function SourceTypeCard({
  icon,
  title,
  description,
  selected,
  disabled = false,
  badge,
  onClick,
}: SourceTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col gap-3 rounded-2xl p-5 text-left transition-all duration-200
        ${disabled ? "cursor-not-allowed opacity-50 border border-white/[0.06] bg-auth-surface/20" : "cursor-pointer"}
        ${
          selected
            ? "border border-auth-accent/60 bg-auth-accent-dim shadow-[0_0_20px_rgba(52,211,153,0.12)]"
            : disabled
              ? ""
              : "premium-hover-card"
        }
      `}
    >

      {/* Pro badge */}
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all
          ${selected ? "bg-auth-accent text-black" : "bg-white/[0.06] text-auth-text-2 group-hover:text-auth-accent"}
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div>
        <p className={`text-sm font-bold ${selected ? "text-auth-accent" : "text-auth-text"}`}>
          {title}
        </p>
        <p className="mt-1 text-xs text-auth-text-3 leading-relaxed">{description}</p>
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full bg-auth-accent flex items-center justify-center">
          <LineIcon name="checkmark-circle" className="h-3 w-3 text-black" />
        </div>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────
// Progress bar
// ────────────────────────────────────────────────────────────────

interface StageProgressBarProps {
  job: CompileJob;
}

function StageProgressBar({ job }: StageProgressBarProps) {
  const { t } = useTranslation();
  const stages: CompileJob["stage"][] = [
    "queued",
    "validating",
    "fetching_or_uploading",
    "extracting",
    "normalizing",
    "chunking",
    "summarizing",
    "indexing",
    "wiki_ready",
  ];

  const currentIdx = stages.indexOf(job.stage);

  return (
    <div className="flex flex-col gap-3">
      {/* Animated progress bar */}
      <div className="w-full h-2 rounded-full bg-auth-bg border border-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700
            ${
              job.status === "failed"
                ? "bg-red-500"
                : job.status === "wiki_ready"
                  ? "bg-auth-accent"
                  : "bg-gradient-to-r from-auth-accent to-teal-400 animate-pulse"
            }
          `}
          style={{ width: `${Math.max(job.progress ?? 0, job.status === "wiki_ready" ? 100 : 0)}%` }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1 flex-wrap">
        {stages.slice(0, -1).map((stage, i) => {
          const passed = i < currentIdx;
          const active = i === currentIdx && job.status !== "wiki_ready" && job.status !== "failed";
          return (
            <div key={stage} className="flex items-center gap-1">
              <div
                className={`h-1.5 w-1.5 rounded-full transition-all
                  ${passed || job.status === "wiki_ready" ? "bg-auth-accent" : active ? "bg-auth-accent animate-pulse" : "bg-white/10"}
                `}
              />
              {i < stages.length - 2 && (
                <div className={`h-px w-3 ${passed || job.status === "wiki_ready" ? "bg-auth-accent/50" : "bg-white/[0.06]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage label */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${job.status === "failed" ? "text-red-400" : "text-auth-accent"}`}>
          {translateStage(job.stage, t)}
        </span>
        <span className="text-auth-text-3">
          {t("compile.labels.progressCompleted").replace("{progress}", String(job.progress ?? 0))}
        </span>
      </div>

      {job.message && (
        <p className="text-xs text-auth-text-2 italic">{job.message}</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main CompileView component
// ────────────────────────────────────────────────────────────────

export function CompileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useTranslation();

  // ── URL param ──
  const roleKbIdFromUrl = searchParams.get("roleKbId") ?? "";

  // ── Step state ──
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 state ──
  const [selectedSourceType, setSelectedSourceType] = useState<SourceTypeOption>("text");

  // ── Step 2 state ──
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [titleHint, setTitleHint] = useState("");
  const [selectedRoleKbId, setSelectedRoleKbId] = useState(roleKbIdFromUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  // ── Roles ──
  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // ── Step 3 / submission state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<CompileJob | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  // ── Polling refs ──
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const currentJobIdRef = useRef<string | null>(null);

  // ────────────────────────────────────────────────────────────────
  // 1. Load roles
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadRoles() {
      setRolesLoading(true);
      try {
        const res = await getOnboardingStateAction();
        console.log("🟢 [F12 API RESPONSE] getOnboardingStateAction:", res);
        if (res.status === "1" && res.data?.roles?.length) {
          setUserRoles(res.data.roles);
          // Default: use URL param if valid, else primary role or first role
          const validRole = res.data.roles.find((r) => r.id === roleKbIdFromUrl);
          let resolvedId = roleKbIdFromUrl;
          if (validRole) {
            setSelectedRoleKbId(validRole.id);
          } else if (res.data.roles[0]) {
            const defaultRole = res.data.roles.find((r) => r.isPrimary) || res.data.roles[0];
            resolvedId = defaultRole.id;
            setSelectedRoleKbId(resolvedId);
            // Update URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("roleKbId", resolvedId);
            router.replace(`/${locale}/compile/new?${newParams.toString()}`);
          }
        }
      } catch (err) {
        console.error("loadRoles error:", err);
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────────────────────
  // 2. Polling logic
  // ────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      currentJobIdRef.current = jobId;
      pollCountRef.current = 0;

      pollTimerRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        if (pollCountRef.current > MAX_POLLS) {
          stopPolling();
          setPollError(t("compile.errors.pollTimeout", "Quá thời gian chờ. Vui lòng kiểm tra lại trang Dashboard để xem kết quả."));
          return;
        }

        try {
          const res = await getCompileJobAction(jobId);
          console.log("🟢 [F12 API RESPONSE] getCompileJobAction:", res);
          if (res.status === "1" && res.data?.compileJob) {
            const job = res.data.compileJob;
            setCurrentJob(job);
            if (job.isTerminal) {
              stopPolling();
            }
          } else {
            // Non-fatal poll error — keep polling
            console.warn("poll non-success:", res.msg);
          }
        } catch (err) {
          console.error("poll error:", err);
          // Don't stop polling on transient network error
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // ────────────────────────────────────────────────────────────────
  // 3. Logout
  // ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    startTransition(async () => {
      clearAuth();
      await logoutAction();
    });
  };

  // ────────────────────────────────────────────────────────────────
  // 4. Validation
  // ────────────────────────────────────────────────────────────────
  function validateStep2(): boolean {
    let valid = true;
    setTextError(null);
    setUrlError(null);

    if (selectedSourceType === "text") {
      const trimmed = text.trim();
      if (trimmed.length < MIN_TEXT_CHARS) {
        setTextError(
          t("compile.errors.textMin", "Văn bản phải có ít nhất {min} ký tự (hiện tại: {count}).")
            .replace("{min}", String(MIN_TEXT_CHARS))
            .replace("{count}", String(trimmed.length))
        );
        valid = false;
      } else if (trimmed.length > MAX_TEXT_CHARS) {
        setTextError(
          t("compile.errors.textMax", "Văn bản không được vượt quá {max} ký tự.")
            .replace("{max}", MAX_TEXT_CHARS.toLocaleString())
        );
        valid = false;
      }
    } else {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setUrlError(t("compile.errors.urlEmpty", "Vui lòng nhập URL cần nạp."));
        valid = false;
      } else if (!isURLValid(trimmedUrl)) {
        setUrlError(t("compile.errors.urlInvalid", "URL không hợp lệ. Vui lòng nhập đúng định dạng https://..."));
        valid = false;
      }
    }

    if (!selectedRoleKbId) {
      valid = false;
    }

    return valid;
  }

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleKbId(roleId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("roleKbId", roleId);
    router.replace(`/${locale}/compile/new?${newParams.toString()}`);
  };

  // ────────────────────────────────────────────────────────────────
  // 5. Submit
  // ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setCurrentJob(null);
    setPollError(null);

    const idempotencyKey = generateIdempotencyKey();
    const payload = {
      roleKbId: selectedRoleKbId,
      sourceType: selectedSourceType,
      idempotencyKey,
      ...(selectedSourceType === "text" ? { text: text.trim() } : { url: url.trim() }),
      ...(titleHint.trim() ? { titleHint: titleHint.trim() } : {}),
    };

    const res = await createSourceAction(payload);
    console.log("🟢 [F12 API RESPONSE] createSourceAction:", res);
    setIsSubmitting(false);

    if (res.status === "1" && res.data?.compileJob) {
      const job = res.data.compileJob;
      setCurrentJob(job);
      setStep(3);

      if (!job.isTerminal) {
        startPolling(job.id);
      }
    } else {
      setSubmitError(res.msg || t("compile.errors.submitFailed", "Không thể bắt đầu xử lý tài liệu. Vui lòng thử lại."));
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Retry
  // ────────────────────────────────────────────────────────────────
  function handleRetry() {
    stopPolling();
    setCurrentJob(null);
    setPollError(null);
    setSubmitError(null);
    setStep(2);
  }

  function handleStartNew() {
    stopPolling();
    setCurrentJob(null);
    setPollError(null);
    setSubmitError(null);
    setText("");
    setUrl("");
    setTitleHint("");
    setTextError(null);
    setUrlError(null);
    setStep(1);
  }

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  const stepLabel = [
    t("compile.steps.step1", "Chọn loại nguồn"),
    t("compile.steps.step2", "Nhập nội dung"),
    t("compile.steps.step3", "Xử lý tài liệu")
  ];

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-[100px] top-[20%] h-[350px] w-[350px] blur-[100px]"
        style={{ background: "radial-gradient(circle, oklch(0.75 0.19 160 / 0.05) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl">
        <div className="container-focused flex h-16 items-center justify-between relative">
          <div className="flex justify-start z-10">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-auth-text">
                Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden justify-center items-center gap-1.5 lg:flex">
            <nav className="flex items-center gap-1.5">
              <Link
                href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LineIcon name="grid-alt" className="h-3.5 w-3.5" />
                {t("common.dashboard", "Dashboard")}
              </Link>
              <Link
                href={selectedRoleKbId ? `/${locale}/query?roleKbId=${selectedRoleKbId}` : `/${locale}/query`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LineIcon name="comment" className="h-3.5 w-3.5" />
                {t("compile.labels.sidebarQuery", "Hỏi đáp AI")}
              </Link>
              <Link
                href={selectedRoleKbId ? `/${locale}/wiki?roleKbId=${selectedRoleKbId}` : `/${locale}/wiki`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LineIcon name="book" className="h-3.5 w-3.5" />
                {t("compile.labels.sidebarWiki", "Wiki Cá nhân")}
              </Link>
              <Link
                href={`/${locale}/compile/new${selectedRoleKbId ? `?roleKbId=${selectedRoleKbId}` : ""}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <LineIcon name="upload" className="h-3.5 w-3.5" />
                {t("compile.labels.sidebarCompile", "Nạp tài liệu")}
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 select-none cursor-pointer text-xs font-semibold"
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
              className="hidden lg:flex xl:hidden h-8 w-8 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-auth-text-3 hover:text-auth-text-2 transition-all duration-300 cursor-pointer"
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

            <LocaleSwitcher id="compile-header" />
            {authUser && (
              <div className="flex items-center gap-2">
                {/* Avatar initials */}
                <div className="hidden lg:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-accent-400/30 border border-white/[0.12] text-[11px] font-bold text-white select-none">
                  {(authUser.displayName || authUser.email || "U").charAt(0).toUpperCase()}
                </div>

                {/* Name + plan (desktop only) */}
                <div className="hidden lg:flex flex-col items-start leading-none gap-0.5 text-left">
                  <span className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                    {authUser.displayName?.split(" ").slice(-1)[0] || authUser.email?.split("@")[0]}
                  </span>
                  <span className="text-[9px] font-semibold text-auth-accent/80 uppercase tracking-wide">
                    {authUser.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </span>
                </div>

                {/* Logout */}
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

      {/* ── Main Content ── */}
      <main className="container-focused-narrow flex-grow py-8 relative z-10 flex flex-col gap-6">
        {/* Page title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-auth-text-3 text-xs">
            <Link href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`} className="hover:text-auth-text transition-colors">
              {t("common.dashboard", "Dashboard")}
            </Link>
            <LineIcon name="chevron-right" className="h-3 w-3" />
            <span className="text-auth-text">{t("compile.labels.headerTitle", "Nạp nguồn tài liệu")}</span>
          </div>
          <h1 className="text-fluid-xl font-extrabold tracking-tight mt-1">
            {t("compile.labels.headerTitleNew", "Nạp nguồn tài liệu mới")}
          </h1>
          <p className="text-xs text-auth-text-2">
            {t("compile.labels.headerDesc", "Trích xuất tri thức từ văn bản hoặc trang web thành Wiki item có cấu trúc.")}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {stepLabel.map((label, i) => {
            const n = (i + 1) as Step;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all
                      ${isDone ? "bg-auth-accent border-auth-accent text-black" : isActive ? "border-auth-accent bg-auth-accent-dim text-auth-accent" : "border-white/10 bg-white/5 text-auth-text-3"}
                    `}
                  >
                    {isDone ? <LineIcon name="checkmark-circle" className="h-3.5 w-3.5" /> : n}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline
                      ${isActive ? "text-auth-text" : isDone ? "text-auth-accent" : "text-auth-text-3"}
                    `}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabel.length - 1 && (
                  <div className={`h-px w-8 transition-all ${isDone ? "bg-auth-accent/50" : "bg-white/[0.06]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ────────── STEP 1 — Chọn loại nguồn ────────── */}
        {step === 1 && (
          <div className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-6 premium-hover-card">

            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">
                {t("compile.labels.step1Title", "Bước 1 — Chọn loại nguồn tài liệu")}
              </h2>
              <p className="text-xs text-auth-text-2 mt-1">
                {t("compile.labels.step1Desc", "Chọn định dạng nguồn bạn muốn nạp vào Knowledge Base.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SourceTypeCard
                icon={<LineIcon name="files" className="h-5 w-5" />}
                title={t("compile.labels.sourceText", "Văn bản thuần")}
                description={t("compile.labels.sourceTextDesc", "Dán văn bản, ghi chú, bài viết hoặc tài liệu của bạn vào đây.")}
                selected={selectedSourceType === "text"}
                onClick={() => setSelectedSourceType("text")}
              />
              <SourceTypeCard
                icon={<LineIcon name="link" className="h-5 w-5" />}
                title={t("compile.labels.sourceUrl", "URL / Website")}
                description={t("compile.labels.sourceUrlDesc", "Crawl nội dung từ một trang web, bài blog hoặc tài liệu online.")}
                selected={selectedSourceType === "url"}
                onClick={() => setSelectedSourceType("url")}
              />
              <SourceTypeCard
                icon={<LineIcon name="lock" className="h-5 w-5" />}
                title={t("compile.labels.sourceFile", "Tải tệp lên")}
                description={t("compile.labels.sourceFileDesc", "PDF, TXT, Markdown — tính năng dành riêng cho gói Pro.")}
                selected={false}
                disabled
                badge="Pro"
                onClick={() => {}}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary-pulse text-sm"
              >
                {t("compile.labels.btnContinue", "Tiếp tục")}
                <LineIcon name="arrow-right" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ────────── STEP 2 — Nhập nội dung ────────── */}
        {step === 2 && (
          <div className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-6 premium-hover-card">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">
                  {t("compile.labels.step2Title", "Bước 2 — Nhập nội dung")}
                </h2>
                <p className="text-xs text-auth-text-2 mt-1">
                  {selectedSourceType === "text"
                    ? t("compile.labels.step2DescText", "Dán hoặc nhập văn bản bạn muốn phân tích.")
                    : t("compile.labels.step2DescUrl", "Nhập URL trang web cần trích xuất nội dung.")}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-auth-text-3">
                {selectedSourceType === "text" ? (
                  <>
                    <LineIcon name="files" className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">{t("compile.labels.badgeText", "Văn bản")}</span>
                  </>
                ) : (
                  <>
                    <LineIcon name="link" className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">{t("compile.labels.badgeUrl", "URL")}</span>
                  </>
                )}
              </div>
            </div>

            {/* Knowledge Base selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                {t("compile.labels.kbDestination", "Knowledge Base đích")} <span className="text-red-400">*</span>
              </label>
              {rolesLoading ? (
                <div className="h-10 bg-auth-elevated border border-auth-border rounded-xl flex items-center px-3 gap-2">
                  <DotMatrixLoader variant="pulse" size="xs" />
                  <span className="text-xs text-auth-text-3">{t("compile.labels.kbLoading", "Đang tải...")}</span>
                </div>
              ) : userRoles.length > 1 ? (
                <Select
                  value={selectedRoleKbId}
                  onChange={handleRoleChange}
                  options={userRoles.map((r) => ({
                    value: r.id,
                    label: r.roleName,
                    sublabel: r.roleGroup,
                  }))}
                  fullWidth
                  className="bg-auth-elevated border-auth-border rounded-xl py-2.5"
                />
              ) : userRoles.length === 1 ? (
                <div className="bg-auth-elevated border border-auth-border rounded-xl px-3 py-2.5 text-xs font-semibold text-auth-accent flex items-center gap-2">
                  <LineIcon name="star" className="h-3.5 w-3.5 shrink-0" />
                  <span>{userRoles[0].roleName}</span>
                  <span className="text-[10px] text-auth-text-3 font-normal">({userRoles[0].roleGroup})</span>
                </div>
              ) : (
                <div className="h-10 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center px-3 gap-2">
                  <LineIcon name="warning" className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs text-red-400">{t("compile.errors.noKb", "Không tìm thấy Knowledge Base. Hoàn tất onboarding trước.")}</span>
                </div>
              )}
            </div>

            {/* Content input */}
            {selectedSourceType === "text" ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                    {t("compile.labels.labelText", "Nội dung văn bản")} <span className="text-red-400">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-semibold tabular-nums transition-colors
                      ${text.length < MIN_TEXT_CHARS ? "text-amber-400" : text.length > MAX_TEXT_CHARS ? "text-red-400" : "text-auth-accent"}
                    `}
                  >
                    {text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTextError(null);
                  }}
                  rows={12}
                  placeholder={t("compile.labels.labelTextPlaceholder", "Dán văn bản, bài viết, tài liệu, ghi chú... vào đây. Tối thiểu 100 ký tự.")}
                  className="w-full resize-y bg-auth-elevated border border-auth-border rounded-xl text-auth-text placeholder:text-auth-text-3 text-sm px-4 py-3 focus:border-auth-accent focus:outline-none transition-all leading-relaxed"
                />
                {textError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
                    <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />
                    {textError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                  {t("compile.labels.labelUrl", "Địa chỉ URL")} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <LineIcon name="link" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-auth-text-3" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder={t("compile.labels.labelUrlPlaceholder", "https://example.com/article")}
                    className="w-full bg-auth-elevated border border-auth-border rounded-xl text-auth-text placeholder:text-auth-text-3 text-sm pl-10 pr-4 py-3 focus:border-auth-accent focus:outline-none transition-all"
                  />
                </div>
                {urlError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
                    <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />
                    {urlError}
                  </p>
                )}
                {url && isURLValid(url) && (
                  <div className="flex items-center gap-2 text-xs text-auth-text-2 bg-auth-elevated/50 border border-auth-border/50 rounded-lg px-3 py-2">
                    <LineIcon name="popup" className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{url}</span>
                  </div>
                )}
              </div>
            )}

            {/* Title hint */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                {t("compile.labelTitle", "Tiêu đề gợi ý")} <span className="text-auth-text-3 font-normal normal-case">({t("common.optional", "tùy chọn")})</span>
              </label>
              <input
                type="text"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
                placeholder={t("compile.labels.labelTitlePlaceholder", "VD: Hướng dẫn cấu hình Deploy (Tùy chọn)")}
                maxLength={200}
                className="w-full bg-auth-elevated border border-auth-border rounded-xl text-auth-text placeholder:text-auth-text-3 text-sm px-4 py-3 focus:border-auth-accent focus:outline-none transition-all"
              />
              <p className="text-[10px] text-auth-text-3">
                {t("compile.labels.labelTitleDesc", "Cung cấp tiêu đề giúp hệ thống phân loại tài liệu chính xác hơn.")}
              </p>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3">
                <LineIcon name="warning" className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{submitError}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setSubmitError(null); setTextError(null); setUrlError(null); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm transition-all"
              >
                <LineIcon name="arrow-left" className="h-4 w-4" />
                {t("compile.labels.btnBack", "Quay lại")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || rolesLoading || !selectedRoleKbId}
                className="btn-primary-pulse text-sm"
              >
                {isSubmitting ? (
                  <>
                    <DotMatrixLoader variant="pulse" size="sm" />
                    {t("common.sending", "Đang gửi...")}
                  </>
                ) : (
                  <>
                    <LineIcon name="star" className="h-4 w-4" />
                    {t("compile.labels.btnCompile", "Bắt đầu Ingest")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ────────── STEP 3 — Xử lý ────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            {/* Processing card */}
            {currentJob && (
              <div
                className={`backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-6 ${
                  currentJob.status === "failed"
                    ? "premium-hover-card-red"
                    : currentJob.status === "wiki_ready"
                      ? "premium-hover-card"
                      : "premium-hover-card-cyan"
                }`}
              >

                {/* Status header */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">
                      {t("compile.labels.step3Title", "Bước 3 — Xử lý tài liệu")}
                    </h2>
                    <p className="text-xs text-auth-text-2 mt-1">
                      {currentJob.title || t("compile.labels.statusProcessing", "Tài liệu đang được phân tích...")}
                    </p>
                  </div>

                  {/* Status badge */}
                  {currentJob.status === "wiki_ready" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                      <LineIcon name="checkmark-circle" className="h-3.5 w-3.5" />
                      {t("common.success", "Hoàn thành")}
                    </span>
                  ) : currentJob.status === "failed" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/40 border border-red-500/20 text-red-400">
                      <LineIcon name="xmark-circle" className="h-3.5 w-3.5" />
                      {t("common.error", "Lỗi xử lý")}
                    </span>
                  ) : currentJob.status === "cancelled" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-950/40 border border-amber-500/20 text-amber-400">
                      <LineIcon name="warning" className="h-3.5 w-3.5" />
                      {t("common.cancel", "Đã hủy")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
                      <DotMatrixLoader variant="pulse" size="xs" />
                      {t("compile.labels.statusProcessing", "Đang xử lý")}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <StageProgressBar job={currentJob} />

                {/* Poll timeout error */}
                {pollError && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
                    <LineIcon name="warning" className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">{pollError}</p>
                  </div>
                )}

                {/* Error details */}
                {currentJob.status === "failed" && currentJob.error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3">
                    <LineIcon name="warning" className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-red-400">{t("compile.labels.detailPrefix", "Chi tiết lỗi")}</p>
                      <p className="text-xs text-red-400/80">{currentJob.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SUCCESS state ── */}
            {currentJob?.status === "wiki_ready" && (
              <div className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-5 premium-hover-card">

                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center">
                    <LineIcon name="checkmark-circle" className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-auth-text">{t("compile.success", "Tài liệu đã được biên soạn thành công!")}</h3>
                    <p className="text-xs text-auth-text-2 mt-1">
                      {t("compile.labels.successDesc", "Wiki item đã được tạo và lập chỉ mục vào Knowledge Base của bạn.")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {currentJob.outputKnowledgeItemId && (
                    <Link
                      href={`/${locale}/wiki/items/${currentJob.outputKnowledgeItemId}`}
                      className="btn-primary-pulse flex-1 text-sm"
                    >
                      <LineIcon name="book" className="h-4 w-4" />
                      {t("compile.labels.btnViewWiki", "Xem Wiki item")}
                      <LineIcon name="popup" className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm transition-all"
                  >
                    <LineIcon name="upload" className="h-4 w-4" />
                    {t("compile.labels.btnNewDoc", "Nạp tài liệu mới")}
                  </button>
                  <Link
                    href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm transition-all"
                  >
                    <LineIcon name="grid-alt" className="h-4 w-4" />
                    {t("common.dashboard", "Dashboard")}
                  </Link>
                </div>
              </div>
            )}

            {/* ── FAILED state ── */}
            {currentJob?.status === "failed" && (
              <div className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-5 premium-hover-card-red">

                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center">
                    <LineIcon name="xmark-circle" className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-auth-text">{t("compile.errors.compileFailed", "Xử lý thất bại")}</h3>
                    <p className="text-xs text-auth-text-2 mt-1">
                      {currentJob.retryable
                        ? t("compile.errors.retryable", "Đã xảy ra lỗi trong quá trình biên soạn. Bạn có thể thử lại.")
                        : t("compile.errors.unsupported", "Tài liệu không thể xử lý được. Vui lòng kiểm tra lại nguồn dữ liệu.")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {currentJob.retryable && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="btn-primary-pulse flex-1 text-sm"
                    >
                      <LineIcon name="sync" className="h-4 w-4" />
                      {t("common.retry", "Thử lại")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm transition-all"
                  >
                    <LineIcon name="upload" className="h-4 w-4" />
                    {t("compile.labels.btnNewDoc", "Nạp tài liệu mới")}
                  </button>
                  <Link
                    href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm transition-all"
                  >
                    <LineIcon name="grid-alt" className="h-4 w-4" />
                    {t("common.dashboard", "Dashboard")}
                  </Link>
                </div>
              </div>
            )}

            {/* ── Still processing — waiting state ── */}
            {currentJob && !currentJob.isTerminal && !pollError && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-3">
                <DotMatrixLoader variant="pulse" size="sm" />
                <p className="text-xs text-blue-400">
                  {t("compile.labels.step3Desc", "Hệ thống đang biên soạn. Trang sẽ tự cập nhật — bạn không cần làm gì thêm.")}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
