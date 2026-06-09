"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { useAuth } from "@/hooks/use-auth";
import { Select } from "../ui/select";
import { logoutAction } from "@/app/actions/auth";
import { getWikiItemsAction, getOnboardingStateAction, getStoredRoleKbId, setStoredRoleKbId } from "@/lib/client-api";
import type { RoleKbDto } from "@/types/onboarding";
import type { WikiItemCard, WikiRetrievalStatus, WikiSourceType, WikiListDomainSummary, WikiSort } from "@/types/wiki";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "../layout/locale-switcher";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function getSourceTypeIcon(type: WikiSourceType) {
  switch (type) {
    case "text":
      return <LineIcon name="files" className="h-3.5 w-3.5 text-emerald-400" />;
    case "url":
      return <LineIcon name="link" className="h-3.5 w-3.5 text-blue-400" />;
    case "file_pdf":
      return <LineIcon name="files" className="h-3.5 w-3.5 text-red-400" />;
    case "file_txt":
      return <LineIcon name="files" className="h-3.5 w-3.5 text-slate-400" />;
    case "file_md":
      return <LineIcon name="code" className="h-3.5 w-3.5 text-purple-400" />;
    case "query_output":
      return <LineIcon name="cpu" className="h-3.5 w-3.5 text-cyan-400" />;
    case "manual_note":
      return <LineIcon name="pencil" className="h-3.5 w-3.5 text-amber-400" />;
    default:
      return <LineIcon name="upload" className="h-3.5 w-3.5 text-auth-text-3" />;
  }
}

function getSourceTypeLabel(type: WikiSourceType, tFn: (key: string, fallback: string) => string): string {
  switch (type) {
    case "text": return tFn("wiki.sourceTypes.text", "Raw Text");
    case "url": return tFn("wiki.sourceTypes.url", "URL Link");
    case "file_pdf": return "PDF";
    case "file_txt": return "TXT";
    case "file_md": return "Markdown";
    case "query_output": return "AI Output";
    case "manual_note": return tFn("wiki.sourceTypes.manual_note", "Manual Note");
    default: return tFn("wiki.sourceTypes.default", "Document");
  }
}

