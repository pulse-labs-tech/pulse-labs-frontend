"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  BookOpen,
  FileText,
  Link2,
  Upload,
  FileCode,
  PenLine,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  LogOut,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Tag,
  Globe,
  Hash,
  Layers,
  FileSymlink,
  Calendar,
  RefreshCw,
  MessageCircle,
  AlignLeft,
  Lightbulb,
  Dot,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logoutAction } from "@/app/actions/auth";
import { getWikiItemAction } from "@/app/actions/wiki";
import { useTranslation } from "@/contexts/locale-context";
import type { WikiItemDetail, WikiRetrievalStatus, WikiSourceType } from "@/types/wiki";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function getSourceTypeIcon(type: WikiSourceType, size = "h-4 w-4") {
  switch (type) {
    case "text":
      return <FileText className={`${size} text-emerald-400`} />;
    case "url":
      return <Link2 className={`${size} text-blue-400`} />;
    case "file_pdf":
      return <FileText className={`${size} text-red-400`} />;
    case "file_txt":
      return <FileText className={`${size} text-slate-400`} />;
    case "file_md":
      return <FileCode className={`${size} text-purple-400`} />;
    case "query_output":
      return <Cpu className={`${size} text-cyan-400`} />;
    case "manual_note":
      return <PenLine className={`${size} text-amber-400`} />;
    default:
      return <Upload className={`${size} text-auth-text-3`} />;
  }
}

function getSourceTypeLabel(type: WikiSourceType, t: (path: string) => string): string {
  switch (type as string) {
    case "text": return t("wiki.sourceTypes.text");
    case "url": return t("wiki.sourceTypes.url");
    case "file":
    case "file_pdf":
    case "file_txt":
    case "file_md":
      return t("wiki.sourceTypes.file");
    case "manual_note": return t("wiki.sourceTypes.manual_note");
    default: return t("wiki.sourceTypes.default");
  }
}

function getStatusBadge(status: WikiRetrievalStatus, t: (path: string) => string) {
  switch (status) {
    case "indexed":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("wiki.statuses.ready")}
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
          <Clock className="h-3.5 w-3.5" /> {t("wiki.statuses.pending")}
        </span>
      );
    case "degraded":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" /> {t("wiki.statuses.lowQuality")}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
          <XCircle className="h-3.5 w-3.5" /> {t("wiki.statuses.failed")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
          {t("wiki.statuses.unknown")}
        </span>
      );
  }
}

