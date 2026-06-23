"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { AppHeader } from "@/components/layout";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/shared";
import {
  createResearchRunAction,
  listResearchRunsAction,
  submitDocumentAction,
  getClientAccessToken,
  getStoredRoleKbId,
  setStoredRoleKbId,
  getOnboardingStateAction,
  getCurrentUserAction,
} from "@/lib/client-api";
import type {
  ResearchRunDto,
  ResearchStatus,
  ResearchTrigger,
  ResearchStreamEvent,
} from "@/types/research";
import type { RoleKbDto } from "@/types/onboarding";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com";
const RESEARCH_API_BASE = process.env.NEXT_PUBLIC_RESEARCH_API_URL || (rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl);



const ACTIVE_STATUSES: ResearchStatus[] = [
  "queued",
  "planning",
  "searching",
  "selecting_sources",
  "fetching_sources",
  "extracting_claims",
  "reflecting",
  "synthesizing",
];

function getStatusIcon(status: ResearchStatus) {
  if (ACTIVE_STATUSES.includes(status)) {
    return <DotMatrixLoader variant="pulse" size="xs" />;
  }
  switch (status) {
    case "completed":
      return <LineIcon name="checkmark-circle" className="h-3.5 w-3.5 text-auth-accent" />;
    case "failed":
      return <LineIcon name="xmark-circle" className="h-3.5 w-3.5 text-red-400" />;
    case "cancelled":
      return <LineIcon name="xmark-circle" className="h-3.5 w-3.5 text-auth-text-3" />;
    default:
      return <LineIcon name="alarm" className="h-3.5 w-3.5 text-auth-text-3" />;
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
  if (score >= 0.6) return "text-zinc-400";
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
  const searchParams = useSearchParams();
  const roleKbIdFromUrl = searchParams.get("roleKbId") || searchParams.get("roleId") || searchParams.get("role_id") || "";
  const { user } = useAuth();
  const { t, locale } = useTranslation();

  // Tab state
  const [activeTab, setActiveTab] = useState<"interactive" | "history">("interactive");

  // --- Background/History States ---
  const [bgQuery, setBgQuery] = useState("");
  const [trigger, setTrigger] = useState<ResearchTrigger>("explicit_research");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [runs, setRuns] = useState<ResearchRunDto[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // --- Interactive Lab States ---
  // Ingestion
  const [docSource, setDocSource] = useState("");
  const [docSourceType, setDocSourceType] = useState<"web" | "pdf" | "text" | "git">("web");
  const [docDomainHint, setDocDomainHint] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestedDocId, setIngestedDocId] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<"COMPLETE" | "PROCESSING" | null>(null);

  // Stream Query
  const [streamQuery, setStreamQuery] = useState("");
  const [selectedRoleKbId, setSelectedRoleKbId] = useState(() => roleKbIdFromUrl || getStoredRoleKbId() || user?.roleKbId || "");
  const [limitToIngested, setLimitToIngested] = useState(false);
  const [topK, setTopK] = useState(10);
  const [domainFiltersInput, setDomainFiltersInput] = useState("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState<string[]>([]);
  const [streamResults, setStreamResults] = useState<ResearchStreamEvent[]>([]);
  const [streamAnswer, setStreamAnswer] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);

  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [copied, setCopied] = useState(false);

  // Load Roles & Runs
  const loadRuns = useCallback(async (roleId?: string, cursor?: string) => {
    setIsLoadingRuns(true);
    setListError(null);
    try {
      const res = await listResearchRunsAction({
        limit: 20,
        cursor: cursor ?? undefined,
        roleKbId: roleId || undefined,
      });
      console.log("🟢 [F12 API RESPONSE] listResearchRunsAction:", res);
      if (res.status === "1") {
        const items = res.data?.items ?? [];
        setRuns(cursor ? (prev) => [...prev, ...items] : items);
        setHasMore(res.data?.pageInfo?.hasMore ?? false);
        setNextCursor(res.data?.pageInfo?.nextCursor ?? null);
      } else {
        if (res.error_code === "RESEARCH_NOT_ENABLED") {
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
    async function loadRolesAndRuns() {
      setRolesLoading(true);
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

        let activeRoleId = roleKbIdFromUrl;
        if (roles.length) {
          setUserRoles(roles);
          const isValidRole = roles.some((r) => r.id === roleKbIdFromUrl);
          if (!isValidRole) {
            const primaryRole = roles.find((r) => r.isPrimary);
            activeRoleId = primaryRole ? primaryRole.id : roles[0].id;
          }
          setSelectedRoleKbId(activeRoleId);
          setStoredRoleKbId(activeRoleId);
          // Update URL
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.set("roleKbId", activeRoleId);
          router.replace(`/${locale}/research?${newParams.toString()}`);
        } else {
          setUserRoles([]);
          setSelectedRoleKbId("");
          activeRoleId = "";
        }
        await loadRuns(activeRoleId || undefined);
      } catch (err) {
        console.error("loadRolesAndRuns error:", err);
        await loadRuns(roleKbIdFromUrl || undefined);
      } finally {
        setRolesLoading(false);
      }
    }
    loadRolesAndRuns();
  }, [loadRuns, roleKbIdFromUrl, locale, searchParams, router, user]);

  // ─── Synchronize selectedRoleKbId when user finishes loading ───
  useEffect(() => {
    if (user?.roleKbId && user.roleKbId !== selectedRoleKbId) {
      console.log("🔄 [Auth State Sync Research] Updating selectedRoleKbId from user:", user.roleKbId);
      setSelectedRoleKbId(user.roleKbId);
      setStoredRoleKbId(user.roleKbId);
      
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("roleKbId", user.roleKbId);
      router.replace(`/${locale}/research?${newParams.toString()}`);
      
      loadRuns(user.roleKbId);
    }
  }, [user?.roleKbId, selectedRoleKbId, router, locale, searchParams, loadRuns]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleKbId(roleId);
    setStoredRoleKbId(roleId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("roleKbId", roleId);
    router.replace(`/${locale}/research?${newParams.toString()}`);
    loadRuns(roleId);
  };

  // handle background create
  const handleCreateBg = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bgQuery.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await createResearchRunAction({
        trigger,
        query: trimmed,
        roleKbId: selectedRoleKbId || undefined,
        freshnessRequired: false,
        mode: "background",
        options: { saveTrace: true },
      });
      console.log("🟢 [F12 API RESPONSE] createResearchRunAction:", res);

      if (res.status === "1" && res.data?.researchRun?.id) {
        setBgQuery("");
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

  // handle document submission
  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const sourceVal = docSource.trim();
    if (!sourceVal) return;
    if (isIngesting) return;

    setIsIngesting(true);
    setIngestError(null);
    setIngestedDocId(null);
    setIngestStatus(null);

    try {
      const res = await submitDocumentAction({
        source: sourceVal,
        source_type: docSourceType,
        domain_hint: docDomainHint.trim() || undefined,
        role_id: selectedRoleKbId || undefined,
        roleKbId: selectedRoleKbId || undefined,
      });
      console.log("🟢 [F12 API RESPONSE] submitDocumentAction:", res);

      if (res.status === "1" && res.data?.document_id) {
        setIngestedDocId(res.data.document_id);
        setIngestStatus(res.data.status);
        setLimitToIngested(true); // default to restrict research to this doc
        setDocSource("");
        setDocDomainHint("");
      } else {
        setIngestError(res.msg || "Không thể nạp tài liệu này. Vui lòng kiểm tra lại dữ liệu.");
      }
    } catch (err) {
      setIngestError("Không kết nối được máy chủ.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleClearIngestedDoc = () => {
    setIngestedDocId(null);
    setIngestStatus(null);
    setLimitToIngested(false);
  };

  // handle stream research
  const handleStreamResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const qVal = streamQuery.trim();
    if (!qVal || isStreaming) return;

    setIsStreaming(true);
    setStreamError(null);
    setStreamProgress(["Khởi tạo đường truyền nghiên cứu..."]);
    setStreamResults([]);
    setStreamAnswer("");

    try {
      const params = new URLSearchParams();
      params.set("query", qVal);
      if (selectedRoleKbId) params.set("role_id", selectedRoleKbId);
      if (limitToIngested && ingestedDocId) params.set("document_id", ingestedDocId);
      params.set("top_k", String(topK));

      if (domainFiltersInput.trim()) {
        const filters = domainFiltersInput.split(",").map((f) => f.trim()).filter(Boolean);
        filters.forEach((f) => params.append("domain_filters", f));
      }

      let token = await getClientAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let response = await fetch(`${RESEARCH_API_BASE}/research/stream?${params.toString()}`, {
        headers,
      });

      if (response.status === 401) {
        console.warn("Unauthorized (401) on research stream. Refreshing token...");
        token = await getClientAccessToken(true);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          response = await fetch(`${RESEARCH_API_BASE}/research/stream?${params.toString()}`, {
            headers,
          });
        }
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.msg || `Lỗi đường truyền (HTTP ${response.status})`);
      }

      if (!response.body) {
        throw new Error("Luồng dữ liệu phản hồi bị trống.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.substring(5).trim();
            try {
              const event = JSON.parse(jsonStr) as ResearchStreamEvent;
              if (event.type === "PROGRESS") {
                console.log("🟢 [F12 API RESPONSE] Research Stream Event [PROGRESS]:", event);
                setStreamProgress((prev) => [...prev, event.message]);
              } else if (event.type === "RESULT") {
                console.log("🟢 [F12 API RESPONSE] Research Stream Event [RESULT]:", event);
                setStreamResults((prev) => [...prev, event]);
              } else if (event.type === "ANSWER") {
                console.log("🟢 [F12 API RESPONSE] Research Stream Event [ANSWER]:", event);
                setStreamAnswer(event.message);
              } else if (event.type === "ERROR") {
                console.log("🔴 [F12 API RESPONSE] Research Stream Event [ERROR]:", event);
                setStreamError(event.message);
              }
            } catch (err) {
              console.warn("Failed to parse stream event JSON:", err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("handleStreamResearch error:", err);
      setStreamError(err.message || "Không kết nối được máy chủ.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(streamAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeRuns = runs.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const historyRuns = runs.filter((r) => !ACTIVE_STATUSES.includes(r.status));

  return (
    <div className="min-h-screen bg-auth-bg text-white relative overflow-x-hidden flex flex-col">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/3 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Header */}
      <AppHeader active="research" locale={locale} selectedRoleKbId={selectedRoleKbId} />
      <header className="hidden">
        <div className="container-focused flex h-16 items-center gap-3">
          <Link href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`} prefetch={false} className="text-auth-text-2 hover:text-white transition-colors text-sm">
            ← {t("common.dashboard", "Dashboard")}
          </Link>
          <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3" />
          <span className="text-sm font-semibold text-white flex items-center gap-1.5">
            <LineIcon name="search" className="h-3.5 w-3.5 text-auth-accent" />
            {t("research.title", "Nghiên cứu AI")}
          </span>
        </div>
      </header>

      <main className="container-focused py-8 space-y-6 relative z-10 flex-grow">
        {!selectedRoleKbId ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="h-20 w-20 rounded-2xl bg-zinc-800/30 border border-zinc-700/20 flex items-center justify-center text-zinc-400 animate-pulse animate-duration-1000">
              <LineIcon name="warning" className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-300">
                {locale === "vi" ? "Chưa Thiết Lập Vai Trò Chuyên Môn" : "Professional Role Not Configured"}
              </h3>
              <p className="text-xs text-auth-text-2 mt-1.5 max-w-xs leading-relaxed">
                {locale === "vi"
                  ? "Nghiên cứu yêu cầu vai trò chuyên môn để tùy chỉnh cơ sở tri thức. Vui lòng thiết lập vai trò của bạn tại trang Cài đặt."
                  : "Research requires a professional role to customize your knowledge base. Please configure your role in Settings."}
              </p>
            </div>
            <Link
              href={`/${locale}/settings#settings-section-role`}
              className="btn-primary-pulse text-sm bg-white hover:bg-zinc-200 text-black border-none"
            >
              <LineIcon name="settings" className="h-4 w-4" />
              {locale === "vi" ? "Thiết lập trong Cài đặt" : "Configure in Settings"}
            </Link>
          </div>
        ) : (
          <>
            {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {t("research.title", "Nghiên cứu AI")}
            </h1>
            <p className="text-sm text-auth-text-2 mt-1">
              Khám phá và xây dựng tri thức tự động dựa trên tài liệu cá nhân và tìm kiếm web.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#121214] border border-[#27272a] rounded-xl p-1 shrink-0 self-start">
            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "interactive"
                  ? "bg-auth-accent text-black"
                  : "text-auth-text-3 hover:text-white"
              }`}
            >
              Phòng Lab Tương Tác (Live)
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-auth-accent text-black"
                  : "text-auth-text-3 hover:text-white"
              }`}
            >
              Chạy Nền & Lịch Sử
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INTERACTIVE RESEARCH LAB */}
        {/* ========================================================================= */}
        {activeTab === "interactive" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Settings (Ingestion & Filters) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Document Ingestion Form */}
              <section className="rounded-2xl p-5 relative border border-auth-border bg-auth-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                    <LineIcon name="upload" className="h-3.5 w-3.5 text-auth-accent" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Nạp tài liệu nhanh vào Vector DB</h2>
                </div>

                <form onSubmit={handleIngestDocument} className="space-y-4">
                  {/* Source Type Chips */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-2">
                      Loại tài liệu
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#121214] p-1 border border-[#27272a] rounded-xl">
                      {(["web", "pdf", "text", "git"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setDocSourceType(type);
                            setDocSource("");
                            setIngestError(null);
                          }}
                          className={`py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider cursor-pointer text-center transition-all ${
                            docSourceType === type
                              ? "bg-white/[0.08] text-auth-accent border border-auth-accent/20"
                              : "text-auth-text-3 hover:text-white border border-transparent"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic inputs */}
                  <div>
                    <label htmlFor="doc-source" className="block text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1.5">
                      {docSourceType === "text" ? "Nội dung văn bản thuần" : "Đường dẫn URL nguồn"}
                    </label>
                    {docSourceType === "text" ? (
                      <textarea
                        id="doc-source"
                        rows={5}
                        required
                        value={docSource}
                        onChange={(e) => setDocSource(e.target.value)}
                        placeholder="Nhập hoặc dán nội dung tri thức tại đây (tối thiểu 10 ký tự)..."
                        className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-3 text-xs text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-all resize-none"
                      />
                    ) : (
                      <div className="relative">
                        <LineIcon name={docSourceType === "git" ? "github" : "link"} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-auth-text-3" />
                        <input
                          id="doc-source"
                          type="url"
                          required
                          value={docSource}
                          onChange={(e) => setDocSource(e.target.value)}
                          placeholder={
                            docSourceType === "git"
                              ? "https://github.com/org/repo.git"
                              : docSourceType === "pdf"
                                ? "https://example.com/document.pdf"
                                : "https://example.com/docs/api-guide"
                          }
                          className="w-full rounded-xl border border-auth-border bg-auth-elevated pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Domain Hint */}
                  <div>
                    <label htmlFor="doc-domain-hint" className="block text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1.5">
                      Gợi ý Domain (Phân loại)
                    </label>
                    <input
                      id="doc-domain-hint"
                      type="text"
                      value={docDomainHint}
                      onChange={(e) => setDocDomainHint(e.target.value)}
                      placeholder="Ví dụ: backend, ai, frontend (không bắt buộc)"
                      className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-2.5 text-xs text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-all"
                    />
                  </div>

                  {ingestError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2 text-[11px] text-red-300">
                      <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{ingestError}</span>
                    </div>
                  )}

                  {/* Ingestion Success Banner */}
                  {ingestedDocId && (
                    <div className="rounded-xl border border-auth-accent/20 bg-auth-accent-dim/10 p-3 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] font-bold text-auth-accent flex items-center gap-1.5">
                          <LineIcon name="checkmark-circle" className="h-3.5 w-3.5" />
                          Nạp tài liệu thành công!
                        </span>
                        <button
                          type="button"
                          onClick={handleClearIngestedDoc}
                          className="text-auth-text-3 hover:text-white transition-colors cursor-pointer"
                        >
                          <LineIcon name="xmark" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-[9px] text-auth-text-2 space-y-0.5 font-mono">
                        <p className="truncate">ID: {ingestedDocId}</p>
                        <p>Trạng thái: <span className="text-auth-accent font-bold">{ingestStatus}</span></p>
                      </div>
                      <p className="text-[10px] text-auth-text-3">
                        Hệ thống đã tự động liên kết tài liệu này cho Research Query tiếp theo của bạn.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={isIngesting}
                    disabled={!docSource.trim()}
                    leftIcon={<LineIcon name="upload" className="h-3.5 w-3.5" />}
                  >
                    Nạp tài liệu mới
                  </Button>
                </form>
              </section>

              {/* Research Scope & Stream settings */}
              <section className="rounded-2xl p-5 border border-auth-border bg-auth-surface/50 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                    <LineIcon name="settings" className="h-3.5 w-3.5 text-auth-accent" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Cấu hình nghiên cứu</h2>
                </div>

                {/* KB (Role) Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                    Knowledge Base Đích (Role)
                  </label>
                  {rolesLoading ? (
                    <Skeleton className="h-9 w-full rounded-xl" />
                  ) : userRoles.length > 0 ? (
                    <Select
                      value={selectedRoleKbId}
                      onChange={handleRoleChange}
                      options={userRoles.map((r) => ({
                        value: r.id,
                        label: r.roleName,
                        sublabel: r.roleGroup,
                      }))}
                      fullWidth
                      className="bg-auth-elevated border-auth-border rounded-xl py-2"
                    />
                  ) : (
                    <span className="text-xs text-red-400">Không tìm thấy KB. Hãy onboarding trước.</span>
                  )}
                </div>

                {/* Restrict to Ingested Doc Option */}
                {ingestedDocId && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-auth-accent/20 bg-auth-accent-dim/5">
                    <input
                      id="limit-doc-checkbox"
                      type="checkbox"
                      checked={limitToIngested}
                      onChange={(e) => setLimitToIngested(e.target.checked)}
                      className="mt-0.5 rounded border-[#27272a] bg-[#121214] text-auth-accent focus:ring-auth-accent/20 cursor-pointer"
                    />
                    <label htmlFor="limit-doc-checkbox" className="text-xs font-semibold text-auth-accent cursor-pointer select-none">
                      Chỉ nghiên cứu trên tài liệu vừa nạp (Document-Filtered Mode)
                    </label>
                  </div>
                )}

                {/* Top K */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                      Số lượng chunk trích xuất (Top K)
                    </label>
                    <span className="text-xs text-auth-accent font-semibold">{topK}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full accent-auth-accent cursor-pointer bg-[#18181b] rounded-lg appearance-none h-1"
                  />
                </div>

                {/* Domain filters */}
                <div>
                  <label htmlFor="domain-filters-in" className="block text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1.5">
                    Bộ lọc Domain Tags (cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    id="domain-filters-in"
                    type="text"
                    value={domainFiltersInput}
                    onChange={(e) => setDomainFiltersInput(e.target.value)}
                    placeholder="Ví dụ: python, async, backend"
                    className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-2 text-xs text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-all"
                  />
                </div>
              </section>

            </div>

            {/* Right Column: Live Stream Console */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Question Text Area */}
              <section className="rounded-2xl p-5 border border-auth-border bg-auth-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                    <LineIcon name="search" className="h-3.5 w-3.5 text-auth-accent" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Nghiên cứu & Truy vấn thời gian thực</h2>
                </div>

                <form onSubmit={handleStreamResearch} className="space-y-4">
                  <div>
                    <label htmlFor="stream-query-in" className="block text-[10px] font-bold uppercase tracking-wider text-auth-text-3 mb-1.5">
                      Chủ đề / Câu hỏi nghiên cứu
                    </label>
                    <textarea
                      id="stream-query-in"
                      rows={3}
                      required
                      value={streamQuery}
                      onChange={(e) => {
                        setStreamQuery(e.target.value);
                        if (streamError) setStreamError(null);
                      }}
                      placeholder="Nhập câu hỏi bạn muốn nghiên cứu chuyên sâu (hệ thống sẽ stream tiến trình, nguồn, và câu trả lời theo thời gian thực)..."
                      className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-3 text-sm text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-all resize-none leading-relaxed"
                      disabled={isStreaming}
                    />
                  </div>

                  {streamError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2.5 text-xs text-red-300">
                      <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{streamError}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isStreaming}
                      disabled={!streamQuery.trim()}
                      leftIcon={<LineIcon name="play" className="h-3.5 w-3.5" />}
                    >
                      Bắt đầu nghiên cứu Live Stream
                    </Button>
                  </div>
                </form>
              </section>

              {/* Streaming Output Panel */}
              {(isStreaming || streamAnswer || streamResults.length > 0 || streamProgress.length > 0) && (
                <section className="rounded-2xl border border-auth-border bg-auth-surface p-6 space-y-6">
                  
                  {/* Header output status */}
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                    <div className="flex items-center gap-2">
                      {isStreaming ? (
                        <DotMatrixLoader variant="pulse" size="xs" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-auth-accent animate-ping" />
                      )}
                      <span className="text-xs font-bold text-auth-text-2">
                        {isStreaming ? "Đang tiến hành nghiên cứu..." : "Nghiên cứu hoàn tất"}
                      </span>
                    </div>

                    {streamAnswer && !isStreaming && (
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-auth-text-2 hover:text-white transition-colors cursor-pointer border border-[#27272a] rounded-lg px-2.5 py-1 bg-white/[0.02]"
                      >
                        <LineIcon name={copied ? "checkmark-circle" : "copy"} className={`h-3.5 w-3.5 ${copied ? "text-auth-accent" : ""}`} />
                        <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
                      </button>
                    )}
                  </div>

                  {/* Progress Logs */}
                  {streamProgress.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">Tiến trình xử lý</h3>
                      <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 space-y-1.5 max-h-[140px] overflow-y-auto font-mono text-[10px] text-auth-text-2">
                        {streamProgress.map((prog, index) => (
                          <div key={index} className="flex items-start gap-1.5">
                            <span className="text-auth-accent">›</span>
                            <span>{prog}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results: Chunks found */}
                  {streamResults.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">
                        Nguồn trích xuất liên quan ({streamResults.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {streamResults.map((event, index) => {
                          if (event.type !== "RESULT") return null;
                          return (
                            <div key={event.chunk_id || index} className="rounded-xl border border-auth-border bg-[#18181b] p-3 flex flex-col justify-between gap-3 premium-hover-card">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
                                    {Math.round(event.score * 100)}% Match
                                  </span>
                                  <span className="text-[9px] text-auth-text-3 font-mono">Index: #{event.chunk_index}</span>
                                </div>
                                <p className="text-xs text-white line-clamp-3 leading-relaxed italic bg-white/[0.01] p-2 rounded-lg border border-white/[0.03]">
                                  "{event.message}"
                                </p>
                              </div>
                              
                              {/* Domain tags */}
                              {event.domain_tags && event.domain_tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {event.domain_tags.map((tag) => (
                                    <span key={tag} className="text-[8px] bg-white/[0.04] text-auth-text-2 border border-white/5 rounded-md px-1.5 py-0.5">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* LLM stream Answer */}
                  {(streamAnswer || isStreaming) && (
                    <div className="space-y-2 border-t border-[#27272a] pt-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 flex items-center gap-1.5">
                        <LineIcon name="brain-alt" className="h-3.5 w-3.5 text-auth-accent" />
                        Báo cáo tổng hợp tri thức
                      </h3>

                      <div className="prose prose-invert prose-sm max-w-none rounded-xl border border-auth-border bg-[#121214] p-4 min-h-[120px] relative overflow-hidden">
                        {isStreaming && !streamAnswer && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-auth-text-3 gap-2 bg-[#121214]/80 z-10">
                            <DotMatrixLoader variant="ripple" size="sm" />
                            <span>Đang tổng hợp câu trả lời từ AI...</span>
                          </div>
                        )}
                        <MarkdownRenderer content={streamAnswer || ""} />
                      </div>
                    </div>
                  )}

                </section>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BACKGROUND RUNS & HISTORY (Original UI) */}
        {/* ========================================================================= */}
        {activeTab === "history" && (
          <div className="space-y-6">
            
            {/* Background Create Section */}
            <section className="rounded-2xl p-5 relative border border-auth-border bg-auth-surface/50 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                  <LineIcon name="plus" className="h-3.5 w-3.5 text-auth-accent" />
                </div>
                <h2 className="text-sm font-bold text-white">Tạo nghiên cứu chạy nền mới</h2>
              </div>

              <form onSubmit={handleCreateBg} className="space-y-3">
                <div>
                  <label htmlFor="research-query-bg" className="block text-xs font-semibold text-auth-text-2 mb-1.5">
                    {t("research.create.queryLabel", "Chủ đề nghiên cứu")}
                  </label>
                  <textarea
                    id="research-query-bg"
                    rows={3}
                    value={bgQuery}
                    onChange={(e) => {
                      setBgQuery(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    placeholder={t("research.create.placeholder", "Nhập chủ đề hoặc câu hỏi bạn muốn nghiên cứu... (ví dụ: Best practices để deploy Next.js lên Vercel với Edge Runtime)")}
                    className="w-full rounded-xl border border-auth-border bg-auth-elevated px-4 py-3 text-sm text-white placeholder:text-auth-text-3 focus:outline-none focus:border-auth-accent/50 focus:ring-1 focus:ring-auth-accent/20 transition-colors resize-none"
                    disabled={isCreating}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] ${bgQuery.length > 8000 ? "text-red-400" : "text-auth-text-3"}`}>
                      {bgQuery.length.toLocaleString()} / 8,000
                    </span>
                  </div>
                </div>

                {createError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2.5 text-xs text-red-300">
                    <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0 mt-0.5" />
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
                    disabled={bgQuery.trim().length < 2 || bgQuery.length > 8000}
                    leftIcon={<LineIcon name="search" className="h-3.5 w-3.5" />}
                  >
                    {t("research.create.button", "Bắt đầu nghiên cứu")}
                  </Button>
                </div>
              </form>
            </section>

            {/* Active Runs */}
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

            {/* Historical list */}
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
                  <LineIcon name="sync" className={`h-3.5 w-3.5 ${isLoadingRuns ? "animate-spin" : ""}`} />
                </button>
              </div>

              {isLoadingRuns ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : listError ? (
                <div className="text-center py-8 space-y-3">
                  <LineIcon name="warning" className="h-8 w-8 text-auth-text-3 mx-auto" />
                  <p className="text-sm text-auth-text-2">{listError}</p>
                  <Button variant="ghost" size="sm" onClick={() => loadRuns()}>
                    {t("common.retry", "Thử lại")}
                  </Button>
                </div>
              ) : historyRuns.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-auth-border rounded-2xl space-y-3 bg-auth-surface/20">
                  <LineIcon name="search" className="h-10 w-10 text-auth-text-3 mx-auto opacity-50" />
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

          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

// --- Run Card ---
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
      prefetch={false}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:border-white/[0.15] hover:bg-auth-elevated/50 group ${
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
              <LineIcon name="files" className="h-3 w-3" />
              {run.sourceCount} {t("research.sources", "nguồn")}
            </span>
          )}
          <span className="text-xs text-auth-text-3">
            {formatRelativeTime(run.createdAt)}
          </span>
        </div>
      </div>

      <LineIcon name="chevron-right" className="h-4 w-4 text-auth-text-3 shrink-0 group-hover:text-white transition-colors mt-1" />
    </Link>
  );
}