function getStatusBadge(status: WikiRetrievalStatus, tFn: (key: string, fallback: string) => string) {
  switch (status) {
    case "indexed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
          <LineIcon name="checkmark-circle" className="h-2.5 w-2.5" /> {tFn("wiki.statuses.ready", "Indexed")}
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
          <LineIcon name="alarm" className="h-2.5 w-2.5" /> {tFn("wiki.statuses.pending", "Processing")}
        </span>
      );
    case "degraded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
          <LineIcon name="warning" className="h-2.5 w-2.5" /> {tFn("wiki.statuses.lowQuality", "Low Quality")}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
          <LineIcon name="xmark-circle" className="h-2.5 w-2.5" /> {tFn("wiki.statuses.failed", "Index Error")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
          {tFn("wiki.statuses.unknown", "Unknown")}
        </span>
      );
  }
}

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
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
  const { t, locale } = useTranslation();
  const visibleTags = item.tags.slice(0, 2);
  const extraTagCount = item.tags.length - 2;

  return (
    <Link
      href={`/${locale}/wiki/items/${item.id}`}
      className="group relative bg-auth-surface/40 border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 hover:border-white/[0.15] transition-all flex flex-col gap-3 overflow-hidden"
    >
      {/* Subtle left border glow on hover */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-auth-accent/0 to-transparent group-hover:via-white/30 transition-all duration-300 rounded-l-2xl" />

      {/* Top row: source type + domain + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {getSourceTypeIcon(item.sourceType)}
          <span className="text-[10px] font-semibold text-auth-text-3 uppercase tracking-wider">
            {getSourceTypeLabel(item.sourceType, t)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.domain?.name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
              <LineIcon name="world" className="h-2.5 w-2.5" />
              {item.domain.name}
            </span>
          )}
          {getStatusBadge(item.retrievalStatus, t)}
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
              <LineIcon name="tag" className="h-2 w-2" />
              {tag}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span className="text-[10px] text-auth-text-3 font-medium">+{extraTagCount}</span>
          )}
        </div>
        <span className="text-[10px] text-auth-text-3 shrink-0">
          {formatDate(item.compiledAt || item.createdAt, locale)}
        </span>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────
// Wiki Row (List Mode)
// ────────────────────────────────────────────────────────────────

function WikiRow({ item }: { item: WikiItemCard }) {
  const { t, locale } = useTranslation();
  return (
    <Link
      href={`/${locale}/wiki/items/${item.id}`}
      className="group flex items-start gap-4 bg-auth-surface/30 border border-white/[0.06] rounded-xl px-4 py-3.5 hover:border-white/[0.15] hover:bg-auth-surface/50 transition-all"
    >
      {/* Source icon */}
      <div className="mt-0.5 shrink-0">{getSourceTypeIcon(item.sourceType)}</div>

      {/* Main info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold text-auth-text group-hover:text-auth-accent transition-colors truncate">
            {item.title}
          </span>
          {getStatusBadge(item.retrievalStatus, t)}
        </div>
        {item.summarySnippet && (
          <p className="text-xs text-auth-text-2 line-clamp-2 leading-relaxed">
            {item.summarySnippet}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.domain?.name && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-auth-accent">
              <LineIcon name="world" className="h-2.5 w-2.5" />
              {item.domain.name}
            </span>
          )}
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-auth-text-3"
            >
              <LineIcon name="tag" className="h-2 w-2" />
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
        {formatDate(item.compiledAt || item.createdAt, locale)}
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
  const { t, locale } = useTranslation();

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

  const [selectedRoleKbId, setSelectedRoleKbId] = useState(searchParams.get("roleKbId") || getStoredRoleKbId() || authUser?.roleKbId || "");
  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const LIMIT = 12;
  const totalPages = Math.ceil(total / LIMIT);

  // Debounce ref for search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (overrides?: Partial<{ search: string; status: string; domainId: string; tag: string; page: number; roleKbId: string }>) => {
      setIsLoading(true);
      setApiWarning(null);

      const effectiveSearch = overrides?.search !== undefined ? overrides.search : search;
      const effectiveStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const effectiveDomain = overrides?.domainId !== undefined ? overrides.domainId : domainFilter;
      const effectiveTag = overrides?.tag !== undefined ? overrides.tag : tagFilter;
      const effectivePage = overrides?.page !== undefined ? overrides.page : page;
      const effectiveRoleKbId = overrides?.roleKbId !== undefined ? overrides.roleKbId : selectedRoleKbId;

      if (!effectiveRoleKbId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await getWikiItemsAction({
          roleKbId: effectiveRoleKbId || undefined,
          page: effectivePage,
          limit: LIMIT,
          q: effectiveSearch || undefined,
          domainId: (effectiveDomain && effectiveDomain !== "all") ? effectiveDomain : undefined,
          status: effectiveStatus ? (effectiveStatus as WikiRetrievalStatus) : undefined,
          tag: effectiveTag || undefined,
          sort: getSortParam(sortBy),
        });
        console.log("🟢 [F12 API RESPONSE] getWikiItemsAction:", res);

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
            router.push(`/${locale}/login?returnUrl=/${locale}/wiki`);
            return;
          }
          setApiWarning(res.msg || t("wiki.detail.loadError", "Failed to load data"));
          setItems([]);
          setTotal(0);
        }
      } catch {
        setApiWarning(t("wiki.detail.networkError", "Cannot connect to server. Please check your network connection."));
        setItems([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter, domainFilter, tagFilter, page, selectedRoleKbId, sortBy, clearAuth, router, locale, t]
  );

  // Initial load & Roles resolver
  useEffect(() => {
    async function loadRoles() {
      const initialId = searchParams.get("roleKbId") || authUser?.roleKbId || "";
      
      // Optimization: If user is Free and already has a roleKbId, bypass loading onboarding state list
      if (authUser?.plan === "free" && authUser?.roleKbId) {
        setUserRoles([{
          id: authUser.roleKbId,
          roleName: "",
          roleGroup: "other",
          roleOptionId: "",
          isCustom: false,
          status: "active",
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }]);
        setRolesLoading(false);
        fetchItems({ roleKbId: authUser.roleKbId });
        return;
      }

      setRolesLoading(true);
      try {
        const res = await getOnboardingStateAction();
        console.log("🟢 [F12 API RESPONSE] getOnboardingStateAction:", res);
        if (res.status === "1" && res.data?.roles?.length) {
          setUserRoles(res.data.roles);
          const isValid = res.data.roles.some((r) => r.id === initialId);
          let resolvedId = initialId;
          if (!isValid) {
            const primary = res.data.roles.find((r) => r.isPrimary) || res.data.roles[0];
            resolvedId = primary.id;
            setSelectedRoleKbId(resolvedId);
            setStoredRoleKbId(resolvedId);
            // Update URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("roleKbId", resolvedId);
            router.replace(`/${locale}/wiki?${newParams.toString()}`);
          } else {
            setSelectedRoleKbId(resolvedId);
            setStoredRoleKbId(resolvedId);
          }
          fetchItems({ roleKbId: resolvedId });
        } else {
          setUserRoles([]);
          setSelectedRoleKbId("");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("loadRoles error:", err);
        setApiWarning(locale === "vi" ? "Không kết nối được máy chủ." : "Could not connect to server.");
        setIsLoading(false);
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Refetch when sort changes
  useEffect(() => {
    const timer = setTimeout(() => { fetchItems({ page: 1 }); }, 0);
    return () => clearTimeout(timer);
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
                prefetch={false}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LineIcon name="grid-alt" className="h-3.5 w-3.5" /> {t("common.dashboard", "Dashboard")}
              </Link>
              <Link
                href={selectedRoleKbId ? `/${locale}/query?roleKbId=${selectedRoleKbId}` : `/${locale}/query`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <LineIcon name="comment" className="h-3.5 w-3.5" /> {t("common.query", "Ask AI")}
              </Link>
              <Link
                href={selectedRoleKbId ? `/${locale}/wiki?roleKbId=${selectedRoleKbId}` : `/${locale}/wiki`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <LineIcon name="book" className="h-3.5 w-3.5" /> {t("common.wiki", "Personal Wiki")}
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

            <LocaleSwitcher id="wiki-list-header" />
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

      {/* ────────────────── Main Content ────────────────── */}
      <main className="container-focused flex-grow py-8 relative z-10 flex flex-col gap-6">

        {/* API warning banner */}
        {apiWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
            <LineIcon name="warning" className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="flex-1">{apiWarning}</span>
            <button
              onClick={() => { setApiWarning(null); fetchItems(); }}
              className="ml-2 shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              {t("common.retry", "Retry")}
            </button>
            <button onClick={() => setApiWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors">
              <LineIcon name="xmark" className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page title row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
              <LineIcon name="book" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-fluid-xl font-extrabold tracking-tight">{t("wiki.title", "Wiki Library")}</h1>
              <p className="text-xs text-auth-text-2 mt-0.5">
                {t("wiki.subtitle", "All knowledge compiled and indexed")}
              </p>
            </div>
            {!isLoading && total > 0 && (
              <span className="ml-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
                {total.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {locale === "vi" ? "mục" : "items"}
              </span>
            )}
          </div>

          {/* Active KB switcher */}
          {!rolesLoading && userRoles.length > 0 && (
            <div className="flex items-center gap-2 bg-auth-surface/40 border border-white/[0.06] rounded-xl p-1.5 px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                {locale === "vi" ? "Chuyên ngành:" : "Domain:"}
              </span>
              <Select
                value={selectedRoleKbId}
                onChange={(roleId) => {
                  setSelectedRoleKbId(roleId);
                  setStoredRoleKbId(roleId);
                  const newParams = new URLSearchParams(searchParams.toString());
                  newParams.set("roleKbId", roleId);
                  router.replace(`/${locale}/wiki?${newParams.toString()}`);
                  fetchItems({ roleKbId: roleId, page: 1 });
                }}
                options={userRoles.map((r) => ({
                  value: r.id,
                  label: r.roleName,
                }))}
                className="bg-auth-elevated border-auth-border rounded-xl text-xs py-1"
              />
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-auth-elevated border border-auth-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-auth-accent-dim text-auth-accent"
                  : "text-auth-text-3 hover:text-auth-text"
              }`}
              title={locale === "vi" ? "Xem lưới" : "Grid view"}
            >
              <LineIcon name="grid-alt" className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-auth-accent-dim text-auth-accent"
                  : "text-auth-text-3 hover:text-auth-text"
              }`}
              title={locale === "vi" ? "Xem danh sách" : "List view"}
            >
              <LineIcon name="list" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filters bar */}
        <div className="backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 relative premium-hover-card">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative w-full max-w-sm">
              <LineIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-auth-text-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("wiki.searchPlaceholder", "Search knowledge...")}
                className="w-full bg-auth-elevated border border-auth-border rounded-xl pl-9 pr-4 py-2 text-sm text-auth-text placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/60 transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-text-3 hover:text-auth-text transition-colors"
                >
                  <LineIcon name="xmark" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 shrink-0">
                <LineIcon name="control-panel" className="h-3 w-3 inline mr-1" />{t("wiki.sortBy.label", "Sort by")}
              </label>
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as "compiledAt" | "title" | "updatedAt")}
                options={[
                  { value: "compiledAt", label: t("wiki.sortBy.newest", "Newest") },
                  { value: "updatedAt", label: t("wiki.sortBy.updated", "Recently Updated") },
                  { value: "title", label: t("wiki.sortBy.title", "Alphabetical") },
                ]}
                className="bg-auth-elevated border-auth-border rounded-xl"
              />
            </div>
          </div>

          {/* Filter pills row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status pills */}
            <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 shrink-0">{t("wiki.status.label", "Status:")}</span>
            {(
              [
                { label: t("wiki.status.all", "All"), value: "" },
                { label: t("wiki.status.ready", "Ready"), value: "indexed" },
                { label: t("wiki.status.pending", "Processing"), value: "pending" },
                { label: t("wiki.status.failed", "Failed"), value: "failed" },
              ] as { label: string; value: WikiRetrievalStatus | "" }[]
            ).map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === value
                    ? "bg-auth-accent-dim text-auth-accent border-auth-accent/30"
                    : "bg-auth-elevated border-auth-border text-auth-text-3 hover:text-auth-text hover:border-white/[0.15]"
                }`}
              >
                {label}
              </button>
            ))}

            {/* Domain filter */}
            {domains.length > 0 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 ml-2 shrink-0">{t("dashboard.selectDomain", "Domain")}:</span>
                <Select
                  value={domainFilter}
                  onChange={handleDomainFilter}
                  options={[
                    { value: "", label: locale === "vi" ? "Tất cả domain" : "All domains" },
                    ...domains.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                  className="bg-auth-elevated border-auth-border rounded-full py-1 px-3"
                />
              </>
            )}

            {/* Tag filter */}
            {allTags.length > 0 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 ml-2 shrink-0">Tag:</span>
                <Select
                  value={tagFilter}
                  onChange={handleTagFilter}
                  options={[
                    { value: "", label: locale === "vi" ? "Tất cả tags" : "All tags" },
                    ...allTags.map((t) => ({ value: t, label: `#${t}` })),
                  ]}
                  className="bg-auth-elevated border-auth-border rounded-full py-1 px-3"
                />
              </>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 transition-colors"
              >
                <LineIcon name="xmark" className="h-3 w-3" /> {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        {isLoading ? (
          <WikiGridSkeleton />
        ) : !selectedRoleKbId ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="h-20 w-20 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
              <LineIcon name="warning" className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-400">
                {locale === "vi" ? "Chưa Thiết Lập Vai Trò Chuyên Môn" : "Professional Role Not Configured"}
              </h3>
              <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs leading-relaxed">
                {locale === "vi"
                  ? "Wiki yêu cầu vai trò chuyên môn để tùy chỉnh cơ sở tri thức. Vui lòng thiết lập vai trò của bạn tại trang Cài đặt."
                  : "Wiki requires a professional role to customize your knowledge base. Please configure your role in Settings."}
              </p>
            </div>
            <Link
              href={`/${locale}/settings#settings-section-role`}
              className="btn-primary-pulse text-sm bg-amber-500 hover:bg-amber-400 text-black border-none"
            >
              <LineIcon name="settings" className="h-4 w-4" />
              {locale === "vi" ? "Thiết lập trong Cài đặt" : "Configure in Settings"}
            </Link>
          </div>
        ) : items.length === 0 ? (
          /* Empty states */
          hasActiveFilters ? (
            /* No search results */
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="h-16 w-16 rounded-2xl bg-auth-surface/40 border border-white/[0.06] flex items-center justify-center text-auth-text-3">
                <LineIcon name="search" className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-auth-text">{t("wiki.noResults", "No results found")}</h3>
                <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs">
                  {t("wiki.noResultsDesc", "Try changing your keywords or filters to find other wiki items.")}
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-full text-sm font-semibold transition-all"
              >
                <LineIcon name="xmark" className="h-4 w-4" /> {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
              </button>
            </div>
          ) : (
            /* Completely empty */
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="h-20 w-20 rounded-2xl bg-auth-surface/40 border border-white/[0.06] flex items-center justify-center text-auth-text-3">
                <LineIcon name="brain-alt" className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-auth-text">{t("wiki.empty", "No knowledge items yet")}</h3>
                <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs leading-relaxed">
                  {t("wiki.emptyDesc", "Start by ingesting your first document to build your personal wiki library.")}
                </p>
              </div>
              <Link
                href={selectedRoleKbId ? `/${locale}/compile/new?roleKbId=${selectedRoleKbId}` : `/${locale}/compile/new`}
                className="btn-primary-pulse text-sm"
              >
                <LineIcon name="upload" className="h-4 w-4" /> {t("wiki.uploadCta", "Ingest your first document")}
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
              {locale === "vi"
                ? `Trang ${page}/${totalPages} · ${total.toLocaleString("vi-VN")} mục`
                : `Page ${page}/${totalPages} · ${total.toLocaleString("en-US")} items`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LineIcon name="chevron-left" className="h-3.5 w-3.5" /> {locale === "vi" ? "Trước" : "Back"}
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
                {t("common.next", "Next")} <LineIcon name="chevron-right" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
