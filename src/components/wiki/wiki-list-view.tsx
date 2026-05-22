"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  BookOpen,
  Search,
  Grid3X3,
  List,
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Loader2,
  AlertCircle,
  X,
  SlidersHorizontal,
  Tag,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logoutAction } from "@/app/actions/auth";
import { getWikiItemsAction } from "@/app/actions/wiki";
import type { WikiItemCard, WikiDomain, WikiRetrievalStatus, WikiSourceType, WikiListDomainSummary, WikiSort } from "@/types/wiki";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function getSourceTypeIcon(type: WikiSourceType) {
  switch (type) {
    case "text":
      return <FileText className="h-3.5 w-3.5 text-emerald-400" />;
    case "url":
      return <Link2 className="h-3.5 w-3.5 text-blue-400" />;
    case "file_pdf":
      return <FileText className="h-3.5 w-3.5 text-red-400" />;
    case "file_txt":
      return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    case "file_md":
      return <FileCode className="h-3.5 w-3.5 text-purple-400" />;
    case "query_output":
      return <Cpu className="h-3.5 w-3.5 text-cyan-400" />;
    case "manual_note":
      return <PenLine className="h-3.5 w-3.5 text-amber-400" />;
    default:
      return <Upload className="h-3.5 w-3.5 text-auth-text-3" />;
  }
}

function getSourceTypeLabel(type: WikiSourceType): string {
  switch (type) {
    case "text": return "Văn bản";
    case "url": return "URL";
    case "file_pdf": return "PDF";
    case "file_txt": return "TXT";
    case "file_md": return "Markdown";
    case "query_output": return "AI Output";
    case "manual_note": return "Ghi chú";
    default: return "Tài liệu";
  }
}

function getStatusBadge(status: WikiRetrievalStatus) {
  switch (status) {
    case "indexed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-2.5 w-2.5" /> Sẵn sàng
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
          <Clock className="h-2.5 w-2.5" /> Đang xử lý
        </span>
      );
    case "degraded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="h-2.5 w-2.5" /> Chất lượng thấp
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
          <XCircle className="h-2.5 w-2.5" /> Lỗi
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
          Chưa rõ
        </span>
      );
  }
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

function getSortParam(sortByVal: "compiledAt" | "title" | "updatedAt"): WikiSort {
  switch (sortByVal) {
    case "updatedAt":
      return "updated_desc";
    case "title":
      return "title_asc";
    case "compiledAt":
    default:
      return "created_desc";
  }
}

// ────────────────────────────────────────────────────────────────
// Wiki Card (Grid Mode)
// ────────────────────────────────────────────────────────────────

