"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import Loading from "@/app/[locale]/loading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/locale-context";
import {
  getResearchRunAction,
  getResearchRunSourcesAction,
  getResearchRunClaimsAction,
  cancelResearchRunAction,
  saveResearchToWikiAction,
} from "@/app/actions/research";
import type {
  ResearchRunDto,
  ResearchRunDetailData,
  ResearchSourceDto,
  ResearchClaimDto,
  ResearchStatus,
  ConfidenceLevel,
} from "@/types/research";

const ACTIVE_STATUSES: ResearchStatus[] = [
  "queued", "planning", "searching", "selecting_sources",
  "fetching_sources", "extracting_claims", "reflecting", "synthesizing",
];

const POLL_INTERVAL_MS = 4000;

function getConfidenceBadge(level: ConfidenceLevel, score: number) {
  const pct = Math.round(score * 100);
  switch (level) {
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
          <LineIcon name="checkmark-circle" className="h-3 w-3" />
          Tin cậy cao — {pct}%
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/40 border border-amber-500/20 text-amber-400">
          <LineIcon name="shield" className="h-3 w-3" />
          Tin cậy vừa — {pct}%
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/40 border border-red-500/20 text-red-400">
          <LineIcon name="warning" className="h-3 w-3" />
          Tin cậy thấp — {pct}%
        </span>
      );
  }
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  queued: <LineIcon name="alarm" className="h-4 w-4" />,
  planning: <LineIcon name="brain-alt" className="h-4 w-4" />,
  searching: <LineIcon name="world" className="h-4 w-4" />,
  selecting_sources: <LineIcon name="search" className="h-4 w-4" />,
  fetching_sources: <LineIcon name="search" className="h-4 w-4" />,
  extracting_claims: <LineIcon name="quotation" className="h-4 w-4" />,
  reflecting: <LineIcon name="bulb" className="h-4 w-4" />,
  synthesizing: <LineIcon name="brain-alt" className="h-4 w-4" />,
  completed: <LineIcon name="checkmark-circle" className="h-4 w-4" />,
  failed: <LineIcon name="xmark-circle" className="h-4 w-4" />,
  cancelled: <LineIcon name="xmark-circle" className="h-4 w-4" />,
};

const STAGE_LABELS: Record<string, string> = {
  queued: "Đang xếp hàng...",
  planning: "Lên kế hoạch nghiên cứu...",
  searching: "Tìm kiếm trên web...",
  selecting_sources: "Chọn nguồn phù hợp...",
  fetching_sources: "Tải nội dung nguồn...",
  extracting_claims: "Trích xuất bằng chứng...",
  reflecting: "Đánh giá chất lượng...",
  synthesizing: "Tổng hợp kết quả...",
  completed: "Hoàn tất",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};

interface ResearchRunDetailProps {
  runId: string;
}

