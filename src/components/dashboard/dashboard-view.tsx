"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
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
        return <FileText className="h-4 w-4 text-emerald-400" />;
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Sẵn sàng
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
            <button
              onClick={() => fetchDashboardData(selectedRoleKbId || undefined, true)}
              className="w-full py-2.5 bg-auth-accent hover:bg-auth-accent-dark text-black font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Thử lại
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-auth-text-2 hover:text-white rounded-lg text-sm transition-all"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user: userCtx, role: roleCtx, stats } = summary!;
  const planName = userCtx.plan === "pro" ? "Pro Plan" : "Free Plan";

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-hidden flex flex-col">
      {/* Glow Effects */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-[100px] top-[10%] h-[400px] w-[400px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.75 0.19 160 / 0.05) 0%, transparent 70%)" }} aria-hidden="true" />

      {/* ────────────────── Header / Navigation ────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-auth-bg/75 backdrop-blur-2xl">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link
                href={stats.totalItems > 0 ? "/query" : "#"}
                onClick={(e) => {
                  if (stats.totalItems === 0) e.preventDefault();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  stats.totalItems > 0
                    ? "text-auth-text-2 hover:text-white"
                    : "text-auth-text-3 cursor-not-allowed"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Hỏi đáp AI
              </Link>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-auth-text-2 hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" /> Wiki Cá nhân
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Greeting & Plan */}
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-auth-text">
                {userCtx.displayName || userCtx.email}
              </div>
              <span className="inline-flex mt-0.5 items-center gap-1 rounded-full border border-auth-accent/20 bg-auth-accent-dim px-2 py-0.2 text-[10px] font-semibold text-auth-accent">
                {planName}
              </span>
            </div>

            {/* Logout button */}
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

      {/* ────────────────── Main Content Area ────────────────── */}
      <main className="container-responsive flex-grow py-8 relative z-10 flex flex-col gap-6">
        {isChangingRole && (
          <div className="absolute inset-0 bg-auth-bg/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-auth-accent" />
              <p className="text-sm text-auth-text-2">Đang đồng bộ vai trò chuyên môn...</p>
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
              className="ml-2 shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              Thử lại
            </button>
            <button onClick={() => setApiWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Welcome & Role context Switcher row */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent/40 to-transparent" />
          <div>
            <h1 className="text-fluid-lg font-extrabold tracking-tight">
              Xin chào, {userCtx.displayName || "Bạn"} 👋
            </h1>
            <p className="text-xs text-auth-text-2 mt-1">
              Hệ thống đã sẵn sàng hỗ trợ nghiên cứu và tích lũy tri thức công việc.
            </p>
          </div>

          {/* Role selection dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[10px] font-bold text-auth-text-3 uppercase tracking-wider">
              Knowledge Base Chuyên Ngành
            </label>
            {userCtx.plan === "pro" && userRoles.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedRoleKbId}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-auth-elevated border border-auth-border text-xs text-auth-text font-semibold rounded-lg px-3 py-2 cursor-pointer focus:border-auth-accent transition-all appearance-none"
                >
                  {userRoles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-auth-surface text-auth-text">
                      {r.roleName} ({r.roleGroup})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-auth-text-3">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            ) : (
              <div className="bg-auth-elevated border border-auth-border rounded-lg px-3 py-2 text-xs font-semibold text-auth-accent flex items-center gap-2">
                <Compass className="h-4 w-4 shrink-0 text-auth-accent" />
                <span>{roleCtx?.roleName || "Chưa xác định"}</span>
                <span className="text-[10px] text-auth-text-3 font-normal">
                  ({roleCtx?.roleGroup || "Khác"})
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Stats widgets */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 hover-lift">
            <div className="h-10 w-10 rounded-xl bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">Tổng concepts</p>
              <h3 className="text-xl font-bold mt-0.5">{stats.totalItems}</h3>
              <p className="text-[10px] text-auth-text-2 mt-0.5">Wiki items được lưu trữ</p>
            </div>
          </div>

          <div className="bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 hover-lift">
            <div className="h-10 w-10 rounded-xl bg-auth-purple-dim text-auth-purple flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">Lĩnh vực hoạt động</p>
              <h3 className="text-xl font-bold mt-0.5">{stats.activeDomains}</h3>
              <p className="text-[10px] text-auth-text-2 mt-0.5">Phân loại domain kiến thức</p>
            </div>
          </div>

          <div className="bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 hover-lift">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              stats.processingJobs > 0 ? "bg-auth-cyan-dim text-auth-cyan animate-pulse" : "bg-auth-elevated text-auth-text-3"
            }`}>
              <RefreshCw className={`h-5 w-5 ${stats.processingJobs > 0 ? "animate-spin" : ""}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">Đang biên dịch</p>
              <h3 className="text-xl font-bold mt-0.5">{stats.processingJobs}</h3>
              <p className="text-[10px] text-auth-text-2 mt-0.5">Tiến trình nạp văn bản</p>
            </div>
          </div>

          <div className="bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4 hover-lift">
            <div className="h-10 w-10 rounded-xl bg-auth-orange-dim text-auth-orange flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3">Lượt hỏi AI hôm nay</p>
              <h3 className="text-xl font-bold mt-0.5">{stats.queriesUsedToday} <span className="text-xs text-auth-text-3 font-normal">/ {stats.queriesLimitToday}</span></h3>
              <p className="text-[10px] text-auth-text-2 mt-0.5">Hạn mức hỏi đáp hàng ngày</p>
            </div>
          </div>
        </section>

        {/* Main core loop actions area */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions Panel */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent to-transparent" />
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Thao tác nhanh</h2>
              <p className="text-xs text-auth-text-2 mt-1">Các lối tắt chính vận hành vòng lặp kiến thức.</p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Compile source CTA */}
              <Link
                href={`/compile/new?roleKbId=${selectedRoleKbId}`}
                className="group w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] transition-all flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    Nạp nguồn tài liệu
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-[10px] text-white/80 mt-0.5">Trích xuất văn bản, website, URL thành Wiki</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Upload className="h-4 w-4" />
                </div>
              </Link>

              {/* Ask AI CTA - Soft gated if empty */}
              <Link
                href={stats.totalItems > 0 ? `/query?roleKbId=${selectedRoleKbId}` : "#"}
                onClick={(e) => {
                  if (stats.totalItems === 0 && activeJobs.length === 0) {
                    e.preventDefault();
                  }
                }}
                className={`group w-full rounded-xl p-4 border transition-all flex items-center justify-between ${
                  stats.totalItems > 0
                    ? "bg-auth-elevated border-auth-border hover:border-auth-accent/40"
                    : "bg-auth-elevated/40 border-auth-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-auth-text flex items-center gap-1.5">
                    Hỏi đáp AI có nguồn
                    {stats.totalItems === 0 && <Lock className="h-3 w-3 text-auth-text-3" />}
                  </div>
                  <p className="text-[10px] text-auth-text-2 mt-0.5">
                    {stats.totalItems > 0
                      ? "Đặt câu hỏi trích dẫn minh bạch từ KB"
                      : "Cần nạp ít nhất 1 tài liệu để mở khóa"}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </Link>

              {/* Open Wiki CTA */}
              <Link
                href={`/wiki?roleKbId=${selectedRoleKbId}`}
                className="group w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-4 transition-all flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-auth-text">Xem thư viện Wiki</div>
                  <p className="text-[10px] text-auth-text-2 mt-0.5">Tra cứu toàn bộ concepts, tags, domains</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/5 text-auth-text-2 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>

          {/* Active Ingesting Jobs Section */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 lg:col-span-2 relative overflow-hidden flex flex-col justify-between gap-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-cyan to-transparent" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Tiến trình nạp kiến thức</h2>
                <p className="text-xs text-auth-text-2 mt-1">Các tài liệu đang được phân tích sang Wiki dạng cấu trúc.</p>
              </div>
              {activeJobs.some((j) => !j.isTerminal) && (
                <span className="flex items-center gap-1.5 text-xs text-auth-accent font-semibold animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang cập nhật...
                </span>
              )}
            </div>

            <div className="flex-grow flex flex-col gap-3 justify-center min-h-[140px]">
              {activeJobs.length === 0 ? (
                <div className="text-center py-6 text-auth-text-3 text-xs">
                  Không có tiến trình nào đang chạy. Hãy nạp nguồn tài liệu mới để bắt đầu.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-auth-elevated/60 border border-auth-border/50 rounded-xl p-3.5 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getSourceTypeIcon(job.sourceType)}
                          <span className="text-xs font-bold text-auth-text truncate">
                            {job.title || "Tài liệu nạp..."}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          job.status === "failed"
                            ? "bg-red-950/40 border border-red-500/20 text-red-400"
                            : job.status === "wiki_ready"
                              ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400"
                              : "bg-auth-accent-dim border border-auth-accent/20 text-auth-accent"
                        }`}>
                          {getJobStatusLabel(job.status)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-auth-bg h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            job.status === "failed"
                              ? "bg-auth-error"
                              : job.status === "wiki_ready"
                                ? "bg-auth-accent"
                                : "bg-gradient-to-r from-auth-accent to-auth-cyan"
                          }`}
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-auth-text-2">
                        <span className="font-semibold text-auth-accent">
                          {getJobStageTranslation(job.stage)}
                        </span>
                        <span>
                          {job.message || `${job.progress || 0}% hoàn thành`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent items & Quotas section */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Knowledge Items Card */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between gap-5 relative">
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Tài liệu mới biên soạn</h2>
              <p className="text-xs text-auth-text-2 mt-1">Các concepts kiến thức mới nhất được lưu trữ.</p>
            </div>

            {getSectionError("recentItems") ? (
              <div className="flex-grow flex flex-col items-center justify-center min-h-[220px] text-center p-4 border border-auth-error/20 bg-auth-error-dim/20 rounded-xl">
                <AlertCircle className="h-8 w-8 text-auth-error mb-2" />
                <p className="text-xs text-auth-text-2 font-medium">Lỗi tải dữ liệu tài liệu mới</p>
                <button
                  onClick={() => fetchDashboardData(selectedRoleKbId, false)}
                  className="mt-3 py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-auth-text hover:bg-white/10"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center min-h-[260px]">
                {stats.totalItems === 0 && activeJobs.length === 0 ? (
                  /* Empty state onboarding */
                  <div className="text-center py-10 px-4 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-auth-accent-dim text-auth-accent flex items-center justify-center">
                      <Brain className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-auth-text">Chưa có kiến thức tích lũy</h3>
                      <p className="text-xs text-auth-text-2 mt-1 max-w-sm mx-auto leading-relaxed">
                        Nạp ngay bài viết, website hoặc văn bản đầu tiên. Hệ thống sẽ phân tích thành Wiki concepts để AI hỗ trợ bạn.
                      </p>
                    </div>
                    <Link
                      href={`/compile/new?roleKbId=${selectedRoleKbId}`}
                      className="py-2 px-5 bg-auth-accent hover:bg-auth-accent-dark text-black font-semibold rounded-lg text-xs transition-all shadow-auth hover:shadow-auth-accent-glow flex items-center gap-1"
                    >
                      Nạp tài liệu ngay <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : summary?.recentItems && summary.recentItems.length > 0 ? (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {summary.recentItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/wiki/items/${item.id}`}
                        className="group flex flex-col gap-2 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-auth-text group-hover:text-auth-accent transition-colors truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-auth-text-2 line-clamp-2 mt-1 leading-relaxed">
                              {item.summarySnippet || "Chưa có tóm tắt chi tiết cho concept này."}
                            </p>
                          </div>
                          <span className="shrink-0">{getRetrievalStatusBadge(item.retrievalStatus)}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-auth-text-3 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {item.domain?.name || "Khác"}
                          </span>
                          {item.tags?.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-semibold text-auth-text-2 bg-auth-accent-dim/30 px-1.5 py-0.5 rounded border border-auth-accent/10"
                            >
                              #{t}
                            </span>
                          ))}
                          <span className="text-[9px] text-auth-text-3 ml-auto">
                            {new Date(item.compiledAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-auth-text-3 text-xs">
                    Kiến thức đang nạp chưa hoàn thành. Vui lòng chờ...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quota Panel (Account Limits) */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-purple to-transparent" />
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Giới hạn tài khoản</h2>
              <p className="text-xs text-auth-text-2 mt-1">Hạn mức tài nguyên theo gói {planName}.</p>
            </div>

            {getSectionError("quota") || !quota ? (
              <div className="flex-grow flex flex-col items-center justify-center min-h-[220px] text-center p-4 border border-auth-error/20 bg-auth-error-dim/20 rounded-xl">
                <AlertCircle className="h-8 w-8 text-auth-error mb-2" />
                <p className="text-xs text-auth-text-2 font-medium">Lỗi tải dữ liệu quota</p>
                <button
                  onClick={async () => {
                    const res = await getQuotaAction();
                    if (res.status === "1" && res.data) {
                      setQuota(res.data.quota);
                    }
                  }}
                  className="mt-3 py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-auth-text hover:bg-white/10"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col gap-5 justify-center">
                {/* 1. Storage Quota */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-auth-text-2">Dung lượng lưu trữ</span>
                    <span className="text-[10px] text-auth-text-3 font-mono">
                      {formatBytes(quota.storage.usedBytes)} / {formatBytes(quota.storage.limitBytes)}
                    </span>
                  </div>
                  <div className="w-full bg-auth-bg h-2 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quota.storage.status === "exceeded"
                          ? "bg-auth-error"
                          : quota.storage.status === "warning"
                            ? "bg-amber-400"
                            : "bg-auth-accent"
                      }`}
                      style={{ width: `${quota.storage.percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-auth-text-3">Gói hỗ trợ biên soạn tài liệu</span>
                </div>

                {/* 2. Queries Quota */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-auth-text-2">Lượt hỏi AI hàng ngày</span>
                    <span className="text-[10px] text-auth-text-3 font-mono">
                      {quota.queries.used} / {quota.queries.limit} lượt
                    </span>
                  </div>
                  <div className="w-full bg-auth-bg h-2 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quota.queries.status === "exceeded"
                          ? "bg-auth-error"
                          : quota.queries.status === "warning"
                            ? "bg-amber-400"
                            : "bg-auth-accent"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (quota.queries.used / (quota.queries.limit || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-auth-text-3 font-medium">
                    Tự động làm mới hàng ngày
                  </span>
                </div>

                {/* 3. Compiles Quota */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-auth-text-2">Hạn mức biên dịch tháng</span>
                    <span className="text-[10px] text-auth-text-3 font-mono">
                      {quota.compiles.used} / {quota.compiles.limit} nguồn
                    </span>
                  </div>
                  <div className="w-full bg-auth-bg h-2 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quota.compiles.status === "exceeded"
                          ? "bg-auth-error"
                          : quota.compiles.status === "warning"
                            ? "bg-amber-400"
                            : "bg-auth-accent"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (quota.compiles.used / (quota.compiles.limit || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-auth-text-3">Làm mới vào đầu tháng tiếp theo</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Domain Snapshot & Activity Feed row */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Domain Snapshot card */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between gap-5">
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Phân loại theo Domain</h2>
              <p className="text-xs text-auth-text-2 mt-1">Danh sách nhóm lĩnh vực kiến thức đã nạp.</p>
            </div>

            {getSectionError("domainSnapshot") ? (
              <div className="flex-grow flex flex-col items-center justify-center min-h-[160px] text-center p-4 border border-auth-error/20 bg-auth-error-dim/20 rounded-xl">
                <AlertCircle className="h-8 w-8 text-auth-error mb-2" />
                <p className="text-xs text-auth-text-2 font-medium">Lỗi tải phân loại domain</p>
                <button
                  onClick={() => fetchDashboardData(selectedRoleKbId, false)}
                  className="mt-3 py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-auth-text hover:bg-white/10"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center min-h-[180px]">
                {!summary?.domainSnapshot || summary.domainSnapshot.length === 0 ? (
                  <div className="text-center py-6 text-auth-text-3 text-xs">
                    Chưa phân loại domain nào. Bắt đầu nạp tài liệu để tự động thiết lập nhóm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 max-h-[250px] overflow-y-auto pr-1">
                    {summary.domainSnapshot.map((dom) => (
                      <Link
                        key={dom.id}
                        href={`/wiki?domainId=${dom.id}`}
                        className="group bg-auth-elevated/40 border border-auth-border/50 hover:border-auth-accent/30 rounded-xl p-3.5 flex flex-col gap-2 transition-all hover:bg-auth-elevated/80"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-auth-text group-hover:text-auth-accent transition-colors truncate">
                            {dom.name}
                          </span>
                          <span className="text-[10px] text-auth-text-3 font-semibold bg-white/5 px-2 py-0.5 rounded">
                            {dom.itemCount} concepts
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 text-[9px] text-auth-text-2">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {dom.indexedCount} indexed
                          </span>
                          {dom.pendingCount > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                              {dom.pendingCount} pending
                            </span>
                          )}
                          {dom.degradedCount > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              {dom.degradedCount} degraded
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Feed card */}
          <div className="bg-auth-surface/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-5 relative">
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase text-auth-text-3">Lịch sử hoạt động</h2>
              <p className="text-xs text-auth-text-2 mt-1">Nhật ký hoạt động của KB chuyên ngành.</p>
            </div>

            {getSectionError("activity") ? (
              <div className="flex-grow flex flex-col items-center justify-center min-h-[160px] text-center p-4 border border-auth-error/20 bg-auth-error-dim/20 rounded-xl">
                <AlertCircle className="h-8 w-8 text-auth-error mb-2" />
                <p className="text-xs text-auth-text-2 font-medium">Lỗi tải lịch sử hoạt động</p>
                <button
                  onClick={() => fetchDashboardData(selectedRoleKbId, false)}
                  className="mt-3 py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-auth-text hover:bg-white/10"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center min-h-[180px]">
                {!summary?.activity || summary.activity.length === 0 ? (
                  <div className="text-center py-6 text-auth-text-3 text-xs">
                    Chưa ghi nhận hoạt động nào gần đây.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {summary.activity.map((act) => (
                      <div key={act.id} className="flex gap-3 text-xs items-start">
                        <div className="mt-0.5 bg-auth-accent-dim text-auth-accent rounded-full p-1 shrink-0">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-auth-text text-fluid-xs truncate">
                            {act.title}
                          </p>
                          <p className="text-[10px] text-auth-text-2 mt-0.5 line-clamp-1">
                            {act.description}
                          </p>
                          <span className="text-[9px] text-auth-text-3 mt-1 inline-block">
                            {new Date(act.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-auth-bg py-6 text-center text-xs text-auth-text-3 z-10">
        <div className="container-responsive">
          <p>© 2026 Pulse Knowledge. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
