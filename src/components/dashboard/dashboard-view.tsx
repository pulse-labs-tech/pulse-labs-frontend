"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ScrollToTop } from "@/components/ui";
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  BookOpen,
  Upload,
  Link2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  LogOut,
  Compass,
  Lock,
  Zap,
  Activity,
  Database,
  Globe,
  Loader2,
  AlertCircle,
  Plus,
  Landmark,
  Bot,
  Server,
  Clipboard,
  Shield,
  Cpu,
  Code,
  Box,
  Star,
  Pin,
  Flame,
  HelpCircle,
} from "lucide-react";
import { ActivityChart } from "./activity-chart";
import { useAuth } from "@/hooks/use-auth";
import { logoutAction } from "@/app/actions/auth";
import {
  getDashboardSummaryAction,
  getActiveJobsAction,
  getQuotaAction,
} from "@/app/actions/dashboard";
import { getOnboardingStateAction } from "@/app/actions/onboarding";
import type {
  DashboardSummaryData,
  DashboardCompileJob,
  DashboardQuota,
  SectionError,
} from "@/types/dashboard";
import type { RoleKbDto } from "@/types/onboarding";

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
      return <Landmark className="h-3.5 w-3.5" />;
    case "bot":
      return <Bot className="h-3.5 w-3.5" />;
    case "server":
      return <Server className="h-3.5 w-3.5" />;
    case "clipboard":
      return <Clipboard className="h-3.5 w-3.5" />;
    case "shield":
      return <Shield className="h-3.5 w-3.5" />;
    case "cpu":
      return <Cpu className="h-3.5 w-3.5" />;
    case "code":
      return <Code className="h-3.5 w-3.5" />;
    case "box":
      return <Box className="h-3.5 w-3.5" />;
    case "star":
      return <Star className="h-3.5 w-3.5" />;
    case "pin":
      return <Pin className="h-3.5 w-3.5" />;
    case "flame":
      return <Flame className="h-3.5 w-3.5" />;
    case "database":
      return <Database className="h-3.5 w-3.5" />;
    case "zap":
      return <Zap className="h-3.5 w-3.5" />;
    case "globe":
      return <Globe className="h-3.5 w-3.5" />;
    case "link":
      return <Link2 className="h-3.5 w-3.5" />;
    case "activity":
      return <Activity className="h-3.5 w-3.5" />;
    case "helpcircle":
      return <HelpCircle className="h-3.5 w-3.5" />;
    case "plus":
      return <Plus className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

