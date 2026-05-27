"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Microscope,
  Plus,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  BarChart3,
  FileText,
  Search,
} from "lucide-react";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import {
  createResearchRunAction,
  listResearchRunsAction,
} from "@/app/actions/research";
import type {
  ResearchRunDto,
  ResearchStatus,
  ResearchTrigger,
  ACTIVE_RESEARCH_STATUSES,
} from "@/types/research";

const ACTIVE_STATUSES: ResearchStatus[] = [
  "queued", "planning", "searching", "selecting_sources",
  "fetching_sources", "extracting_claims", "reflecting", "synthesizing",
];

function getStatusIcon(status: ResearchStatus) {
  if (ACTIVE_STATUSES.includes(status)) {
    return <DotMatrixLoader variant="pulse" size="xs" />;
  }
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-auth-accent" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    case "cancelled":
      return <XCircle className="h-3.5 w-3.5 text-auth-text-3" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-auth-text-3" />;
  }
}

function getStatusLabel(status: ResearchStatus, t: (key: string, fallback: string) => string): string {
  const map: Record<ResearchStatus, string> = {
    queued: t("research.status.queued", "Đang chờ"),
    planning: t("research.status.planning", "Lên kế hoạch"),
    searching: t("research.status.searching", "Đang tìm kiếm"),
    selecting_sources: t("research.status.selectingSources", "Chọn nguồn"),
    fetching_sources: t("research.status.fetchingSources", "Tải nguồn"),
    extracting_claims: t("research.status.extractingClaims", "Trích xuất"),
    reflecting: t("research.status.reflecting", "Đánh giá"),
    synthesizing: t("research.status.synthesizing", "Tổng hợp"),
    completed: t("research.status.completed", "Hoàn tất"),
    failed: t("research.status.failed", "Thất bại"),
    cancelled: t("research.status.cancelled", "Đã hủy"),
  };
  return map[status] ?? status;
}

function getConfidenceColor(score: number | null): string {
  if (score === null) return "text-auth-text-3";
  if (score >= 0.8) return "text-auth-accent";
  if (score >= 0.6) return "text-amber-400";
  return "text-red-400";
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  } catch {
    return dateStr;
  }
}

