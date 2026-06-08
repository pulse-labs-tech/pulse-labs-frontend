"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, ScrollToTop } from "@/components/ui";
import { LineIcon } from "@/components/shared/line-icon";
import { ActivityChart } from "./activity-chart";
import { useAuth } from "@/hooks/use-auth";
import { logoutAction } from "@/app/actions/auth";
import {
  getDashboardSummaryAction,
  getActiveJobsAction,
  getOnboardingStateAction,
} from "@/lib/client-api";
import type {
  DashboardSummaryData,
  DashboardCompileJob,
  DashboardQuota,
  SectionError,
} from "@/types/dashboard";
import type { RoleKbDto } from "@/types/onboarding";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "../layout/locale-switcher";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import Loading from "@/app/[locale]/loading";
import {
  Database,
  Globe,
  MessageSquare,
  Zap,
  Activity,
  RefreshCw,
  XCircle,
  Search,
  LayoutDashboard,
  BookOpen,
  Compass,
} from "lucide-react";

interface TechItem {
  icon: string;
  name: string;
  cat: string;
  catBadge: string;
  pct: number;
  color: string;
  items: number;
  updated: string;
  updatedTimestamp: number;
  wikiId?: number | null;
}

const DEFAULT_TECHS: TechItem[] = [
  { icon: "code", name: "React", cat: "Frontend", catBadge: "badge-blue", pct: 85, color: "#61dafb", items: 6, updated: "Apr 15", updatedTimestamp: 1713139200, wikiId: 6 },
  { icon: "activity", name: "FastAPI", cat: "Backend", catBadge: "badge-green", pct: 70, color: "#059669", items: 4, updated: "Apr 14", updatedTimestamp: 1713052800, wikiId: 7 },
  { icon: "box", name: "Docker", cat: "DevOps", catBadge: "badge-orange", pct: 60, color: "#2496ed", items: 3, updated: "Apr 12", updatedTimestamp: 1712880000, wikiId: 8 },
  { icon: "cpu", name: "LangChain", cat: "AI/ML", catBadge: "badge-purple", pct: 75, color: "#8b5cf6", items: 5, updated: "Apr 13", updatedTimestamp: 1712966400, wikiId: 4 },
  { icon: "database", name: "Milvus", cat: "Vector DB", catBadge: "badge-purple", pct: 50, color: "#00b4d8", items: 2, updated: "Apr 10", updatedTimestamp: 1712707200, wikiId: null },
  { icon: "zap", name: "Electron", cat: "Desktop", catBadge: "badge-blue", pct: 65, color: "#47848f", items: 3, updated: "Apr 15", updatedTimestamp: 1713139200, wikiId: 9 },
  { icon: "server", name: "PostgreSQL", cat: "Database", catBadge: "badge-blue", pct: 72, color: "#336791", items: 5, updated: "Apr 11", updatedTimestamp: 1712793600, wikiId: 5 },
  { icon: "code", name: "TypeScript", cat: "Frontend", catBadge: "badge-blue", pct: 80, color: "#3178c6", items: 7, updated: "Apr 14", updatedTimestamp: 1713052800, wikiId: null },
  { icon: "activity", name: "Kubernetes", cat: "DevOps", catBadge: "badge-orange", pct: 45, color: "#326ce5", items: 2, updated: "Apr 09", updatedTimestamp: 1712620800, wikiId: null },
  { icon: "cpu", name: "OpenAI API", cat: "AI/ML", catBadge: "badge-purple", pct: 90, color: "#10a37f", items: 9, updated: "Apr 15", updatedTimestamp: 1713139200, wikiId: null },
  { icon: "shield", name: "Keycloak", cat: "Auth", catBadge: "badge-muted", pct: 35, color: "#4d9de0", items: 1, updated: "Apr 07", updatedTimestamp: 1712448000, wikiId: null },
  { icon: "link", name: "GraphQL", cat: "API", catBadge: "badge-green", pct: 55, color: "#e10098", items: 3, updated: "Apr 08", updatedTimestamp: 1712534400, wikiId: null },
];

const DEFAULT_RECENT_ITEMS = [
  { id: "1", name: "RAG Architecture", icon: "bot" },
  { id: "2", name: "DeFi Liquidity Pools", icon: "landmark" },
  { id: "3", name: "K8s Operators", icon: "server" },
  { id: "10", name: "SRS Best Practices", icon: "clipboard" },
  { id: "5", name: "Prompt Engineering", icon: "cpu" },
  { id: "8", name: "Docker Compose Patterns", icon: "box" },
];

interface RolePanelItem {
  id: number;
  iconName: string;
  color: string;
  bg: string;
  label: string;
}

const TOOLKIT_ITEMS: RolePanelItem[] = [
  { id: 10, iconName: "filetext", color: "#10b981", bg: "rgba(16,185,129,.15)", label: "SRS Document" },
  { id: 13, iconName: "box", color: "#8b5cf6", bg: "rgba(139,92,246,.15)", label: "Use Case Spec" },
  { id: 11, iconName: "shield", color: "#3b82f6", bg: "rgba(59,130,246,.15)", label: "User Journey Map" },
  { id: 12, iconName: "helpcircle", color: "#f97316", bg: "rgba(249,115,22,.15)", label: "IA Taxonomy" },
  { id: 14, iconName: "clipboard", color: "#ec4899", bg: "rgba(236,72,153,.15)", label: "BRD Template" },
  { id: 15, iconName: "checkcircle2", color: "#06b6d4", bg: "rgba(6,182,212,.15)", label: "Acceptance Criteria" },
  { id: 16, iconName: "star", color: "#a855f7", bg: "rgba(168,85,247,.15)", label: "Stakeholder Map" },
  { id: 17, iconName: "flame", color: "#f59e0b", bg: "rgba(245,158,11,.15)", label: "Sprint Backlog Format" },
  { id: 21, iconName: "code", color: "#10b981", bg: "rgba(16,185,129,.15)", label: "API Contract Spec" },
  { id: 22, iconName: "alerttriangle", color: "#ef4444", bg: "rgba(239,68,68,.15)", label: "Risk Register" },
];

const SKILLS_ITEMS: RolePanelItem[] = [
  { id: 18, iconName: "star", color: "#3b82f6", bg: "rgba(59,130,246,.15)", label: "Product Strategy" },
  { id: 20, iconName: "activity", color: "#10b981", bg: "rgba(16,185,129,.15)", label: "Data Analysis" },
  { id: 19, iconName: "bot", color: "#f97316", bg: "rgba(249,115,22,.15)", label: "Stakeholder Mgmt" },
];