export function DashboardView() {
  const router = useRouter();
  const { user: authUser, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Core Dashboard State
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [activeJobs, setActiveJobs] = useState<DashboardCompileJob[]>([]);
  const [quota, setQuota] = useState<DashboardQuota | null>(null);
  const [userRoles, setUserRoles] = useState<RoleKbDto[]>([]);
  const [selectedRoleKbId, setSelectedRoleKbId] = useState<string>("");

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
          setGlobalErrorMsg("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuth();
          router.push("/login?returnUrl=/dashboard");
          break;
        case "EMAIL_NOT_VERIFIED":
          setGlobalErrorMsg("Vui lòng xác thực email để tiếp tục sử dụng hệ thống.");
          break;
        case "ONBOARDING_REQUIRED":
          setGlobalErrorMsg("Hoàn tất thiết lập ban đầu (onboarding) để tạo knowledge base đầu tiên.");
          router.push("/onboarding");
          break;
        case "ROLE_KB_NOT_FOUND":
          setGlobalErrorMsg("Không tìm thấy dữ liệu vị trí chuyên ngành này.");
          break;
        case "FORBIDDEN":
          setGlobalErrorMsg("Bạn không có quyền truy cập vào dashboard này.");
          break;
        case "RATE_LIMITED":
          setGlobalErrorMsg("Thao tác quá nhanh. Vui lòng đợi và thử lại sau ít phút.");
          break;
        case "SERVER_ERROR":
          setGlobalErrorMsg("Hệ thống gặp sự cố tải dữ liệu. Vui lòng thử lại.");
          break;
        default:
          setGlobalErrorMsg(fallbackMsg || "Có lỗi xảy ra. Thử lại sau.");
      }
    },
    [clearAuth, router]
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
        roleName: "Đang tải...",
        roleGroup: "Khác",
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
  }, [authUser]);

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

        if (summaryRes.status === "1" && summaryRes.data) {
          const data = summaryRes.data;
          setSummary(data);
          setActiveJobs(data.activeJobs || []);
          setQuota(data.quota);
          if (data.role?.roleKbId) {
            setSelectedRoleKbId(data.role.roleKbId);
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
            setApiWarning(summaryRes.msg || "Không thể tải dữ liệu mới nhất. Thử lại để cập nhật.");
          }
        }
      } catch (err) {
        console.error("fetchDashboardData error:", err);
        // Network error → degrade gracefully, never block the whole dashboard
        if (!summary) setSummary(buildFallbackSummary());
        setApiWarning("Không kết nối được máy chủ. Một số dữ liệu có thể chưa cập nhật.");
      } finally {
        setIsLoading(false);
        setIsChangingRole(false);
      }
    },
    [handleGlobalError, summary, buildFallbackSummary]
  );

  useEffect(() => {
    // Avoid synchronous execution by deferring with setTimeout
    const timer = setTimeout(() => {
      fetchDashboardData(undefined, true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

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
        return <FileText className="h-4 w-4 text-brand-400" />;
      case "url":
        return <Link2 className="h-4 w-4 text-blue-400" />;
      default:
        return <Upload className="h-4 w-4 text-purple-400" />;
    }
  };

  const getRetrievalStatusBadge = (status: string) => {
    switch (status) {
      case "indexed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
            Sẵn sàng
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/40 border border-blue-500/20 text-blue-400 animate-pulse">
            <Clock className="h-3 w-3" /> Đang chỉ mục
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Chất lượng thấp
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
            <XCircle className="h-3 w-3" /> Lỗi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-2">
            Chưa rõ
          </span>
        );
    }
  };

  const getJobStatusLabel = (status: string) => {
    switch (status) {
      case "queued":
        return "Đang chờ xử lý";
      case "processing":
        return "Đang phân tích";
      case "wiki_ready":
        return "Đã hoàn thành";
      case "failed":
        return "Thất bại";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Đang chạy";
    }
  };

  const getJobStageTranslation = (stage: string) => {
    switch (stage) {
      case "queued":
        return "Xếp hàng đợi";
      case "validating":
        return "Xác thực dữ liệu";
      case "fetching_or_uploading":
        return "Tải nội dung nguồn";
      case "extracting":
        return "Trích xuất văn bản";
      case "normalizing":
        return "Chuẩn hóa dữ liệu";
      case "chunking":
        return "Phân mảnh văn bản";
      case "summarizing":
        return "Tóm tắt thông tin";
      case "indexing":
        return "Lập chỉ mục vector";
      case "wiki_ready":
        return "Hoàn tất Wiki item";
      case "failed":
        return "Xử lý lỗi";
      case "cancelled":
        return "Đã hủy bỏ";
      default:
        return "Đang biên dịch";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-auth-bg text-auth-text">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-auth-accent" />
          <p className="text-sm text-auth-text-2">Đang tải trung tâm điều khiển...</p>
        </div>
      </div>
    );
  }

  // 2. Global Error State (Retryable)
  if (globalErrorMsg && !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-auth-bg text-auth-text px-4">
        <div className="w-full max-w-md bg-auth-surface border border-auth-border rounded-2xl p-6 text-center shadow-auth relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-auth-error" />
          <div className="w-12 h-12 rounded-full bg-auth-error-dim text-auth-error flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-auth-text">Không thể kết nối dữ liệu</h2>
          <p className="text-sm text-auth-text-2 mt-2 leading-relaxed">{globalErrorMsg}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => fetchDashboardData(selectedRoleKbId || undefined, true)}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Thử lại
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={handleLogout}
            >
              Đăng xuất
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
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/75 backdrop-blur-2xl">
        <div className="container-responsive flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                Dashboard
              </Link>
              <Link
                href={stats.totalItems > 0 ? "/query" : "#"}
                onClick={(e) => {
                  if (stats.totalItems === 0) e.preventDefault();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  stats.totalItems > 0
                    ? "text-[#a1a1aa] hover:text-white"
                    : "text-[#52525b] cursor-not-allowed"
                }`}
              >
                Hỏi đáp AI
              </Link>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#a1a1aa] hover:text-white transition-colors"
              >
                Wiki Cá nhân
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Greeting & Plan */}
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-white">
                {userCtx.displayName || userCtx.email}
              </div>
              <span className="inline-flex mt-0.5 items-center gap-1 rounded-full border border-auth-border bg-auth-elevated px-2 py-0.2 text-[10px] font-semibold text-auth-text-2">
                {planName}
              </span>
            </div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              isLoading={isPending}
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ────────────────── Main Content Area ────────────────── */}
      <main className="container-responsive flex-grow py-8 relative z-10 flex flex-col gap-6">
        {isChangingRole && (
          <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
              <p className="text-sm text-[#a1a1aa]">Đang đồng bộ vai trò chuyên môn...</p>
            </div>
          </div>
        )}

        {/* Non-blocking API warning banner */}
        {apiWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300 animate-fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="flex-1">{apiWarning}</span>
            <button
              onClick={() => { setApiWarning(null); fetchDashboardData(selectedRoleKbId || undefined, true); }}
              className="ml-2 shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              Thử lại
            </button>
            <button onClick={() => setApiWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors cursor-pointer">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Welcome & Role context Switcher row */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-[#111113]/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500/40 to-transparent" />
          <div>
            <h1 className="text-fluid-lg font-extrabold tracking-tight">
              Xin chào, {userCtx.displayName || "Bạn"} 👋
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Hệ thống đã sẵn sàng hỗ trợ nghiên cứu và tích lũy tri thức công việc.
            </p>
          </div>

          {/* Role selection dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
              Knowledge Base Chuyên Ngành
            </label>
            {userCtx.plan === "pro" && userRoles.length > 1 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setKbDropdownOpen(!kbDropdownOpen);
                  }}
                  className="w-full bg-[#18181b] border border-[#27272a] hover:border-auth-accent/40 text-xs text-[#fafafa] font-semibold rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all duration-300"
                >
                  <span>
                    {userRoles.find((r) => r.id === selectedRoleKbId)?.roleName || "Chọn Chuyên Ngành"}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-[#52525b] transition-transform duration-300 ${kbDropdownOpen ? "-rotate-90" : "rotate-90"}`} />
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
                <span>{roleCtx?.roleName || "Chưa xác định"}</span>
                <span className="text-[10px] text-[#52525b] font-normal">
                  ({roleCtx?.roleGroup || "Khác"})
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Active Ingesting Jobs Section */}
        {activeJobs.length > 0 && (
          <section className="bg-[#111113]/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden flex flex-col gap-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase text-[#52525b]">Tiến trình nạp kiến thức</h2>
                <p className="text-xs text-[#a1a1aa] mt-1">Các tài liệu đang được phân tích sang Wiki dạng cấu trúc.</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Đang cập nhật...
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
                        {job.title || "Tài liệu nạp..."}
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
                      {job.message || `${job.progress || 0}% hoàn thành`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Chart Section */}
        <section className="hero-section">
          <ActivityChart />
        </section>

        {/* Quota Panel (Account Limits) */}
        {quota && (
          <section className="bg-[#111113]/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-transparent" />
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-[#52525b]">Giới hạn tài khoản</h2>
              <p className="text-xs text-[#a1a1aa] mt-1">Hạn mức tài nguyên theo gói {planName}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {/* 1. Storage Quota */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#a1a1aa]">Dung lượng lưu trữ</span>
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
                <span className="text-[9px] text-[#52525b]">Gói hỗ trợ biên soạn tài liệu</span>
               </div>

               {/* 2. Queries Quota */}
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between text-xs">
                   <span className="font-semibold text-[#a1a1aa]">Lượt hỏi AI hàng ngày</span>
                   <span className="text-[10px] text-[#52525b] font-mono">
                     {quota.queries.used} / {quota.queries.limit} lượt
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
                   Tự động làm mới hàng ngày
                 </span>
               </div>

               {/* 3. Compiles Quota */}
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between text-xs">
                   <span className="font-semibold text-[#a1a1aa]">Hạn mức biên dịch tháng</span>
                   <span className="text-[10px] text-[#52525b] font-mono">
                     {quota.compiles.used} / {quota.compiles.limit} nguồn
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
                <span className="text-[9px] text-[#52525b]">Làm mới vào đầu tháng tiếp theo</span>
              </div>
            </div>
          </section>
        )}

        {/* Recently Viewed Strip */}
        <div className="recent-strip">
          <div className="recent-strip-label flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recently Viewed
          </div>
          <div className="recent-strip-items flex flex-wrap gap-2">
            {(summary?.recentItems && summary.recentItems.length > 0
              ? summary.recentItems.slice(0, 6).map((item) => ({
                  id: item.id,
                  name: item.title,
                  icon: getDomainIcon(item.domain?.name || "")
                }))
              : DEFAULT_RECENT_ITEMS
            ).map((item) => {
              const dest = item.id ? `/wiki/items/${item.id}` : "/wiki";
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
                  <div className="card-label-title">Domain Knowledge</div>
                  <Link className="view-more" href="/wiki">
                    Xem tất cả {summary?.domainSnapshot?.length || 0} domains{" "}
                    <ArrowRight className="h-3 w-3" />
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
                        href={`/wiki?domainId=${dom.id}`}
                        className="domain-kcard"
                        role="button"
                        tabIndex={0}
                        aria-label={`${dom.name} — ${dom.itemCount} items`}
                      >
                        <div className="dk-icon-box bg-auth-accent-dim text-auth-accent border border-auth-accent/20">
                          {getIconComponent(iconName)}
                        </div>
                        <div className="dk-name">{dom.name}</div>
                        <div className="dk-count">{dom.itemCount} items</div>
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
                  <div className="card-label-title">Tech Stack Knowledge</div>
                  <Link className="view-more" href="/wiki">
                    Xem tất cả 12 công nghệ{" "}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="relative">
                  <span className="tech-sort-label">Sắp xếp</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortDropdownOpen(!sortDropdownOpen);
                    }}
                    className="tech-sort-select text-left"
                    style={{ minWidth: "110px" }}
                  >
                    {sortBy === "name" && "Tên"}
                    {sortBy === "domain" && "Lĩnh vực"}
                    {sortBy === "pct" && "Độ thành thạo"}
                    {sortBy === "updated" && "Mới nhất"}
                  </button>

                  {sortDropdownOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1.5 w-[140px] z-50 glass-premium rounded-xl overflow-hidden py-1.5 shadow-2xl animate-dropdown-enter"
                    >
                      {[
                        { value: "name", label: "Tên" },
                        { value: "domain", label: "Lĩnh vực" },
                        { value: "pct", label: "Độ thành thạo" },
                        { value: "updated", label: "Mới nhất" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setSortBy(item.value as any);
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
                      <th>Công nghệ</th>
                      <th>Phân loại</th>
                      <th>Độ thành thạo</th>
                      <th style={{ textAlign: "right", paddingRight: "24px" }}>Tài liệu</th>
                      <th>Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTechs.map((t) => {
                      const dest = t.wikiId ? `/wiki/items/${t.wikiId}` : "/wiki";
                      return (
                        <tr
                          key={t.name}
                          onClick={() => router.push(dest)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="tech-name font-bold text-white text-xs py-1">
                              {t.name}
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#18181b] border border-[#27272a] text-[#a1a1aa]">
                              {t.cat}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="tech-bar h-1 w-20 bg-[#1c1c1f] rounded-full overflow-hidden">
                                <div
                                  className="tech-bar-fill h-full bg-[var(--color-auth-accent)] rounded-full"
                                  style={{
                                    width: `${t.pct}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-auth-text-3 font-semibold font-mono">{t.pct}%</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-2)" }}>{t.items}</td>
                          <td style={{ fontSize: "12px", color: "var(--text-2)" }}>{t.updated}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (40%): Role Panels (Toolkit, Workflow, Skills) */}
          <div className="content-right" style={{ height: "730px" }}>
            
            {/* BA Toolkit Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">Toolkit</div>
                  <Link className="view-more" href="/wiki">
                    Xem thêm <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="role-panel-body">
                  {TOOLKIT_ITEMS.map((item) => (
                    <Link
                      key={item.id}
                      href={`/wiki/items/${item.id}`}
                      className="group/item flex items-center justify-between py-2 border-b border-[#27272a]/40 text-xs text-auth-text-2 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-auth-text-3 opacity-0 transform -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ITBA Workflow Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">Workflow</div>
                  <Link className="view-more" href="/wiki">
                    Xem thêm <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="rp-empty" style={{ flex: 1 }}>
                  <div className="rp-empty-label" style={{ fontSize: "13px", lineHeight: "1.7", marginBottom: "12px" }}>
                    Chưa có quy trình công việc nào.<br />Yêu cầu AI thiết kế quy trình ngay.
                  </div>
                  <Link
                    href={`/query?prompt=${encodeURIComponent(
                      "Help me document my ITBA Workflow. I want to create a structured knowledge entry covering the 3 core ITBA phases: Research Phase, Design & Validate Phase, and Spec & Handoff Protocol. Please provide a step-by-step workflow with inputs, outputs, and gate conditions for each phase."
                    )}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-auth-accent text-white hover:bg-auth-accent-dark transition-all active:scale-[0.98] shadow-[0_0_15px_var(--color-auth-accent-glow)]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Vẽ quy trình AI
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Skills Panel */}
            <div className="section-block">
              <div className="card-label">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="card-label-title">Skills</div>
                  <Link className="view-more" href="/wiki">
                    Xem thêm <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="role-panel">
                <div className="role-panel-body">
                  {SKILLS_ITEMS.map((item) => (
                    <Link
                      key={item.id}
                      href={`/wiki/items/${item.id}`}
                      className="group/item flex items-center justify-between py-2 border-b border-[#27272a]/40 text-xs text-auth-text-2 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-auth-text-3 opacity-0 transform -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200" />
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
        href={`/compile/new?roleKbId=${selectedRoleKbId}`}
        className="fab-compile group"
        title="Compile new knowledge"
      >
        <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
        <span>Compile</span>
      </Link>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#09090b] py-6 text-center text-xs text-[#52525b] z-10">
        <div className="container-responsive">
          <p>© 2026 Pulse Knowledge. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