export function ResearchView() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useTranslation();

  const [query, setQuery] = useState("");
  const [trigger, setTrigger] = useState<ResearchTrigger>("explicit_research");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [runs, setRuns] = useState<ResearchRunDto[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadRuns = useCallback(async (cursor?: string) => {
    setIsLoadingRuns(true);
    setListError(null);
    try {
      const res = await listResearchRunsAction({
        limit: 20,
        cursor: cursor ?? undefined,
      });
      if (res.status === "1") {
        const items = res.data?.items ?? [];
        setRuns(cursor ? (prev) => [...prev, ...items] : items);
        setHasMore(res.data?.pageInfo?.hasMore ?? false);
        setNextCursor(res.data?.pageInfo?.nextCursor ?? null);
      } else {
        if (res.error_code === "RESEARCH_NOT_ENABLED") {
          // Feature disabled, show empty state
          setRuns([]);
        } else {
          setListError(res.msg || "Không tải được danh sách nghiên cứu.");
        }
      }
    } catch {
      setListError("Không kết nối được máy chủ.");
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await createResearchRunAction({
        trigger,
        query: trimmed,
        freshnessRequired: false,
        mode: "background",
        options: { saveTrace: true },
      });

      if (res.status === "1" && res.data?.researchRun?.id) {
        // Navigate to run detail
        setQuery("");
        router.push(`/${locale}/research/${res.data.researchRun.id}`);
      } else {
        const errMap: Record<string, string> = {
          RESEARCH_QUOTA_REACHED: "Bạn đã hết lượt nghiên cứu trong ngày. Nâng cấp Pro để có thêm lượt.",
          RESEARCH_RATE_LIMITED: "Thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
          TOO_MANY_ACTIVE_RESEARCH_RUNS: "Bạn đang có quá nhiều nghiên cứu đang chạy. Hủy một nghiên cứu để tiếp tục.",
          RESEARCH_NOT_ENABLED: "Tính năng Nghiên cứu AI đang bảo trì.",
          VALIDATION_ERROR: "Câu hỏi không hợp lệ. Kiểm tra lại (2–8000 ký tự).",
          NETWORK_ERROR: "Không kết nối được máy chủ.",
        };
        setCreateError(errMap[res.error_code] ?? `Không thể tạo nghiên cứu (${res.error_code}).`);
      }
    } catch {
      setCreateError("Không kết nối được máy chủ.");
    } finally {
      setIsCreating(false);
    }
  };

  const activeRuns = runs.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const historyRuns = runs.filter((r) => !ACTIVE_STATUSES.includes(r.status));

  return (
    <div className="min-h-screen bg-auth-bg text-white relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/3 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl">
        <div className="container-focused flex h-16 items-center gap-3">
          <Link href={`/${locale}/dashboard`} className="text-auth-text-2 hover:text-white transition-colors text-sm">
            ← {t("common.dashboard", "Dashboard")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-auth-text-3" />
          <span className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Microscope className="h-3.5 w-3.5 text-auth-accent" />
            {t("research.title", "Nghiên cứu AI")}
          </span>
        </div>
      </header>

      <main className="container-focused py-8 space-y-6 relative z-10">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("research.title", "Nghiên cứu AI")}
          </h1>
          <p className="text-sm text-auth-text-2 mt-1">
            {t("research.subtitle", "Nghiên cứu chuyên sâu tự động có nguồn gốc xác minh từ web.")}
          </p>
        </div>

        {/* ─── Create new research ─── */}
        <section className="rounded-2xl border border-auth-border bg-auth-surface p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent/40 to-transparent" />

          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-auth-accent" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {t("research.create.title", "Tạo nghiên cứu mới")}
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label htmlFor="research-query" className="block text-xs font-semibold text-auth-text-2 mb-1.5">
                {t("research.create.queryLabel", "Chủ đề nghiên cứu")}
              </label>
              <textarea
                id="research-query"
                rows={3}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (createError) setCreateError(null);
                }}
                placeholder={t("research.create.placeholder", "Nhập chủ đề hoặc câu hỏi bạn muốn nghiên cứu... (ví dụ: Best practices để deploy Next.js lên Vercel với Edge Runtime)")}
                className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-3 text-sm text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-colors resize-none"
                disabled={isCreating}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] ${query.length > 8000 ? "text-red-400" : "text-auth-text-3"}`}>
                  {query.length.toLocaleString()} / 8,000
                </span>
              </div>
            </div>

            {createError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2.5 text-xs text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-[10px] text-auth-text-3">
                {t("research.create.asyncNote", "Nghiên cứu chạy nền — bạn có thể xem tiến độ sau.")}
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating}
                disabled={query.trim().length < 2 || query.length > 8000}
                leftIcon={<Search className="h-3.5 w-3.5" />}
              >
                {t("research.create.button", "Bắt đầu nghiên cứu")}
              </Button>
            </div>
          </form>
        </section>

        {/* ─── Active runs ─── */}
        {activeRuns.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-auth-text-2 uppercase tracking-wider mb-3">
              {t("research.active.title", "Đang chạy")} ({activeRuns.length})
            </h2>
            <div className="space-y-2">
              {activeRuns.map((run) => (
                <ResearchRunCard key={run.id} run={run} locale={locale} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* ─── History ─── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-auth-text-2 uppercase tracking-wider">
              {t("research.history.title", "Lịch sử nghiên cứu")}
            </h2>
            <button
              onClick={() => loadRuns()}
              disabled={isLoadingRuns}
              className="flex items-center gap-1.5 text-xs text-auth-text-2 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRuns ? "animate-spin" : ""}`} />
            </button>
          </div>

          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-12 text-auth-text-3">
              <DotMatrixLoader variant="ripple" size="md" />
            </div>
          ) : listError ? (
            <div className="text-center py-8 space-y-3">
              <AlertCircle className="h-8 w-8 text-auth-text-3 mx-auto" />
              <p className="text-sm text-auth-text-2">{listError}</p>
              <Button variant="ghost" size="sm" onClick={() => loadRuns()}>
                {t("common.retry", "Thử lại")}
              </Button>
            </div>
          ) : historyRuns.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-auth-border rounded-2xl space-y-3">
              <Microscope className="h-10 w-10 text-auth-text-3 mx-auto opacity-50" />
              <p className="text-sm font-semibold text-auth-text-2">
                {t("research.history.empty", "Chưa có nghiên cứu nào")}
              </p>
              <p className="text-xs text-auth-text-3">
                {t("research.history.emptyDesc", "Tạo nghiên cứu đầu tiên để bắt đầu xây dựng kho nghiên cứu có nguồn gốc.")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyRuns.map((run) => (
                <ResearchRunCard key={run.id} run={run} locale={locale} t={t} />
              ))}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => nextCursor && loadRuns(nextCursor)}
                    isLoading={isLoadingRuns}
                  >
                    {t("research.history.loadMore", "Tải thêm")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Run Card ────────────────────────────────────────────────────

function ResearchRunCard({
  run,
  locale,
  t,
}: {
  run: ResearchRunDto;
  locale: string;
  t: (key: string, fallback: string) => string;
}) {
  const isActive = ACTIVE_STATUSES.includes(run.status);
  const isCompleted = run.status === "completed";

  return (
    <Link
      href={`/${locale}/research/${run.id}`}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:border-auth-accent/30 hover:bg-auth-elevated/50 group ${
        isActive
          ? "border-auth-accent/20 bg-auth-accent-dim/20"
          : "border-auth-border bg-auth-surface"
      }`}
    >
      {/* Status icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isActive ? "bg-auth-accent-dim" :
        isCompleted ? "bg-auth-accent-dim" :
        run.status === "failed" ? "bg-red-950/40" :
        "bg-auth-elevated"
      }`}>
        {getStatusIcon(run.status)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-auth-accent transition-colors">
          {run.query}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={`text-xs ${isActive ? "text-auth-accent" : "text-auth-text-3"}`}>
            {getStatusLabel(run.status, t)}
          </span>
          {isCompleted && run.overallConfidence !== null && (
            <span className={`text-xs font-semibold ${getConfidenceColor(run.overallConfidence)}`}>
              {Math.round(run.overallConfidence * 100)}% {t("research.confidence", "tin cậy")}
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs text-auth-text-3">
              <FileText className="h-3 w-3" />
              {run.sourceCount} {t("research.sources", "nguồn")}
            </span>
          )}
          <span className="text-xs text-auth-text-3">
            {formatRelativeTime(run.createdAt)}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-auth-text-3 shrink-0 group-hover:text-white transition-colors mt-1" />
    </Link>
  );
}