const getDomainIcon = (name: string): string => {
  const lowercase = name?.toLowerCase() || "";
  if (lowercase.includes("fintech")) return "landmark";
  if (lowercase.includes("rag") || lowercase.includes("llm")) return "bot";
  if (lowercase.includes("devops")) return "server";
  if (lowercase.includes("toolkit") || lowercase.includes("ba")) return "clipboard";
  if (lowercase.includes("blockchain")) return "link";
  if (lowercase.includes("security")) return "shield";
  if (lowercase.includes("ai") || lowercase.includes("ml")) return "cpu";
  if (lowercase.includes("data") || lowercase.includes("db") || lowercase.includes("database")) return "database";
  if (lowercase.includes("cloud")) return "zap";
  if (lowercase.includes("design") || lowercase.includes("product")) return "star";
  return "file-text";
};

const getIconComponent = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case "landmark":
      return <LineIcon name="home" className="h-3.5 w-3.5" />;
    case "bot":
      return <LineIcon name="android" className="h-3.5 w-3.5" />;
    case "server":
      return <LineIcon name="database" className="h-3.5 w-3.5" />;
    case "clipboard":
      return <LineIcon name="clipboard" className="h-3.5 w-3.5" />;
    case "shield":
      return <LineIcon name="shield" className="h-3.5 w-3.5" />;
    case "cpu":
      return <LineIcon name="cpu" className="h-3.5 w-3.5" />;
    case "code":
      return <LineIcon name="code" className="h-3.5 w-3.5" />;
    case "box":
      return <LineIcon name="package" className="h-3.5 w-3.5" />;
    case "star":
      return <LineIcon name="star" className="h-3.5 w-3.5" />;
    case "pin":
      return <LineIcon name="pin" className="h-3.5 w-3.5" />;
    case "flame":
      return <LineIcon name="fire" className="h-3.5 w-3.5" />;
    case "database":
      return <LineIcon name="database" className="h-3.5 w-3.5" />;
    case "zap":
      return <LineIcon name="bolt" className="h-3.5 w-3.5" />;
    case "globe":
      return <LineIcon name="world" className="h-3.5 w-3.5" />;
    case "link":
      return <LineIcon name="link" className="h-3.5 w-3.5" />;
    case "activity":
      return <LineIcon name="pulse" className="h-3.5 w-3.5" />;
    case "helpcircle":
      return <LineIcon name="questionmark-circle" className="h-3.5 w-3.5" />;
    case "plus":
      return <LineIcon name="plus" className="h-3.5 w-3.5" />;
    default:
      return <LineIcon name="files" className="h-3.5 w-3.5" />;
  }
};