export function ResearchRunDetail({ runId }: ResearchRunDetailProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [detail, setDetail] = useState<ResearchRunDetailData | null>(null);
  const [sources, setSources] = useState<ResearchSourceDto[]>([]);
  const [claims, setClaims] = useState<ResearchClaimDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedWikiUrl, setSavedWikiUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"synthesis" | "sources" | "claims" | "plan">("synthesis");

  const fetchDetail = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getResearchRunAction(runId);
      if (res.status === "1") {
        setDetail(res.data);

        const run = res.data?.researchRun;
        // If completed, also fetch sources + claims
        if (run?.status === "completed") {
          const [srcRes, clmRes] = await Promise.all([
            getResearchRunSourcesAction(runId),
            getResearchRunClaimsAction(runId),
          ]);
          if (srcRes.status === "1") setSources(srcRes.data?.items ?? []);
          if (clmRes.status === "1") setClaims(clmRes.data?.items ?? []);

          // Check if already saved
          if (res.data.savedResearch) {
            setSavedWikiUrl(res.data.savedResearch.knowledgeItemId
              ? `/${locale}/wiki/${res.data.savedResearch.knowledgeItemId}`
              : null);
          }
        }
      } else {
        setLoadError(res.msg || "Không tải được dữ liệu nghiên cứu này.");
      }
    } catch {
      setLoadError("Không kết nối được máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [runId, locale]);

  // Initial load
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Polling for active runs
  useEffect(() => {
    const run = detail?.researchRun;
    if (!run) return;

    if (ACTIVE_STATUSES.includes(run.status)) {
      pollRef.current = setInterval(() => fetchDetail(true), POLL_INTERVAL_MS);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [detail?.researchRun?.status, fetchDetail]);

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelResearchRunAction(runId);
      if (res.status === "1") {
        await fetchDetail(true);
      } else {
        const errMap: Record<string, string> = {
          RESEARCH_RUN_NOT_ACTIVE: "Nghiên cứu đã hoàn tất, không thể hủy.",
          RESEARCH_RUN_NOT_FOUND: "Không tìm thấy nghiên cứu này.",
        };
        setCancelError(errMap[res.error_code] ?? "Không thể hủy nghiên cứu. Thử lại.");
      }
    } catch {
      setCancelError("Không kết nối được máy chủ.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveToWiki = async () => {
    if (isSaving) return;
    if (!detail?.researchRun) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      // For MVP, use a simple default domain approach
      const res = await saveResearchToWikiAction(runId, {
        title: detail.researchRun.query,
        domainId: "", // Will need domainId picker — use empty for now
        tags: [],
        mode: "create_item",
        includeResearchTrace: true,
        includeSources: true,
        includeClaims: true,
        note: "Lưu từ Research Flow.",
      });

      if (res.status === "1") {
        setSavedWikiUrl(res.data?.links?.detailUrl ?? null);
        await fetchDetail(true);
      } else {
        const errMap: Record<string, string> = {
          RESEARCH_ALREADY_SAVED: "Nghiên cứu đã được lưu trước đó.",
          RESEARCH_NOT_COMPLETED: "Chỉ có thể lưu nghiên cứu đã hoàn tất.",
          DOMAIN_NOT_OWNED: "Domain không hợp lệ.",
        };
        setSaveError(errMap[res.error_code] ?? "Không thể lưu vào Wiki. Thử lại.");
      }
    } catch {
      setSaveError("Không kết nối được máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return <Loading />;
  }

  if (loadError || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-auth-bg px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <LineIcon name="warning" className="h-12 w-12 text-auth-text-3 mx-auto" />
          <p className="text-white font-semibold">{loadError || "Không tải được nghiên cứu."}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" size="sm" onClick={() => fetchDetail()}>
              {t("common.retry", "Thử lại")}
            </Button>
            <Link href={`/${locale}/research`}>
              <Button variant="ghost" size="sm">← Quay lại</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { researchRun: run, plan, synthesis, savedResearch } = detail;
  const isActive = ACTIVE_STATUSES.includes(run.status);
  const isCompleted = run.status === "completed";
  const isFailed = run.status === "failed";
  const isCancelled = run.status === "cancelled";

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
          <Link href={`/${locale}/research`} className="text-auth-text-2 hover:text-white transition-colors text-sm">
            ← {t("research.title", "Nghiên cứu AI")}
          </Link>
          <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3" />
          <span className="text-sm font-semibold text-white truncate max-w-[200px]">
            {run.query}
          </span>
        </div>
      </header>

      <main className="container-focused py-8 space-y-6 relative z-10">
        {/* Run header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isActive ? "bg-auth-accent-dim" :
                isCompleted ? "bg-auth-accent-dim" :
                isFailed ? "bg-red-950/40" : "bg-auth-elevated"
              }`}>
                {isActive && <DotMatrixLoader variant="pulse" size="xs" />}
                {isCompleted && <LineIcon name="checkmark-circle" className="h-3.5 w-3.5 text-auth-accent" />}
                {isFailed && <LineIcon name="xmark-circle" className="h-3.5 w-3.5 text-red-400" />}
                {isCancelled && <LineIcon name="xmark-circle" className="h-3.5 w-3.5 text-auth-text-3" />}
              </div>
              <span className={`text-xs font-semibold ${
                isActive ? "text-auth-accent" :
                isCompleted ? "text-auth-accent" :
                isFailed ? "text-red-400" : "text-auth-text-3"
              }`}>
                {STAGE_LABELS[run.status] ?? run.status}
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">{run.query}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                isLoading={isCancelling}
                leftIcon={<LineIcon name="xmark" className="h-3.5 w-3.5" />}
                className="text-auth-text-2 hover:text-red-300"
              >
                {t("research.cancel", "Hủy")}
              </Button>
            )}
            {isCompleted && !savedResearch && !savedWikiUrl && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToWiki}
                isLoading={isSaving}
                leftIcon={<LineIcon name="bookmark" className="h-3.5 w-3.5" />}
              >
                {t("research.saveToWiki", "Lưu vào Wiki")}
              </Button>
            )}
            {(savedResearch || savedWikiUrl) && (
              <Link href={savedWikiUrl ?? `/${locale}/wiki`}>
                <Button variant="ghost" size="sm" leftIcon={<LineIcon name="checkmark-circle" className="h-3.5 w-3.5 text-auth-accent" />}>
                  {t("research.savedToWiki", "Đã lưu vào Wiki")}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {cancelError && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2">
            <LineIcon name="warning" className="h-3.5 w-3.5" /> {cancelError}
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2">
            <LineIcon name="warning" className="h-3.5 w-3.5" /> {saveError}
          </div>
        )}

        {/* ─── Progress timeline (for active runs) ─── */}
        {isActive && (
          <section className="rounded-2xl border border-auth-accent/20 bg-auth-accent-dim/10 p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <DotMatrixLoader variant="pulse" size="sm" />
              {t("research.progress.title", "Tiến độ nghiên cứu")}
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {ACTIVE_STATUSES.map((stage, i) => {
                const stages = ACTIVE_STATUSES as string[];
                const currentIdx = stages.indexOf(run.status);
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={stage} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone ? "bg-auth-accent text-white" :
                      isCurrent ? "bg-auth-accent-dim border-2 border-auth-accent text-auth-accent" :
                      "bg-auth-elevated text-auth-text-3"
                    }`}>
                      {isDone ? <LineIcon name="checkmark-circle" className="h-3.5 w-3.5" /> : (
                        <span className="h-3.5 w-3.5 flex items-center justify-center">
                          {STAGE_ICONS[stage]}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] text-center leading-tight ${
                      isCurrent ? "text-auth-accent font-semibold" : "text-auth-text-3"
                    }`}>
                      {STAGE_LABELS[stage]?.replace("...", "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Confidence + stats (completed) ─── */}
        {isCompleted && synthesis && (
          <div className="flex flex-wrap items-center gap-3">
            {getConfidenceBadge(synthesis.confidence.level, synthesis.confidence.score)}
            {run.sourceCount > 0 && (
              <span className="text-xs text-auth-text-2">
                <strong className="text-white">{run.sourceCount}</strong> nguồn đã dùng
              </span>
            )}
            {run.claimCount > 0 && (
              <span className="text-xs text-auth-text-2">
                <strong className="text-white">{run.claimCount}</strong> trích dẫn
              </span>
            )}
            {run.overallConfidence !== null && (
              <span className="text-xs text-auth-text-2">
                Điểm tổng: <strong className="text-white">{Math.round(run.overallConfidence * 100)}%</strong>
              </span>
            )}
          </div>
        )}

        {/* ─── Tabs (completed runs) ─── */}
        {isCompleted && (
          <>
            <div className="flex gap-1 border-b border-auth-border pb-0 -mb-4">
              {(["synthesis", "sources", "claims", "plan"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-auth-accent text-auth-accent"
                      : "border-transparent text-auth-text-2 hover:text-white"
                  } cursor-pointer`}
                >
                  {tab === "synthesis" && t("research.tab.synthesis", "Kết quả tổng hợp")}
                  {tab === "sources" && `${t("research.tab.sources", "Nguồn")} (${sources.length})`}
                  {tab === "claims" && `${t("research.tab.claims", "Bằng chứng")} (${claims.length})`}
                  {tab === "plan" && t("research.tab.plan", "Kế hoạch")}
                </button>
              ))}
            </div>

            {/* Synthesis tab */}
            {activeTab === "synthesis" && synthesis && (
              <section className="space-y-4">
                {/* Caveats */}
                {synthesis.caveats.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-950/10 px-4 py-3">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-300">{t("research.caveats", "Lưu ý")}</p>
                      {synthesis.caveats.map((c, i) => (
                        <p key={i} className="text-xs text-amber-200/80">{c}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answer */}
                <div className="prose prose-invert prose-sm max-w-none rounded-2xl border border-auth-border bg-auth-surface p-6">
                  <div
                    className="text-sm text-white leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: synthesis.answer.replace(/\n/g, "<br/>") }}
                  />
                </div>

                {/* Citations */}
                {synthesis.externalCitations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-auth-text-2 uppercase tracking-wider mb-2">
                      {t("research.citations", "Nguồn trích dẫn")}
                    </h3>
                    <div className="space-y-2">
                      {synthesis.externalCitations.map((cite) => (
                        <div key={cite.sourceId} className="flex items-start gap-3 rounded-lg border border-auth-border bg-auth-elevated px-3 py-2.5">
                          <LineIcon name="world" className="h-3.5 w-3.5 shrink-0 text-auth-text-3 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{cite.title}</p>
                            {cite.excerpt && <p className="text-[10px] text-auth-text-2 mt-0.5 line-clamp-2">{cite.excerpt}</p>}
                          </div>
                          {cite.url && (
                            <a href={cite.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-auth-text-3 hover:text-auth-accent transition-colors">
                              <LineIcon name="popup" className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Sources tab */}
            {activeTab === "sources" && (
              <section className="space-y-2">
                {sources.length === 0 ? (
                  <p className="text-sm text-auth-text-2 text-center py-8">
                    {t("research.sources.empty", "Không có nguồn nào.")}
                  </p>
                ) : sources.map((src) => (
                  <div key={src.id} className="flex items-start gap-3 rounded-xl border border-auth-border bg-auth-surface p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${src.fetchedOk ? "bg-auth-accent-dim" : "bg-auth-elevated"}`}>
                      <LineIcon name="world" className={`h-3.5 w-3.5 ${src.fetchedOk ? "text-auth-accent" : "text-auth-text-3"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{src.title}</p>
                      {src.domain && <p className="text-xs text-auth-text-3">{src.domain}</p>}
                      {src.excerpt && <p className="text-xs text-auth-text-2 mt-1 line-clamp-2">{src.excerpt}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-auth-text-3">
                          Điểm: <strong className="text-auth-accent">{Math.round(src.score * 100)}%</strong>
                        </span>
                        {!src.fetchedOk && (
                          <span className="text-[10px] text-amber-300">Chỉ lấy được snippet</span>
                        )}
                      </div>
                    </div>
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-auth-text-3 hover:text-auth-accent transition-colors">
                        <LineIcon name="popup" className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Claims tab */}
            {activeTab === "claims" && (
              <section className="space-y-2">
                {claims.length === 0 ? (
                  <p className="text-sm text-auth-text-2 text-center py-8">
                    {t("research.claims.empty", "Không có bằng chứng nào.")}
                  </p>
                ) : claims.map((claim) => (
                  <div key={claim.id} className="rounded-xl border border-auth-border bg-auth-surface p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white leading-relaxed">{claim.text}</p>
                      <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full border ${
                        claim.confidence >= 0.8 ? "bg-auth-accent-dim border-auth-accent/20 text-auth-accent" :
                        claim.confidence >= 0.6 ? "bg-amber-950/40 border-amber-500/20 text-amber-400" :
                        "bg-red-950/40 border-red-500/20 text-red-400"
                      }`}>
                        {Math.round(claim.confidence * 100)}%
                      </span>
                    </div>
                    {claim.evidenceQuote && (
                      <blockquote className="border-l-2 border-auth-border pl-3 text-xs italic text-auth-text-2">
                        {claim.evidenceQuote}
                      </blockquote>
                    )}
                    <span className="text-[10px] text-auth-text-3">{claim.claimType.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Plan tab */}
            {activeTab === "plan" && plan && (
              <section className="rounded-2xl border border-auth-border bg-auth-surface p-5 space-y-4">
                {plan.questions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-auth-text-2 uppercase tracking-wider mb-2">
                      {t("research.plan.questions", "Câu hỏi nghiên cứu")}
                    </h3>
                    <ul className="space-y-1.5">
                      {plan.questions.map((q, i) => (
                        <li key={i} className="text-sm text-white flex items-start gap-2">
                          <span className="text-auth-accent shrink-0 mt-0.5">•</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.plannedQueries.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-auth-text-2 uppercase tracking-wider mb-2">
                      {t("research.plan.queries", "Truy vấn đã thực hiện")}
                    </h3>
                    <ul className="space-y-1.5">
                      {plan.plannedQueries.map((q, i) => (
                        <li key={i} className="text-xs text-auth-text-2 flex items-start gap-2">
                          <span className="text-auth-text-3 shrink-0">→</span>
                          <span><strong className="text-white">{q.query}</strong> — {q.purpose}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ─── Failed/Cancelled state ─── */}
        {(isFailed || isCancelled) && (
          <div className="rounded-2xl border border-auth-border bg-auth-surface p-6 text-center space-y-3">
            <LineIcon name="xmark-circle" className={`h-10 w-10 mx-auto ${isFailed ? "text-red-400" : "text-auth-text-3"}`} />
            <p className="text-sm font-semibold text-white">
              {isFailed ? t("research.failed.title", "Nghiên cứu thất bại") : t("research.cancelled.title", "Nghiên cứu đã hủy")}
            </p>
            {run.error?.message && (
              <p className="text-xs text-auth-text-2">{run.error.message}</p>
            )}
            <Link href={`/${locale}/research`}>
              <Button variant="primary" size="sm">
                {t("research.newResearch", "Tạo nghiên cứu mới")}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