function formatDateVN(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "—";
  try {
    const formattedLocale = locale === "en" ? "en-US" : "vi-VN";
    return new Intl.DateTimeFormat(formattedLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

function formatNumber(n: number | null | undefined, locale: string): string {
  if (n == null) return "—";
  const formattedLocale = locale === "en" ? "en-US" : "vi-VN";
  return n.toLocaleString(formattedLocale);
}

// ────────────────────────────────────────────────────────────────
// Loading Skeleton
// ────────────────────────────────────────────────────────────────

function WikiItemSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Main skeleton */}
      <div className="flex-grow flex flex-col gap-5 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {[80, 50, 120, 50, 180].map((w, i) => (
            <span key={i} className="flex items-center gap-2">
              <div className={`h-3 w-${w / 4} bg-white/[0.06] rounded animate-pulse`} style={{ width: w }} />
              {i < 4 && <ChevronRight className="h-3 w-3 text-auth-text-3/40" />}
            </span>
          ))}
        </div>

        {/* Title hero */}
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-28 bg-white/[0.06] rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-white/[0.06] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>

        {/* Key points */}
        <div className="bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
          {[100, 90, 80, 95].map((w, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-2 w-2 rounded-full bg-emerald-400/20 shrink-0" />
              <div className="h-3 bg-white/[0.04] rounded animate-pulse" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
        {[120, 160, 140, 90].map((h, i) => (
          <div
            key={i}
            className="bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-5"
            style={{ minHeight: h }}
          >
            <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main WikiItemView Component
// ────────────────────────────────────────────────────────────────

interface WikiItemViewProps {
  id: string;
}

export function WikiItemView({ id }: WikiItemViewProps) {
  const router = useRouter();
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useTranslation();

  const [item, setItem] = useState<WikiItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchItem = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsNotFound(false);

    try {
      const res = await getWikiItemAction(id);

      if (res.status === "1" && res.data?.item) {
        setItem(res.data.item);
      } else {
        if (res.error_code === "UNAUTHORIZED") {
          clearAuth();
          router.push(`/${locale}/login?returnUrl=/${locale}/wiki`);
          return;
        }
        if (res.error_code === "NOT_FOUND" || res.error_code === "WIKI_ITEM_NOT_FOUND") {
          setIsNotFound(true);
        } else {
          setErrorMsg(res.msg || t("wiki.detail.loadErrorDesc"));
        }
      }
    } catch {
      setErrorMsg(t("wiki.detail.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const tVal = setTimeout(() => fetchItem(), 0);
    return () => clearTimeout(tVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLogout = () => {
    startTransition(async () => {
      clearAuth();
      await logoutAction();
    });
  };

  // ── Layout wrapper (always renders header) ───────────────────
  const renderLayout = (children: React.ReactNode) => (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* Ambient Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl h-16">
        <div className="container-focused flex h-16 items-center justify-between relative">
          <div className="flex justify-start z-10">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-auth-text">
                Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden justify-center items-center gap-1.5 md:flex">
            <nav className="flex items-center gap-1.5">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> {t("common.dashboard")}
              </Link>
              <Link
                href={`/${locale}/query`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> {t("common.query")}
              </Link>
              <Link
                href={`/${locale}/wiki`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <BookOpen className="h-3.5 w-3.5" /> {t("common.wiki")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 justify-end z-10">
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-auth-text">
                {authUser?.displayName || authUser?.email || t("auth.brand.prop3Title")}
              </div>
              <span className="inline-flex mt-0.5 items-center gap-1 rounded-full border border-auth-accent/20 bg-auth-accent-dim px-2 py-0.5 text-[10px] font-semibold text-auth-accent">
                {authUser?.plan === "pro" ? t("common.proPlan") : t("common.freePlan")}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
              title={t("common.logout")}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-auth-accent" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container-focused flex-grow py-8 relative z-10">
        {children}
      </main>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return renderLayout(<WikiItemSkeleton />);
  }

  // ── Not found ────────────────────────────────────────────────
  if (isNotFound) {
    return renderLayout(
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="h-20 w-20 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">404 — {t("common.error")}</p>
          <h2 className="text-xl font-extrabold text-auth-text">{t("wiki.detail.itemNotFound")}</h2>
          <p className="text-xs text-auth-text-2 mt-2 max-w-xs leading-relaxed">
            {t("wiki.detail.itemNotFoundDesc")}
          </p>
        </div>
        <Link
          href={`/${locale}/wiki`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-sm font-semibold transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> {t("wiki.detail.backToLibrary")}
        </Link>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (errorMsg && !item) {
    return renderLayout(
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="h-20 w-20 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-auth-text">{t("wiki.detail.loadError")}</h2>
          <p className="text-xs text-auth-text-2 mt-2 max-w-xs leading-relaxed">{errorMsg}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchItem}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] transition-all text-sm"
          >
            <RefreshCw className="h-4 w-4" /> {t("common.retry")}
          </button>
          <Link
            href={`/${locale}/wiki`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  // ── Full Detail View ─────────────────────────────────────────
  return renderLayout(
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
      {/* ── Main Content (Left) ────────────────────────────── */}
      <div className="flex-grow flex flex-col gap-6 min-w-0">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-auth-text-3 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}/dashboard`} className="hover:text-auth-text transition-colors">{t("common.dashboard")}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={`/${locale}/wiki`} className="hover:text-auth-text transition-colors">{t("common.wiki")}</Link>
          {item.domain?.name && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link
                href={`/${locale}/wiki?domainId=${item.domain.id}`}
                className="hover:text-auth-text transition-colors"
              >
                {item.domain.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-auth-text-2 truncate max-w-[200px]" title={item.title}>
            {item.title}
          </span>
        </nav>

        {/* Title hero */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/${locale}/wiki`}
            className="self-start inline-flex items-center gap-1.5 text-[10px] font-semibold text-auth-text-3 hover:text-auth-accent transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" /> {t("wiki.detail.backToLibrary")}
          </Link>

          <h1 className="text-fluid-xl font-extrabold tracking-tight leading-tight">
            {item.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(item.retrievalStatus, t)}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-2">
              {getSourceTypeIcon(item.source?.sourceType, "h-3.5 w-3.5")}
              {getSourceTypeLabel(item.source?.sourceType, t)}
            </span>
            {item.domain?.name && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
                <Globe className="h-3.5 w-3.5" />
                {item.domain.name}
              </span>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent to-transparent" />
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
              <AlignLeft className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">{t("wiki.detail.noSummary").replace("Không có tóm tắt cho mục này.", locale === "en" ? "Summary" : "Tóm tắt")}</h2>
          </div>
          <p className="text-sm text-auth-text-2 leading-relaxed whitespace-pre-wrap">
            {item.summary || t("wiki.detail.noSummary")}
          </p>
        </div>

        {/* Concepts */}
        {item.concepts && item.concepts.length > 0 && (
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-purple-950/40 text-purple-400 flex items-center justify-center shrink-0">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">{t("wiki.detail.concepts")}</h2>
            </div>
            <div className="flex flex-col gap-4">
              {item.concepts.map((concept) => (
                <div key={concept.id} className="border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {concept.term}
                  </h3>
                  <p className="text-xs text-auth-text-2 mt-1 leading-relaxed">
                    {concept.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Citations / Chunks */}
        {item.citations && item.citations.length > 0 && (
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/30 to-transparent" />
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-blue-950/40 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">{t("wiki.detail.chunks")}</h2>
            </div>
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {item.citations.map((cit, idx) => (
                <div key={cit.chunkId || idx} className="bg-auth-bg/50 rounded-xl p-4 border border-white/[0.04]">
                  <div className="flex justify-between items-center mb-2 text-[10px] text-auth-text-3 font-semibold">
                    <span>{locale === "en" ? `Part ${idx + 1}` : `Phần ${idx + 1}`}</span>
                    {cit.headingPath && (
                      <span className="truncate max-w-[200px]" title={cit.headingPath}>
                        {cit.headingPath}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-auth-text-2 leading-relaxed whitespace-pre-wrap font-mono">
                    {cit.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source attribution */}
        {(item.source?.url || item.source?.titleHint) && (
          <div className="flex items-center gap-3 bg-auth-elevated/60 border border-auth-border rounded-xl px-4 py-3">
            <FileSymlink className="h-4 w-4 text-auth-text-3 shrink-0" />
            <span className="text-xs text-auth-text-3">
              <span className="font-semibold">{t("wiki.detail.source")}</span>{" "}
              <span className="font-medium text-auth-text-2">{getSourceTypeLabel(item.source.sourceType, t)}</span>
              {" — "}
              {item.source.url ? (
                <a
                  href={item.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-auth-accent hover:underline transition-colors"
                >
                  {item.source.titleHint || item.source.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>{item.source.titleHint}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Sidebar (Right) ───────────────────────────────── */}
      <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">

        {/* Domain card */}
        {item.domain && (
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-3">Domain</p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-auth-text">{item.domain.name}</p>
                <p className="text-[10px] text-auth-text-3 font-mono">{item.domain.slug}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-3">{t("wiki.detail.stats")}</p>
          <div className="flex flex-col gap-3">
            {[
              {
                icon: <AlignLeft className="h-3.5 w-3.5" />,
                label: t("wiki.detail.statWords"),
                value: formatNumber(item.source?.wordCount, locale),
              },
              {
                icon: <Layers className="h-3.5 w-3.5" />,
                label: t("wiki.detail.statChunks"),
                value: formatNumber(item.citations?.length, locale),
              },
              {
                icon: <Calendar className="h-3.5 w-3.5" />,
                label: t("wiki.detail.statCompiled"),
                value: formatDateVN(item.compiledAt, locale),
              },
              {
                icon: <RefreshCw className="h-3.5 w-3.5" />,
                label: t("wiki.detail.statUpdated"),
                value: formatDateVN(item.updatedAt, locale),
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-auth-text-3 shrink-0">
                  <span className="text-auth-text-3">{icon}</span>
                  {label}
                </div>
                <span className="text-[10px] text-auth-text-2 font-medium text-right leading-relaxed">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags cloud */}
        {item.tags && item.tags.length > 0 && (
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/wiki?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/5 border border-white/10 text-auth-text-3 hover:text-auth-accent hover:border-auth-accent/20 hover:bg-auth-accent-dim transition-all"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ask about this topic CTA */}
        <Link
          href={`/${locale}/query?roleKbId=${item.roleKbId}&q=${encodeURIComponent(item.title)}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] transition-all text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          {t("wiki.detail.askTopic")}
        </Link>

        {/* Related items */}
        {item.relatedItems && item.relatedItems.length > 0 && (
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-3">{t("wiki.detail.relatedItems")}</p>
            <div className="flex flex-col gap-2">
              {item.relatedItems.slice(0, 3).map((related) => (
                <Link
                   key={related.id}
                  href={`/${locale}/wiki/items/${related.id}`}
                  className="group flex items-start gap-2.5 p-3 rounded-xl bg-auth-elevated/40 border border-white/[0.04] hover:border-white/[0.10] hover:bg-auth-elevated/70 transition-all"
                >
                  <div className="mt-0.5 shrink-0">
                    {getSourceTypeIcon(related.sourceType, "h-3.5 w-3.5")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-auth-text group-hover:text-auth-accent transition-colors line-clamp-2 leading-snug">
                      {related.title}
                    </p>
                    {related.domain?.name && (
                      <p className="text-[10px] text-auth-text-3 mt-0.5 flex items-center gap-1">
                        <Dot className="h-2 w-2" />
                        {related.domain.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