export function DashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleKbIdFromUrl = searchParams.get("roleKbId") || "";
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useTranslation();

  // Core Dashboard State
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [activeJobs, setActiveJobs] = useState<DashboardCompileJob[]>([]);
  const [quota, setQuota] = useState<DashboardQuota | null>(null);
  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [selectedRoleKbId, setSelectedRoleKbId] = useState<string>(roleKbIdFromUrl);

  // UI Page States
  const [sortBy, setSortBy] = useState<"name" | "domain" | "pct" | "updated">("updated");

  // Custom Dropdown States (DeepMind design style)
  const [kbDropdownOpen, setKbDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // UI Page States
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [globalErrorMsg, setGlobalErrorMsg] = useState<string | null>(null);
  // Non-blocking API warning (shows banner but dashboard still renders)
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  // Polling management refs
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);
  const maxPolls = 30; // Stop polling after 5 minutes (30 * 10s = 300s)

  // ────────────────────────────────────────────────────────────────
  // 1. Error Handling & Vietnamese Translations
  // ────────────────────────────────────────────────────────────────
  const handleGlobalError = useCallback(
    (code: string, fallbackMsg: string) => {
      switch (code) {
        case "UNAUTHORIZED":
          setGlobalErrorMsg(t("dashboard.errors.UNAUTHORIZED", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
          clearAuth();
          router.push(`/${locale}/login?returnUrl=/${locale}/dashboard`);
          break;
        case "EMAIL_NOT_VERIFIED":
          setGlobalErrorMsg(t("dashboard.errors.EMAIL_NOT_VERIFIED", "Vui lòng xác thực email để tiếp tục sử dụng hệ thống."));
          break;
        case "ONBOARDING_REQUIRED":
          setGlobalErrorMsg(t("dashboard.errors.ONBOARDING_REQUIRED", "Hoàn tất thiết lập ban đầu (onboarding) để tạo knowledge base đầu tiên."));
          router.push(`/${locale}/onboarding`);
          break;
        case "ROLE_KB_NOT_FOUND":
          setGlobalErrorMsg(t("dashboard.errors.ROLE_NOT_FOUND", "Không tìm thấy dữ liệu vị trí chuyên ngành này."));
          break;
        case "FORBIDDEN":
          setGlobalErrorMsg(t("dashboard.errors.UNAUTHORIZED_ACCESS", "Bạn không có quyền truy cập vào dashboard này."));
          break;
        case "RATE_LIMITED":
          setGlobalErrorMsg(t("dashboard.errors.RATE_LIMITED", "Thao tác quá nhanh. Vui lòng đợi và thử lại sau ít phút."));
          break;
        case "SERVER_ERROR":
          setGlobalErrorMsg(t("dashboard.errors.SERVER_ERROR", "Hệ thống gặp sự cố tải dữ liệu. Vui lòng thử lại."));
          break;
        default:
          setGlobalErrorMsg(fallbackMsg || t("dashboard.errors.SERVER_ERROR", "Có lỗi xảy ra. Thử lại sau."));
      }
    },
    [clearAuth, router, t, locale]
  );

  // ────────────────────────────────────────────────────────────────
  // Fallback summary built from auth context when API is unavailable
  // ────────────────────────────────────────────────────────────────
  const buildFallbackSummary = useCallback((): DashboardSummaryData => {
    return {
      user: {
        id: authUser?.id || "",
        displayName: authUser?.displayName || authUser?.email || "",
        email: authUser?.email || "",
        isEmailVerified: authUser?.emailVerified ?? true,
        onboardingStatus: "completed",
        plan: (authUser?.plan as "free" | "pro") || "free",
      },
      role: {
        roleKbId: "",
        roleName: t("dashboard.errors.noKb", "Đang tải..."),
        roleGroup: locale === "vi" ? "Khác" : "Other",
        isPrimary: true,
        createdAt: new Date().toISOString(),
      },
      stats: {
        totalItems: 0,
        activeDomains: 0,
        processingJobs: 0,
        failedJobs: 0,
        indexedItems: 0,
        degradedItems: 0,
        pendingRetrievalItems: 0,
        queriesUsedToday: 0,
        queriesLimitToday: authUser?.plan === "pro" ? 100 : 20,
        compilesUsedThisMonth: 0,
        compilesLimitThisMonth: authUser?.plan === "pro" ? 200 : 30,
        storageUsedBytes: 0,
        storageLimitBytes: authUser?.plan === "pro" ? 1073741824 : 104857600,
      },
      quickActions: [],
      recentItems: [],
      activeJobs: [],
      domainSnapshot: [],
      activity: [],
      quota: null,
      sectionErrors: [],
      serverTime: new Date().toISOString(),
    };
  }, [authUser, t, locale]);

  // ────────────────────────────────────────────────────────────────
  // 2. Initial Data Fetch (Bootstrap)
  // ────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(
    async (roleKbId?: string, isInitial = false) => {
      if (isInitial) setIsLoading(true);
      else setIsChangingRole(true);
      setGlobalErrorMsg(null);

      try {
        // Load dashboard summary
        const summaryRes = await getDashboardSummaryAction(roleKbId);
        console.log("🟢 [F12 API RESPONSE] getDashboardSummaryAction:", summaryRes);

        if (summaryRes.status === "1" && summaryRes.data) {
          const data = summaryRes.data;
          setSummary(data);
          setActiveJobs(data.activeJobs || []);
          setQuota(data.quota);
          if (data.role?.roleKbId) {
            setSelectedRoleKbId(data.role.roleKbId);
            if (roleKbIdFromUrl !== data.role.roleKbId) {
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.set("roleKbId", data.role.roleKbId);
              router.replace(`/${locale}/dashboard?${newParams.toString()}`);
            }
          }

          // Fetch user's roles list to support switcher for Pro users
          if (isInitial) {
            const stateRes = await getOnboardingStateAction();
            if (stateRes.status === "1" && stateRes.data?.roles) {
              setUserRoles(stateRes.data.roles);
            }
          }
        } else {
          const errCode = summaryRes.error_code;
          // Auth/permission errors → hard block (redirect)
          if (errCode === "UNAUTHORIZED" || errCode === "FORBIDDEN" || errCode === "ONBOARDING_REQUIRED") {
            handleGlobalError(errCode, summaryRes.msg);
          } else {
            // Non-auth error (API not ready, network, etc.) → graceful degradation
            if (!summary) setSummary(buildFallbackSummary());
            setApiWarning(summaryRes.msg || t("dashboard.errors.loadFailed", "Không thể tải dữ liệu mới nhất. Thử lại để cập nhật."));
          }
        }
      } catch (err) {
        console.error("fetchDashboardData error:", err);
        // Network error → degrade gracefully, never block the whole dashboard
        if (!summary) setSummary(buildFallbackSummary());
        setApiWarning(t("dashboard.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Một số dữ liệu có thể chưa cập nhật."));
      } finally {
        setIsLoading(false);
        setIsChangingRole(false);
      }
    },
    [handleGlobalError, summary, buildFallbackSummary, t]
  );

  useEffect(() => {
    // Avoid synchronous execution by deferring with setTimeout
    const timer = setTimeout(() => {
      fetchDashboardData(roleKbIdFromUrl || undefined, true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData, roleKbIdFromUrl]);

  // Handle click outside to close custom dropdown menus (DeepMind design switcher)
  useEffect(() => {
    if (!kbDropdownOpen && !sortDropdownOpen) return;
    const handleClose = () => {
      setKbDropdownOpen(false);
      setSortDropdownOpen(false);
    };
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [kbDropdownOpen, sortDropdownOpen]);

  // ────────────────────────────────────────────────────────────────
  // 3. Active Jobs Polling Management
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if we have active (non-terminal) jobs
    const hasActive = activeJobs.some((j) => !j.isTerminal);

    if (!hasActive) {
      // Clear interval if no active jobs
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      pollCountRef.current = 0;
      return;
    }

    // Set up polling interval every 10 seconds
    if (!pollTimerRef.current) {
      pollCountRef.current = 0;
      pollTimerRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        // Safety limit: Stop after 5 minutes of continuous polling without updates
        if (pollCountRef.current >= maxPolls) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          return;
        }

        try {
          const res = await getActiveJobsAction(selectedRoleKbId);
          console.log("🟢 [F12 API RESPONSE] getActiveJobsAction:", res);
          if (res.status === "1" && res.data) {
            const newJobs = res.data.jobs || [];
            setActiveJobs(newJobs);

            // If a job transitions to terminal, trigger full refresh to update stats & lists
            const becameTerminal = newJobs.some((j) => j.isTerminal);
            const originallyActiveCount = activeJobs.filter((j) => !j.isTerminal).length;
            const currentlyActiveCount = newJobs.filter((j) => !j.isTerminal).length;

            if (becameTerminal || currentlyActiveCount < originallyActiveCount) {
              fetchDashboardData(selectedRoleKbId, false);
            }
          }
        } catch (err) {
          console.error("Active jobs poll error:", err);
        }
      }, 10000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [activeJobs, selectedRoleKbId, fetchDashboardData]);

  // ────────────────────────────────────────────────────────────────
  // 4. Component Actions
  // ────────────────────────────────────────────────────────────────
  const handleRoleChange = (roleKbId: string) => {
    if (roleKbId === selectedRoleKbId) return;
    setSelectedRoleKbId(roleKbId);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("roleKbId", roleKbId);
    router.replace(`/${locale}/dashboard?${newParams.toString()}`);
    
    fetchDashboardData(roleKbId, false);
  };

  const handleLogout = () => {
    startTransition(async () => {
      clearAuth();
      await logoutAction();
    });
  };

  // Section error checker helper
  const getSectionError = (sectionName: string): SectionError | undefined => {
    return summary?.sectionErrors?.find((se) => se.section === sectionName);
  };

  // ────────────────────────────────────────────────────────────────
  // Translation Helpers
  // ────────────────────────────────────────────────────────────────
  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <LineIcon name="files" className="h-4 w-4 text-brand-400" />;
      case "url":
        return <LineIcon name="link" className="h-4 w-4 text-blue-400" />;
      default:
        return <LineIcon name="upload" className="h-4 w-4 text-purple-400" />;
    }
  };

  const getRetrievalStatusBadge = (status: string) => {
    switch (status) {
      case "indexed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
            {t("dashboard.status.ready", "Sẵn sàng")}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
            <LineIcon name="alarm" className="h-3 w-3" /> {t("dashboard.status.indexing", "Đang chỉ mục")}
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
            <LineIcon name="warning" className="h-3 w-3" /> {t("dashboard.status.lowQuality", "Chất lượng thấp")}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
            <LineIcon name="xmark-circle" className="h-3 w-3" /> {t("dashboard.status.error", "Lỗi")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-2">
            {t("dashboard.status.unknown", "Chưa rõ")}
          </span>
        );
    }
  };

  const getJobStatusLabel = (status: string) => {
    switch (status) {
      case "queued":
        return t("dashboard.status.pending", "Đang chờ xử lý");
      case "processing":
        return t("dashboard.status.analyzing", "Đang phân tích");
      case "wiki_ready":
        return t("dashboard.status.completed", "Đã hoàn thành");
      case "failed":
        return t("dashboard.status.failed", "Thất bại");
      case "cancelled":
        return t("dashboard.status.cancelled", "Đã hủy");
      default:
        return t("dashboard.status.running", "Đang chạy");
    }
  };

  const getJobStageTranslation = (stage: string) => {
    switch (stage) {
      case "queued":
        return t("dashboard.stage.queued", "Xếp hàng đợi");
      case "validating":
        return t("dashboard.stage.validating", "Xác thực dữ liệu");
      case "fetching_or_uploading":
        return t("dashboard.stage.fetching", "Tải nội dung nguồn");
      case "extracting":
        return t("dashboard.stage.extracting", "Trích xuất văn bản");
      case "normalizing":
        return t("dashboard.stage.normalizing", "Chuẩn hóa dữ liệu");
      case "chunking":
        return t("dashboard.stage.chunking", "Phân mảnh văn bản");
      case "summarizing":
        return t("dashboard.stage.summarizing", "Tóm tắt thông tin");
      case "indexing":
        return t("dashboard.stage.indexing", "Lập chỉ mục vector");
      case "wiki_ready":
        return t("dashboard.stage.wikiReady", "Hoàn tất Wiki item");
      case "failed":
        return t("dashboard.stage.failed", "Xử lý lỗi");
      case "cancelled":
        return t("dashboard.stage.cancelled", "Đã hủy bỏ");
      default:
        return t("dashboard.stage.compiling", "Đang biên dịch");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ────────────────────────────────────────────────────────────────
  // RENDERS
  // ────────────────────────────────────────────────────────────────

  // 1. Loading State
  if (isLoading) {
    return <Loading />;
  }

  // 2. Global Error State (Retryable)
  if (globalErrorMsg && !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-auth-bg text-auth-text px-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center shadow-auth relative backdrop-blur-md premium-hover-card-red">
          <div className="w-12 h-12 rounded-full bg-auth-error-dim text-auth-error flex items-center justify-center mx-auto mb-4">
            <LineIcon name="warning" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-auth-text">{t("dashboard.errors.connectionFailed", "Không thể kết nối dữ liệu")}</h2>
          <p className="text-sm text-auth-text-2 mt-2 leading-relaxed">{globalErrorMsg}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => fetchDashboardData(selectedRoleKbId || undefined, true)}
              leftIcon={<LineIcon name="sync" className="h-4 w-4" />}
            >
              {t("dashboard.btnRetry", "Thử lại")}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={handleLogout}
            >
              {t("dashboard.btnLogout", "Đăng xuất")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user: userCtx, role: roleCtx, stats } = summary!;
  const planName = userCtx.plan === "pro" ? "Pro Plan" : "Free Plan";

  const sortedTechs = [...DEFAULT_TECHS].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "domain") {
      return a.cat.localeCompare(b.cat);
    }
    if (sortBy === "pct") {
      return b.pct - a.pct;
    }
    if (sortBy === "updated") {
      return b.updatedTimestamp - a.updatedTimestamp;
    }
    return 0;
  });

  return (
    <div className="dashboard-page min-h-screen bg-[#09090b] text-[#fafafa] relative overflow-hidden flex flex-col animate-fade-in">
      {/* Glow Effects */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]" style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-[100px] top-[10%] h-[400px] w-[400px] blur-[100px]" style={{ background: "radial-gradient(circle, var(--color-auth-accent-dim) 0%, transparent 70%)" }} aria-hidden="true" />

      {/* ────────────────── Header / Navigation ────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-2xl">
        <div className="container-focused flex h-14 items-center justify-between gap-4 relative">
          {/* ── Left: Logo ── */}
          <div className="flex-shrink-0">
            <Link href={`/${locale}`} className="flex items-center gap-2 group select-none">
              <PulseLogo size={28} className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_var(--color-auth-accent-glow)]" />
              <span className="text-[15px] font-extrabold tracking-tight text-white leading-none hidden sm:block">
                Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
          </div>

          {/* ── Center: Nav pill group (desktop) ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex">
            <nav className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              <Link
                href={selectedRoleKbId ? `/${locale}/dashboard?roleKbId=${selectedRoleKbId}` : `/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/25 transition-all"
                title="Dashboard"
              >
                <LineIcon name="grid-alt" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">{t("dashboard.title", "Dashboard")}</span>
              </Link>
              <Link
                href={stats.totalItems > 0 ? `/${locale}/query${selectedRoleKbId ? `?roleKbId=${selectedRoleKbId}` : ""}` : "#"}
                onClick={(e) => { if (stats.totalItems === 0) e.preventDefault(); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  stats.totalItems > 0
                    ? "text-[#a1a1aa] hover:text-white hover:bg-white/[0.05]"
                    : "text-[#52525b] cursor-not-allowed"
                }`}
                title={t("compile.labels.sidebarQuery", "Hỏi đáp AI")}
              >
                <LineIcon name="comment" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">{t("compile.labels.sidebarQuery", "Hỏi đáp AI")}</span>
              </Link>
              <Link
                href={`/${locale}/research${selectedRoleKbId ? `?roleKbId=${selectedRoleKbId}` : ""}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-all"
                title={t("common.research", "Nghiên cứu AI")}
              >
                <LineIcon name="compass" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">{t("common.research", "Nghiên cứu")}</span>
              </Link>
              <Link
                href={`/${locale}/wiki${selectedRoleKbId ? `?roleKbId=${selectedRoleKbId}` : ""}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-all"
                title={t("compile.labels.sidebarWiki", "Wiki")}
              >
                <LineIcon name="book" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">{t("compile.labels.sidebarWiki", "Wiki")}</span>
              </Link>
              <Link
                href={`/${locale}/settings`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-all"
                title={t("common.settings", "Cài đặt")}
              >
                <LineIcon name="database" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">{t("common.settings", "Cài đặt")}</span>
              </Link>
            </nav>
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search pill — xl+ only (enough room at 1280px+) */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="hidden xl:flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] text-auth-text-3 hover:text-auth-text-2 transition-all duration-200 cursor-pointer text-[11px] select-none"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <LineIcon name="search" className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.04] border border-white/[0.08] rounded text-auth-text-3/70">⌘K</kbd>
            </button>

            {/* Search icon only (tablet) */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="hidden lg:flex xl:hidden h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] text-auth-text-3 hover:text-white transition-all cursor-pointer"
            >
              <LineIcon name="search" className="h-3.5 w-3.5" />
            </button>

            {/* Mobile search */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-global-search"));
                }
              }}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-auth-text-2 hover:text-white transition-all cursor-pointer"
            >
              <LineIcon name="search" className="h-3.5 w-3.5" />
            </button>

            {/* Locale switcher */}
            <LocaleSwitcher id="dashboard-header" />

            {/* Divider */}
            <div className="hidden lg:block h-5 w-px bg-white/10" />

            {/* User avatar + name + logout */}
            <div className="flex items-center gap-2">
              {/* Avatar initials */}
              <div className="hidden lg:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-accent-400/30 border border-white/[0.12] text-[11px] font-bold text-white select-none">
                {(userCtx.displayName || userCtx.email || "U").charAt(0).toUpperCase()}
              </div>

              {/* Name + plan (desktop only) */}
              <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                <span className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                  {userCtx.displayName?.split(" ").slice(-1)[0] || userCtx.email?.split("@")[0]}
                </span>
                <span className="text-[9px] font-semibold text-auth-accent/80 uppercase tracking-wide">{planName}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-auth-text-3 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all duration-200 cursor-pointer disabled:opacity-50"
                title={t("dashboard.btnLogout", "Đăng xuất")}
                aria-label={t("dashboard.btnLogout", "Đăng xuất")}
              >
                {isPending ? <DotMatrixLoader variant="pulse" size="xs" /> : <LineIcon name="exit" className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ────────────────── Main Content Area ────────────────── */}
      <main className="container-focused flex-grow py-8 relative z-10 flex flex-col gap-6">
        {isChangingRole && (
          <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <DotMatrixLoader variant="orbit" size="lg" />
              <p className="text-sm text-[#a1a1aa]">{t("dashboard.errors.syncingRoles", "Đang đồng bộ vai trò chuyên môn...")}</p>
            </div>
          </div>
        )}

        {/* Non-blocking API warning banner */}
        {apiWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300 animate-fade-in">
            <LineIcon name="warning" className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="flex-1">{apiWarning}</span>
            <button
              onClick={() => { setApiWarning(null); fetchDashboardData(selectedRoleKbId || undefined, true); }}
              className="ml-2 shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              {t("dashboard.btnRetry", "Thử lại")}
            </button>
            <button onClick={() => setApiWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors cursor-pointer">
              <LineIcon name="xmark-circle" className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between backdrop-blur-md rounded-2xl p-6 relative premium-hover-card">
          <div>
            <h1 className="text-fluid-lg font-extrabold tracking-tight">
              {t("dashboard.welcome.hello", "Xin chào, {name} 👋").replace("{name}", userCtx.displayName || (locale === "vi" ? "Bạn" : "User"))}
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {t("dashboard.welcome.subtitle", "Hệ thống đã sẵn sàng hỗ trợ nghiên cứu và tích lũy tri thức công việc.")}
            </p>
          </div>

          {/* Role selection dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
              {t("dashboard.kbHeader", "Knowledge Base Chuyên Ngành")}
            </label>
            {userCtx.plan === "pro" && userRoles.length > 1 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setKbDropdownOpen(!kbDropdownOpen);
                  }}
                  className="w-full bg-[#18181b] border border-[#27272a] hover:border-white/[0.15] text-xs text-[#fafafa] font-semibold rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all duration-300"
                >
                  <span>
                    {userRoles.find((r) => r.id === selectedRoleKbId)?.roleName || t("dashboard.selectDomain", "Chọn Chuyên Ngành")}
                  </span>
                  <LineIcon name="chevron-right" className={`h-4 w-4 text-[#52525b] transition-transform duration-300 ${kbDropdownOpen ? "-rotate-90" : "rotate-90"}`} />
                </button>
                
                {kbDropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1.5 w-full min-w-[240px] z-50 glass-premium rounded-xl overflow-hidden py-1.5 shadow-2xl animate-dropdown-enter"
                  >
                    {userRoles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          handleRoleChange(r.id);
                          setKbDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors duration-200 hover:bg-white/5 ${r.id === selectedRoleKbId ? "text-auth-accent bg-auth-accent-dim/30" : "text-auth-text-2"}`}
                      >
                        <span>{r.roleName} ({r.roleGroup})</span>
                        {r.id === selectedRoleKbId && <span className="h-1.5 w-1.5 rounded-full bg-auth-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-semibold text-auth-accent flex items-center gap-2">
                <span>{roleCtx?.roleName || t("dashboard.status.unknown", "Chưa xác định")}</span>
                <span className="text-[10px] text-[#52525b] font-normal">
                  ({roleCtx?.roleGroup || (locale === "vi" ? "Khác" : "Other")})
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Active Ingesting Jobs Section */}
        {activeJobs.length > 0 && (
          <section className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-5 premium-hover-card-cyan">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase text-[#52525b]">
                  {locale === "vi" ? "Tiến trình nạp kiến thức" : "Knowledge Ingestion Progress"}
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  {locale === "vi" ? "Các tài liệu đang được phân tích sang Wiki dạng cấu trúc." : "Documents are being compiled into structured Wiki items."}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold animate-pulse">
                <DotMatrixLoader variant="breathe" size="xs" /> {t("query.loading", "Đang tải...")}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#18181b]/60 border border-[#27272a]/50 rounded-xl p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {getSourceTypeIcon(job.sourceType)}
                      <span className="text-xs font-bold text-white truncate">
                        {job.title || (locale === "vi" ? "Tài liệu nạp..." : "Ingesting document...")}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      job.status === "failed"
                        ? "bg-red-950/40 border border-red-500/20 text-red-400"
                        : "bg-auth-accent-dim border border-auth-accent/20 text-auth-accent"
                    }`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        job.status === "failed"
                          ? "bg-red-500"
                          : "bg-[var(--color-auth-accent)]"
                      }`}
                      style={{ width: `${job.progress || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#a1a1aa]">
                    <span className="font-semibold text-brand-400">
                      {getJobStageTranslation(job.stage)}
                    </span>
                    <span>
                      {job.message || t("compile.labels.progressCompleted", "{progress}% hoàn thành").replace("{progress}", String(job.progress || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Chart + Stats Panel */}
        <section className="hero-section">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">

            {/* ── Left: Activity Chart (60%) ── */}
            <div className="xl:col-span-3">
              <ActivityChart />
            </div>

            {/* ── Right: Token Terminal Stats Panel (40%) ── */}
            <div className="xl:col-span-2 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#52525b]">
                  {locale === "vi" ? "Thống Kê Tổng Quan" : "Key Metrics"}
                </span>
                <span className="text-[10px] text-[#3f3f46] font-mono">live</span>
              </div>

              {/* Stat cards grid */}
              <div className="grid grid-cols-2 gap-2.5">

                {/* 1. Knowledge Items */}
                <div className="stat-terminal-card group">
                  <div className="stat-terminal-label">
                    <Database className="h-3 w-3" />
                    {locale === "vi" ? "Tài liệu KB" : "KB Items"}
                  </div>
                  <div className="stat-terminal-value">{stats.totalItems.toLocaleString()}</div>
                  <div className="stat-terminal-sub">
                    {stats.indexedItems} {locale === "vi" ? "đã index" : "indexed"}
                    {stats.pendingRetrievalItems > 0 && (
                      <span className="text-amber-400/70"> · {stats.pendingRetrievalItems} pending</span>
                    )}
                  </div>
                </div>

                {/* 2. Active Domains */}
                <div className="stat-terminal-card group">
                  <div className="stat-terminal-label">
                    <Globe className="h-3 w-3" />
                    {locale === "vi" ? "Domain" : "Domains"}
                  </div>
                  <div className="stat-terminal-value">{stats.activeDomains}</div>
                  <div className="stat-terminal-sub">
                    {locale === "vi" ? "chuyên ngành đang dùng" : "active domains"}
                  </div>
                </div>

                {/* 3. AI Queries (today) */}
                <div className="stat-terminal-card group">
                  <div className="stat-terminal-label">
                    <MessageSquare className="h-3 w-3" />
                    {locale === "vi" ? "Query AI hôm nay" : "AI Queries"}
                  </div>
                  <div className="stat-terminal-value">
                    {stats.queriesUsedToday}
                    {stats.queriesLimitToday > 0 && (
                      <span className="stat-terminal-limit">/{stats.queriesLimitToday}</span>
                    )}
                  </div>
                  {stats.queriesLimitToday > 0 && (
                    <div className="stat-terminal-bar-track">
                      <div
                        className="stat-terminal-bar-fill"
                        style={{
                          width: `${Math.min((stats.queriesUsedToday / stats.queriesLimitToday) * 100, 100)}%`,
                          background: stats.queriesUsedToday >= stats.queriesLimitToday
                            ? "var(--color-auth-error)"
                            : stats.queriesUsedToday >= stats.queriesLimitToday * 0.8
                            ? "#f59e0b"
                            : "var(--color-auth-accent)",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Compiles (this month) */}
                <div className="stat-terminal-card group">
                  <div className="stat-terminal-label">
                    <Zap className="h-3 w-3" />
                    {locale === "vi" ? "Ingests tháng này" : "Ingests / mo"}
                  </div>
                  <div className="stat-terminal-value">
                    {stats.compilesUsedThisMonth}
                    {stats.compilesLimitThisMonth > 0 && (
                      <span className="stat-terminal-limit">/{stats.compilesLimitThisMonth}</span>
                    )}
                  </div>
                  {stats.compilesLimitThisMonth > 0 && (
                    <div className="stat-terminal-bar-track">
                      <div
                        className="stat-terminal-bar-fill"
                        style={{
                          width: `${Math.min((stats.compilesUsedThisMonth / stats.compilesLimitThisMonth) * 100, 100)}%`,
                          background: stats.compilesUsedThisMonth >= stats.compilesLimitThisMonth
                            ? "var(--color-auth-error)"
                            : stats.compilesUsedThisMonth >= stats.compilesLimitThisMonth * 0.8
                            ? "#f59e0b"
                            : "#ff6b4a",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 5. Storage — full width */}
                <div className="stat-terminal-card group col-span-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="stat-terminal-label mb-1.5">
                        <Activity className="h-3 w-3" />
                        {locale === "vi" ? "Dung lượng lưu trữ" : "Storage"}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="stat-terminal-value">
                          {stats.storageUsedBytes >= 1073741824
                            ? `${(stats.storageUsedBytes / 1073741824).toFixed(1)} GB`
                            : `${(stats.storageUsedBytes / 1048576).toFixed(1)} MB`}
                        </span>
                        {stats.storageLimitBytes > 0 && (
                          <span className="stat-terminal-limit">
                            / {stats.storageLimitBytes >= 1073741824
                              ? `${(stats.storageLimitBytes / 1073741824).toFixed(0)} GB`
                              : `${(stats.storageLimitBytes / 1048576).toFixed(0)} MB`}
                          </span>
                        )}
                      </div>
                    </div>
                    {stats.storageLimitBytes > 0 && (
                      <span className="text-[11px] font-bold tabular-nums text-[#71717a] mt-1">
                        {Math.round((stats.storageUsedBytes / stats.storageLimitBytes) * 100)}%
                      </span>
                    )}
                  </div>
                  {stats.storageLimitBytes > 0 && (
                    <div className="stat-terminal-bar-track mt-2">
                      <div
                        className="stat-terminal-bar-fill"
                        style={{
                          width: `${Math.min((stats.storageUsedBytes / stats.storageLimitBytes) * 100, 100)}%`,
                          background: (stats.storageUsedBytes / stats.storageLimitBytes) >= 0.9
                            ? "var(--color-auth-error)"
                            : (stats.storageUsedBytes / stats.storageLimitBytes) >= 0.7
                            ? "#f59e0b"
                            : "var(--color-auth-purple)",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 6. Active/Failed Jobs */}
                {(stats.processingJobs > 0 || stats.failedJobs > 0) && (
                  <div className="stat-terminal-card group col-span-2">
                    <div className="stat-terminal-label">
                      <RefreshCw className="h-3 w-3" />
                      {locale === "vi" ? "Jobs đang chạy" : "Active Jobs"}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {stats.processingJobs > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-auth-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-auth-accent animate-pulse" />
                          {stats.processingJobs} processing
                        </span>
                      )}
                      {stats.failedJobs > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                          <XCircle className="h-3 w-3" />
                          {stats.failedJobs} failed
                        </span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>


        {/* Quota Panel (Account Limits) */}
        {quota && (
          <section className="backdrop-blur-md rounded-2xl p-6 relative flex flex-col gap-4 premium-hover-card-purple">
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-[#52525b]">
                {locale === "vi" ? "Giới hạn tài khoản" : "Account Resource Limits"}
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-1">
                {(locale === "vi" ? "Hạn mức tài nguyên theo gói {planName}." : "Resource limits under {planName}.").replace("{planName}", planName)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {/* 1. Storage Quota */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#a1a1aa]">{locale === "vi" ? "Dung lượng lưu trữ" : "Storage Capacity"}</span>
                  <span className="text-[10px] text-[#52525b] font-mono">
                    {formatBytes(quota.storage.usedBytes)} / {formatBytes(quota.storage.limitBytes)}
                  </span>
                </div>
                <div className="w-full bg-[#09090b] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      quota.storage.status === "exceeded"
                        ? "bg-red-500"
                        : quota.storage.status === "warning"
                          ? "bg-amber-400"
                          : "bg-[var(--color-auth-accent)]"
                    }`}
                    style={{ width: `${quota.storage.percentage || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-[#52525b]">{locale === "vi" ? "Gói hỗ trợ biên soạn tài liệu" : "Document compilation size support"}</span>
               </div>

               {/* 2. Queries Quota */}
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between text-xs">
                   <span className="font-semibold text-[#a1a1aa]">{locale === "vi" ? "Lượt hỏi AI hàng ngày" : "Daily AI Queries"}</span>
                   <span className="text-[10px] text-[#52525b] font-mono">
                     {quota.queries.used} / {quota.queries.limit} {locale === "vi" ? "lượt" : "queries"}
                   </span>
                 </div>
                 <div className="w-full bg-[#09090b] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                   <div
                     className={`h-full rounded-full transition-all duration-300 ${
                       quota.queries.status === "exceeded"
                         ? "bg-red-500"
                         : quota.queries.status === "warning"
                           ? "bg-amber-400"
                           : "bg-[var(--color-auth-accent)]"
                     }`}
                     style={{
                       width: `${Math.min(
                         100,
                         (quota.queries.used / (quota.queries.limit || 1)) * 100
                       )}%`,
                     }}
                   />
                 </div>
                 <span className="text-[9px] text-[#52525b] font-medium">
                   {locale === "vi" ? "Tự động làm mới hàng ngày" : "Resets daily"}
                 </span>
               </div>

               {/* 3. Compiles Quota */}
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between text-xs">
                   <span className="font-semibold text-[#a1a1aa]">{locale === "vi" ? "Hạn mức biên dịch tháng" : "Monthly Compilation Limit"}</span>
                   <span className="text-[10px] text-[#52525b] font-mono">
                     {quota.compiles.used} / {quota.compiles.limit} {locale === "vi" ? "nguồn" : "sources"}
                   </span>
                 </div>
                 <div className="w-full bg-[#09090b] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                   <div
                     className={`h-full rounded-full transition-all duration-300 ${
                       quota.compiles.status === "exceeded"
                         ? "bg-red-500"
                         : quota.compiles.status === "warning"
                           ? "bg-amber-400"
                           : "bg-indigo-500"
                     }`}
                     style={{
                       width: `${Math.min(
                         100,
                         (quota.compiles.used / (quota.compiles.limit || 1)) * 100
                       )}%`,
                     }}
                   />
                 </div>
                 <span className="text-[9px] text-[#52525b]">{locale === "vi" ? "Làm mới vào đầu tháng tiếp theo" : "Resets at the start of next month"}</span>
               </div>
            </div>
          </section>
        )}

        {/* Recently Viewed Strip */}
        <div className="recent-strip">
          <div className="recent-strip-label flex items-center gap-1">
            <LineIcon name="alarm" className="h-3 w-3" />
            {locale === "vi" ? "Xem gần đây" : "Recently Viewed"}
          </div>
          <div className="recent-strip-items flex flex-nowrap gap-2">
            {(summary?.recentItems && summary.recentItems.length > 0
              ? summary.recentItems.slice(0, 6).map((item) => ({
                  id: item.id,
                  name: item.title,
                  icon: getDomainIcon(item.domain?.name || "")
                }))
              : DEFAULT_RECENT_ITEMS
            ).map((item) => {
              const dest = item.id ? `/${locale}/wiki/items/${item.id}` : `/${locale}/wiki`;
              return (
                <Link key={item.id || item.name} href={dest} className="recent-chip">
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 60/40 Grid Layout */}
        <div className="content-grid">
          {/* Left Column (60%) */}
          <div className="content-left flex flex-col gap-6">
            
            {/* Domain Knowledge */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">{locale === "vi" ? "Kiến thức Lĩnh vực" : "Domain Knowledge"}</div>
                  <Link className="view-more" href={`/${locale}/wiki`}>
                    {(locale === "vi" ? "Xem tất cả {count} chuyên ngành" : "View all {count} domains").replace("{count}", String(summary?.domainSnapshot?.length || 0))}{" "}
                    <LineIcon name="arrow-right" className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="domain-card-section fade-up">
                <div className="domain-grid">
                  {summary?.domainSnapshot?.map((dom) => {
                    const iconName = getDomainIcon(dom.name);
                    const pctVal = dom.itemCount > 0 ? Math.round((dom.indexedCount / dom.itemCount) * 100) : 0;
                    return (
                      <Link
                        key={dom.id}
                        href={`/${locale}/wiki?domainId=${dom.id}`}
                        className="domain-kcard"
                        role="button"
                        tabIndex={0}
                        aria-label={`${dom.name} — ${dom.itemCount} items`}
                      >
                        <div className="dk-icon-box bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
                          {getIconComponent(iconName)}
                        </div>
                        <div className="dk-name">{dom.name}</div>
                        <div className="dk-count">{(locale === "vi" ? "{count} mục" : "{count} items").replace("{count}", String(dom.itemCount))}</div>
                        <div className="dk-bar">
                          <div
                            className="dk-bar-fill bg-auth-accent"
                            style={{
                              width: `${pctVal}%`,
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tech Stack Knowledge */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">{locale === "vi" ? "Kiến thức Công nghệ" : "Tech Stack Knowledge"}</div>
                  <Link className="view-more" href={`/${locale}/wiki`}>
                    {locale === "vi" ? "Xem tất cả 12 công nghệ" : "View all 12 technologies"}{" "}
                    <LineIcon name="arrow-right" className="h-3 w-3" />
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="relative">
                  <span className="tech-sort-label">{t("wiki.sortBy.label", "Sắp xếp")}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortDropdownOpen(!sortDropdownOpen);
                    }}
                    className="tech-sort-select text-left"
                    style={{ minWidth: "110px" }}
                  >
                    {sortBy === "name" && t("wiki.sortBy.title", "Tên")}
                    {sortBy === "domain" && (locale === "vi" ? "Lĩnh vực" : "Domain")}
                    {sortBy === "pct" && (locale === "vi" ? "Độ thành thạo" : "Proficiency")}
                    {sortBy === "updated" && (locale === "vi" ? "Mới nhất" : "Latest")}
                  </button>

                  {sortDropdownOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1.5 w-[140px] z-50 glass-premium rounded-xl overflow-hidden py-1.5 shadow-2xl animate-dropdown-enter"
                    >
                      {[
                        { value: "name", label: t("wiki.sortBy.title", "Tên") },
                        { value: "domain", label: locale === "vi" ? "Lĩnh vực" : "Domain" },
                        { value: "pct", label: locale === "vi" ? "Độ thành thạo" : "Proficiency" },
                        { value: "updated", label: locale === "vi" ? "Mới nhất" : "Latest" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setSortBy(item.value as "name" | "domain" | "pct" | "updated");
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors duration-200 hover:bg-white/5 ${sortBy === item.value ? "text-auth-accent bg-auth-accent-dim/30" : "text-auth-text-2"}`}
                        >
                          <span>{item.label}</span>
                          {sortBy === item.value && <span className="h-1.5 w-1.5 rounded-full bg-auth-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="tech-section fade-up">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>{locale === "vi" ? "Công nghệ" : "Technology"}</th>
                      <th>{locale === "vi" ? "Phân loại" : "Category"}</th>
                      <th>{locale === "vi" ? "Độ thành thạo" : "Proficiency"}</th>
                      <th style={{ textAlign: "right", paddingRight: "24px" }}>{locale === "vi" ? "Tài liệu" : "Docs"}</th>
                      <th>{locale === "vi" ? "Cập nhật" : "Updated"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTechs.map((tech) => {
                      const dest = tech.wikiId ? `/${locale}/wiki/items/${tech.wikiId}` : `/${locale}/wiki`;
                      return (
                        <tr
                          key={tech.name}
                          onClick={() => router.push(dest)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="tech-name font-bold text-white text-xs py-1">
                              {tech.name}
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#18181b] border border-[#27272a] text-[#a1a1aa]">
                              {tech.cat}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="tech-bar h-1 w-20 bg-[#1c1c1f] rounded-full overflow-hidden">
                                <div
                                  className="tech-bar-fill h-full bg-[var(--color-auth-accent)] rounded-full"
                                  style={{
                                    width: `${tech.pct}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-auth-text-3 font-semibold font-mono">{tech.pct}%</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-2)" }}>{tech.items}</td>
                          <td style={{ fontSize: "12px", color: "var(--text-2)" }}>{tech.updated}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (40%): Role Panels (Toolkit, Workflow, Skills) */}
          <div className="content-right">
            
            {/* BA Toolkit Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">{locale === "vi" ? "Bộ Công Cụ" : "Toolkit"}</div>
                  <Link className="view-more" href={`/${locale}/wiki`}>
                    {t("dashboard.viewAll", "Xem thêm")} <LineIcon name="arrow-right" className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="role-panel-body">
                  {TOOLKIT_ITEMS.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${locale}/wiki/items/${item.id}`}
                      className="group/item flex items-center justify-between py-2 border-b border-[#27272a]/40 text-xs text-auth-text-2 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3 opacity-0 transform -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ITBA Workflow Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">{locale === "vi" ? "Quy Trình Công Việc" : "Workflow"}</div>
                  <Link className="view-more" href={`/${locale}/wiki`}>
                    {t("dashboard.viewAll", "Xem thêm")} <LineIcon name="arrow-right" className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="rp-empty" style={{ flex: 1 }}>
                  <div className="rp-empty-label" style={{ fontSize: "13px", lineHeight: "1.7", marginBottom: "12px" }}>
                    {locale === "vi" 
                      ? "Chưa có quy trình công việc nào.\nYêu cầu AI thiết kế quy trình ngay." 
                      : "No workflows created yet.\nAsk AI to draft a custom workflow."}
                  </div>
                  <Link
                    href={`/${locale}/query?prompt=${encodeURIComponent(
                      "Help me document my ITBA Workflow. I want to create a structured knowledge entry covering the 3 core ITBA phases: Research Phase, Design & Validate Phase, and Spec & Handoff Protocol. Please provide a step-by-step workflow with inputs, outputs, and gate conditions for each phase."
                    )}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-auth-accent text-white hover:bg-auth-accent-dark transition-all active:scale-[0.98] shadow-[0_0_15px_var(--color-auth-accent-glow)]"
                  >
                    <LineIcon name="plus" className="h-3.5 w-3.5" /> {locale === "vi" ? "Vẽ quy trình AI" : "Generate AI Workflow"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Skills Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">{locale === "vi" ? "Kỹ Năng Chuyên Môn" : "Skills"}</div>
                  <Link className="view-more" href={`/${locale}/wiki`}>
                    {t("dashboard.viewAll", "Xem thêm")} <LineIcon name="arrow-right" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="role-panel-body">
                  {SKILLS_ITEMS.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${locale}/wiki/items/${item.id}`}
                      className="group/item flex items-center justify-between py-2 border-b border-[#27272a]/40 text-xs text-auth-text-2 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3 opacity-0 transform -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Scroll to Top */}
      <ScrollToTop className="bottom-[96px] right-[32px]" />

      {/* Floating Action Button */}
      <Link
        href={`/${locale}/compile/new?roleKbId=${selectedRoleKbId}`}
        className="fab-compile group"
        title={t("compile.labels.sidebarCompile", "Compile new knowledge")}
      >
        <LineIcon name="plus" className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
        <span>{t("dashboard.stage.compiling", "Compile")}</span>
      </Link>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#09090b] py-6 text-center text-xs text-[#52525b] z-10">
        <div className="container-focused">
          <p>© 2026 Pulse Knowledge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