function WikiCard({ item }: { item: WikiItemCard }) {
  const visibleTags = item.tags.slice(0, 2);
  const extraTagCount = item.tags.length - 2;

  return (
    <Link
      href={`/wiki/items/${item.id}`}
      className="group relative bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 hover:border-white/[0.12] transition-all flex flex-col gap-3 overflow-hidden"
    >
      {/* Subtle left border glow on hover */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-auth-accent/0 to-transparent group-hover:via-auth-accent/60 transition-all duration-300 rounded-l-2xl" />

      {/* Top row: source type + domain + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {getSourceTypeIcon(item.sourceType)}
          <span className="text-[10px] font-semibold text-auth-text-3 uppercase tracking-wider">
            {getSourceTypeLabel(item.sourceType)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.domain?.name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
              <Globe className="h-2.5 w-2.5" />
              {item.domain.name}
            </span>
          )}
          {getStatusBadge(item.retrievalStatus)}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-auth-text group-hover:text-auth-accent transition-colors line-clamp-2 leading-snug">
        {item.title}
      </h3>

      {/* Summary snippet */}
      {item.summarySnippet && (
        <p className="text-xs text-auth-text-2 line-clamp-3 leading-relaxed flex-grow">
          {item.summarySnippet}
        </p>
      )}

      {/* Bottom row: tags + date */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-1 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-auth-text-3"
            >
              <Tag className="h-2 w-2" />
              {tag}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span className="text-[10px] text-auth-text-3 font-medium">+{extraTagCount}</span>
          )}
        </div>
        <span className="text-[10px] text-auth-text-3 shrink-0">
          {formatDateVN(item.compiledAt || item.createdAt)}
        </span>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────
// Wiki Row (List Mode)
// ────────────────────────────────────────────────────────────────

function WikiRow({ item }: { item: WikiItemCard }) {
  return (
    <Link
      href={`/wiki/items/${item.id}`}
      className="group flex items-start gap-4 bg-auth-surface/30 border border-white/[0.06] rounded-xl px-4 py-3.5 hover:border-white/[0.12] hover:bg-auth-surface/50 transition-all"
    >
      {/* Source icon */}
      <div className="mt-0.5 shrink-0">{getSourceTypeIcon(item.sourceType)}</div>

      {/* Main info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold text-auth-text group-hover:text-auth-accent transition-colors truncate">
            {item.title}
          </span>
          {getStatusBadge(item.retrievalStatus)}
        </div>
        {item.summarySnippet && (
          <p className="text-xs text-auth-text-2 line-clamp-2 leading-relaxed">
            {item.summarySnippet}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.domain?.name && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-auth-accent">
              <Globe className="h-2.5 w-2.5" />
              {item.domain.name}
            </span>
          )}
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-auth-text-3"
            >
              <Tag className="h-2 w-2" />
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-[10px] text-auth-text-3">+{item.tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="shrink-0 text-[10px] text-auth-text-3 text-right mt-0.5">
        {formatDateVN(item.compiledAt || item.createdAt)}
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────
// Loading Skeleton
// ────────────────────────────────────────────────────────────────

function WikiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-white/[0.06] rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-white/[0.06] rounded-full animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-white/[0.06] rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex gap-1.5">
              <div className="h-4 w-12 bg-white/[0.04] rounded-md animate-pulse" />
              <div className="h-4 w-12 bg-white/[0.04] rounded-md animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main WikiListView Component
// ────────────────────────────────────────────────────────────────

export function WikiListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<WikiRetrievalStatus | "">(
    (searchParams.get("status") as WikiRetrievalStatus) ?? ""
  );
  const [domainFilter, setDomainFilter] = useState(searchParams.get("domainId") ?? "");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") ?? "");
  const [sortBy, setSortBy] = useState<"compiledAt" | "title" | "updatedAt">(
    (searchParams.get("sortBy") as "compiledAt" | "title" | "updatedAt") ?? "compiledAt"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Data state
  const [items, setItems] = useState<WikiItemCard[]>([]);
  const [total, setTotal] = useState(0);
  const [domains, setDomains] = useState<WikiListDomainSummary[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  const roleKbId = searchParams.get("roleKbId") ?? "";
  const LIMIT = 12;
  const totalPages = Math.ceil(total / LIMIT);

  // Debounce ref for search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (overrides?: Partial<{ search: string; status: string; domainId: string; tag: string; page: number }>) => {
      setIsLoading(true);
      setApiWarning(null);

      const effectiveSearch = overrides?.search !== undefined ? overrides.search : search;
      const effectiveStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const effectiveDomain = overrides?.domainId !== undefined ? overrides.domainId : domainFilter;
      const effectiveTag = overrides?.tag !== undefined ? overrides.tag : tagFilter;
      const effectivePage = overrides?.page !== undefined ? overrides.page : page;

      try {
        const res = await getWikiItemsAction({
          roleKbId: roleKbId || undefined,
          page: effectivePage,
          limit: LIMIT,
          q: effectiveSearch || undefined,
          domainId: (effectiveDomain && effectiveDomain !== "all") ? effectiveDomain : undefined,
          status: effectiveStatus ? (effectiveStatus as any) : undefined,
          tag: effectiveTag || undefined,
          sort: getSortParam(sortBy),
        });

        if (res.status === "1" && res.data) {
          const fetchedItems = res.data.items ?? [];
          setItems(fetchedItems);
          setTotal(res.data.summary?.totalItems ?? 0);
          if (res.data.summary?.domains?.length) {
            setDomains(res.data.summary.domains);
          }
          // Extract unique tags from items dynamically as fallback
          const uniqueTags = Array.from(new Set(fetchedItems.flatMap((item) => item.tags || [])));
          if (uniqueTags.length) {
            setAllTags(uniqueTags);
          }
        } else {
          if (res.error_code === "UNAUTHORIZED") {
            clearAuth();
            router.push("/login?returnUrl=/wiki");
            return;
          }
          setApiWarning(res.msg || "Không thể tải dữ liệu Wiki. Vui lòng thử lại.");
          setItems([]);
          setTotal(0);
        }
      } catch {
        setApiWarning("Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.");
        setItems([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter, domainFilter, tagFilter, page, roleKbId, sortBy, clearAuth, router]
  );

  // Initial load
  useEffect(() => {
    const t = setTimeout(() => fetchItems(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when sort changes
  useEffect(() => {
    if (!isLoading) fetchItems({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // ── Search debounce ────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchItems({ search: val, page: 1 });
    }, 400);
  };

  // ── Filter change helpers ──────────────────────────────────────
  const handleStatusFilter = (s: WikiRetrievalStatus | "") => {
    setStatusFilter(s);
    setPage(1);
    fetchItems({ status: s, page: 1 });
  };

  const handleDomainFilter = (d: string) => {
    setDomainFilter(d);
    setPage(1);
    fetchItems({ domainId: d, page: 1 });
  };

  const handleTagFilter = (t: string) => {
    setTagFilter(t);
    setPage(1);
    fetchItems({ tag: t, page: 1 });
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDomainFilter("");
    setTagFilter("");
    setPage(1);
    fetchItems({ search: "", status: "", domainId: "", tag: "", page: 1 });
  };

  const hasActiveFilters = search || statusFilter || domainFilter || tagFilter;

  // ── Pagination ──────────────────────────────────────────────────
  const handlePage = (newPage: number) => {
    setPage(newPage);
    fetchItems({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    startTransition(async () => {
      clearAuth();
      await logoutAction();
    });
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* Ambient Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ────────────────── Header ────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl h-16">
        <div className="container-responsive flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-auth-text">
                Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link
                href={roleKbId ? `/query?roleKbId=${roleKbId}` : "/query"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Hỏi đáp AI
              </Link>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <BookOpen className="h-3.5 w-3.5" /> Wiki Cá nhân
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-auth-text">
                {authUser?.displayName || authUser?.email || "Người dùng"}
              </div>
              <span className="inline-flex mt-0.5 items-center gap-1 rounded-full border border-auth-accent/20 bg-auth-accent-dim px-2 py-0.5 text-[10px] font-semibold text-auth-accent">
                {authUser?.plan === "pro" ? "Pro Plan" : "Free Plan"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
              title="Đăng xuất"
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

      {/* ────────────────── Main Content ────────────────── */}
      <main className="container-responsive flex-grow py-8 relative z-10 flex flex-col gap-6">

        {/* API warning banner */}
        {apiWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="flex-1">{apiWarning}</span>
            <button
              onClick={() => { setApiWarning(null); fetchItems(); }}
              className="ml-2 shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              Thử lại
            </button>
            <button onClick={() => setApiWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page title row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-fluid-xl font-extrabold tracking-tight">Thư viện Wiki</h1>
              <p className="text-xs text-auth-text-2 mt-0.5">
                Toàn bộ kiến thức được biên soạn và lập chỉ mục
              </p>
            </div>
            {!isLoading && total > 0 && (
              <span className="ml-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
                {total.toLocaleString("vi-VN")} mục
              </span>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-auth-elevated border border-auth-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-auth-accent-dim text-auth-accent"
                  : "text-auth-text-3 hover:text-auth-text"
              }`}
              title="Xem lưới"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-auth-accent-dim text-auth-accent"
                  : "text-auth-text-3 hover:text-auth-text"
              }`}
              title="Xem danh sách"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filters bar */}
        <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent to-transparent" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-auth-text-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm kiếm concept, tựa đề..."
                className="w-full bg-auth-elevated border border-auth-border rounded-xl pl-9 pr-4 py-2 text-sm text-auth-text placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/60 transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-text-3 hover:text-auth-text transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 shrink-0">
                <SlidersHorizontal className="h-3 w-3 inline mr-1" />Sắp xếp
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "compiledAt" | "title" | "updatedAt")}
                  className="appearance-none bg-auth-elevated border border-auth-border rounded-xl pl-3 pr-7 py-2 text-xs text-auth-text focus:outline-none focus:border-auth-accent/60 transition-colors cursor-pointer"
                >
                  <option value="compiledAt">Mới nhất</option>
                  <option value="updatedAt">Cập nhật</option>
                  <option value="title">Theo tên</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-auth-text-3" />
              </div>
            </div>
          </div>

          {/* Filter pills row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status pills */}
            <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 shrink-0">Trạng thái:</span>
            {(
              [
                { label: "Tất cả", value: "" },
                { label: "Sẵn sàng", value: "indexed" },
                { label: "Đang xử lý", value: "pending" },
                { label: "Lỗi", value: "failed" },
              ] as { label: string; value: WikiRetrievalStatus | "" }[]
            ).map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === value
                    ? "bg-auth-accent-dim text-auth-accent border-auth-accent/30"
                    : "bg-auth-elevated border-auth-border text-auth-text-3 hover:text-auth-text hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}

            {/* Domain filter */}
            {domains.length > 0 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 ml-2 shrink-0">Domain:</span>
                <div className="relative">
                  <select
                    value={domainFilter}
                    onChange={(e) => handleDomainFilter(e.target.value)}
                    className="appearance-none bg-auth-elevated border border-auth-border rounded-full pl-3 pr-7 py-1 text-xs text-auth-text focus:outline-none focus:border-auth-accent/60 transition-colors cursor-pointer"
                  >
                    <option value="">Tất cả domain</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-auth-text-3" />
                </div>
              </>
            )}

            {/* Tag filter */}
            {allTags.length > 0 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 ml-2 shrink-0">Tag:</span>
                <div className="relative">
                  <select
                    value={tagFilter}
                    onChange={(e) => handleTagFilter(e.target.value)}
                    className="appearance-none bg-auth-elevated border border-auth-border rounded-full pl-3 pr-7 py-1 text-xs text-auth-text focus:outline-none focus:border-auth-accent/60 transition-colors cursor-pointer"
                  >
                    <option value="">Tất cả tags</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>
                        #{t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-auth-text-3" />
                </div>
              </>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 transition-colors"
              >
                <X className="h-3 w-3" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        {isLoading ? (
          <WikiGridSkeleton />
        ) : items.length === 0 ? (
          /* Empty states */
          hasActiveFilters ? (
            /* No search results */
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="h-16 w-16 rounded-2xl bg-auth-surface/40 border border-white/[0.06] flex items-center justify-center text-auth-text-3">
                <Search className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-auth-text">Không tìm thấy kết quả</h3>
                <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs">
                  Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm wiki items khác.
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-sm font-semibold transition-all"
              >
                <X className="h-4 w-4" /> Xóa bộ lọc
              </button>
            </div>
          ) : (
            /* Completely empty */
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="h-20 w-20 rounded-2xl bg-auth-surface/40 border border-white/[0.06] flex items-center justify-center text-auth-text-3">
                <Brain className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-auth-text">Chưa có kiến thức nào</h3>
                <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs leading-relaxed">
                  Bắt đầu bằng cách nạp tài liệu đầu tiên vào hệ thống để xây dựng thư viện wiki cá nhân.
                </p>
              </div>
              <Link
                href={roleKbId ? `/compile/new?roleKbId=${roleKbId}` : "/compile/new"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] transition-all text-sm"
              >
                <Upload className="h-4 w-4" /> Nạp tài liệu đầu tiên
              </Link>
            </div>
          )
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <WikiCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <WikiRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-auth-text-3">
              Trang {page}/{totalPages} · {total.toLocaleString("vi-VN")} mục
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Trước
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        pageNum === page
                          ? "bg-auth-accent-dim text-auth-accent border border-auth-accent/30"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-3 hover:text-auth-text"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePage(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Tiếp <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
