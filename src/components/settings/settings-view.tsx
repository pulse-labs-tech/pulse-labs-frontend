"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { Button } from "@/components/ui/button";
import { QuotaCard } from "./quota-card";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { logoutAction } from "@/app/actions/auth";
import {
  getSettingsOverviewAction,
  recordUpgradeIntentAction,
} from "@/lib/client-api";
import type {
  SettingsOverviewData,
  QuotaCardData,
  UpgradeIntentStatus,
  SettingsErrorCode,
} from "@/types/settings";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import Loading from "@/app/[locale]/loading";

interface SettingsViewProps {
  initialSection?: "plan" | "upgrade" | "quota";
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  EMAIL_NOT_VERIFIED: "Vui lòng xác thực email để tiếp tục.",
  ONBOARDING_REQUIRED: "Hoàn tất onboarding để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  QUOTA_UNAVAILABLE: "Chưa tải được hạn mức. Thử lại sau.",
  SETTINGS_SECTION_UNAVAILABLE: "Một phần Settings chưa tải được.",
  UPGRADE_INTENT_FAILED: "Chưa thể ghi nhận yêu cầu nâng cấp. Thử lại sau.",
  LOGOUT_FAILED: "Chưa thể đăng xuất. Thử lại sau.",
  RATE_LIMITED: "Thao tác quá nhanh. Vui lòng thử lại sau.",
  SERVER_ERROR: "Có lỗi xảy ra. Thử lại sau.",
  NETWORK_ERROR: "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.",
};

export function SettingsView({ initialSection }: SettingsViewProps) {
  const router = useRouter();
  const { user: authUser, clearAuth } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [overview, setOverview] = useState<SettingsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeIntentStatus | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isRefreshingQuota, setIsRefreshingQuota] = useState(false);

  const handleError = useCallback(
    (code: string) => {
      if (code === "UNAUTHORIZED") {
        clearAuth();
        router.push(`/${locale}/login`);
        return;
      }
      if (code === "ONBOARDING_REQUIRED") {
        router.push(`/${locale}/dashboard`);
        return;
      }
      setGlobalError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_ERROR);
    },
    [clearAuth, router, locale]
  );

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const res = await getSettingsOverviewAction();
      console.log("🟢 [F12 API RESPONSE] getSettingsOverviewAction:", res);
      if (res.status === "1" && res.data) {
        setOverview(res.data);
        if (res.data.upgradeIntent?.status && res.data.upgradeIntent.status !== "none") {
          setUpgradeStatus(res.data.upgradeIntent.status);
        }
      } else {
        const code = res.error_code as SettingsErrorCode;
        if (["UNAUTHORIZED", "EMAIL_NOT_VERIFIED", "ONBOARDING_REQUIRED"].includes(code)) {
          handleError(code);
        } else {
          setGlobalError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_ERROR);
        }
      }
    } catch {
      setGlobalError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Scroll to initial section on load
  useEffect(() => {
    if (!isLoading && initialSection) {
      const el = document.getElementById(`settings-section-${initialSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [isLoading, initialSection]);

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await recordUpgradeIntentAction({
        targetPlan: "pro",
        source: "settings_page",
      });
      console.log("🟢 [F12 API RESPONSE] recordUpgradeIntentAction (settings):", res);
      if (res.status === "1" && res.data?.intent) {
        setUpgradeStatus(res.data.intent.status);
        // Reload overview to reflect intent in plan card
        await loadOverview();
      } else {
        setUpgradeError(ERROR_MESSAGES[res.error_code] ?? ERROR_MESSAGES.UPGRADE_INTENT_FAILED);
      }
    } catch {
      setUpgradeError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    startTransition(async () => {
      try {
        clearAuth();
        await logoutAction();
      } catch {
        setLogoutError(ERROR_MESSAGES.LOGOUT_FAILED);
        setIsLoggingOut(false);
      }
    });
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return <Loading />;
  }

  // ─── Global error (no data) ─────────────────────────────────────
  if (globalError && !overview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-auth-bg px-4 gap-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center shadow-auth relative premium-hover-card-red">
          <div className="w-12 h-12 rounded-full bg-auth-error-dim text-auth-error flex items-center justify-center mx-auto mb-4">
            <LineIcon name="warning" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {t("settings.errors.loadFailed", "Không tải được Settings")}
          </h2>
          <p className="text-sm text-auth-text-2 mt-2 leading-relaxed">{globalError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={loadOverview}
              leftIcon={<LineIcon name="sync" className="h-4 w-4" />}
            >
              {t("common.retry", "Thử lại")}
            </Button>
            <Link href={`/${locale}/dashboard`} className="block">
              <Button variant="ghost" size="lg" fullWidth leftIcon={<LineIcon name="arrow-left" className="h-4 w-4" />}>
                {t("common.backToDashboard", "Về Dashboard")}
              </Button>
            </Link>
            <Button variant="ghost" size="lg" fullWidth onClick={handleLogout}
              className="text-auth-text-3 hover:text-red-400 text-xs"
            >
              {t("common.logout", "Đăng xuất")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user: userCtx, currentPlan, plans, quotas, upgradeIntent } = overview!;
  const isPro = userCtx.plan === "pro";
  const hasUpgradeIntent =
    upgradeStatus === "recorded" ||
    upgradeStatus === "checkout_pending" ||
    (upgradeIntent?.status && upgradeIntent.status !== "none" && upgradeIntent.status !== "failed");

  const proPlan = plans?.find((p) => p.code === "pro");
  const freePlan = plans?.find((p) => p.code === "free") ?? currentPlan;

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
        <div className="container-focused flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard`} className="text-auth-text-2 hover:text-white transition-colors text-sm">
              ← {t("common.dashboard", "Dashboard")}
            </Link>
            <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3" />
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <LineIcon name="gear" className="h-3.5 w-3.5 text-auth-accent" />
              {t("settings.title", "Cài đặt")}
            </span>
          </div>
          <LocaleSwitcher id="settings-header" />
        </div>
      </header>

      <main className="container-focused py-8 space-y-6 relative z-10" id="main-content">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("settings.title", "Cài đặt")}
          </h1>
          <p className="text-sm text-auth-text-2 mt-1">
            {t("settings.subtitle", "Quản lý tài khoản, gói dịch vụ và hạn mức sử dụng.")}
          </p>
        </div>

        {/* Non-critical warning if overview has section errors */}
        {overview?.sectionErrors && overview.sectionErrors.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
            <LineIcon name="warning" className="h-4 w-4 shrink-0" />
            <span>{t("settings.errors.partialLoad", "Một số phần Settings chưa tải được. Thông tin còn lại vẫn hiển thị đầy đủ.")}</span>
            <button
              onClick={loadOverview}
              className="ml-auto shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              {t("common.retry", "Thử lại")}
            </button>
          </div>
        )}

        {/* ─── Account + Plan row ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account summary */}
          <section
            className="flex flex-col gap-4 rounded-2xl p-5 relative premium-hover-card"
            aria-labelledby="settings-account-heading"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                <LineIcon name="user" className="h-3.5 w-3.5 text-auth-accent" />
              </div>
              <h2 id="settings-account-heading" className="text-sm font-bold text-white">
                {t("settings.account.title", "Tài khoản")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {/* Display name / email */}
              <div>
                <p className="text-base font-bold text-white">
                  {userCtx.displayName || userCtx.email}
                </p>
                {userCtx.displayName && (
                  <p className="text-xs text-auth-text-2">{userCtx.email}</p>
                )}
              </div>

              {/* Plan badge */}
              <div className="flex items-center gap-2">
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300">
                    <LineIcon name="crown" className="h-3 w-3" />
                    Pro Plan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-2">
                    Free Plan
                  </span>
                )}

                {/* Email verified indicator */}
                {userCtx.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
                    <LineIcon name="checkmark-circle" className="h-3 w-3" />
                    {t("settings.account.verified", "Đã xác thực")}
                  </span>
                )}
              </div>

              {/* Primary Role KB */}
              {userCtx.primaryRoleName && (
                <p className="text-xs text-auth-text-2">
                  <span className="text-auth-text-3">{t("settings.account.primaryRole", "Role KB:")} </span>
                  {userCtx.primaryRoleName}
                </p>
              )}
            </div>
          </section>

          {/* Current plan card */}
          <section
            id="settings-section-plan"
            className={`flex flex-col gap-4 rounded-2xl p-5 relative ${
              isPro ? "premium-hover-card-amber" : "premium-hover-card"
            }`}
            style={{
              borderColor: isPro ? "rgba(245, 158, 11, 0.3)" : undefined,
            }}
            aria-labelledby="settings-plan-heading"
          >

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPro ? "bg-amber-500/20" : "bg-auth-accent-dim"}`}>
                  {isPro ? <LineIcon name="crown" className="h-3.5 w-3.5 text-amber-400" /> : <LineIcon name="shield" className="h-3.5 w-3.5 text-auth-accent" />}
                </div>
                <h2 id="settings-plan-heading" className="text-sm font-bold text-white">
                  {t("settings.plan.title", "Gói dịch vụ hiện tại")}
                </h2>
              </div>
              {isPro ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
                  FREE
                </span>
              )}
            </div>

            <div>
              <p className="text-xl font-extrabold text-white">
                {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              {!isPro && hasUpgradeIntent && (
                <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5">
                  <LineIcon name="checkmark-circle" className="h-3 w-3" />
                  {t("settings.plan.upgradeIntentRecorded", "Đã ghi nhận yêu cầu nâng cấp. Gói hiện tại vẫn là Free.")}
                </p>
              )}
              {!isPro && !hasUpgradeIntent && (
                <p className="text-xs text-auth-text-2 mt-1">
                  {t("settings.plan.freeDesc", "1 Role KB · 500 MB · 20 compiles/tháng · 30 câu hỏi/ngày")}
                </p>
              )}
              {isPro && (
                <p className="text-xs text-auth-text-2 mt-1">
                  {t("settings.plan.proDesc", "5 Role KB · 10 GB · Unlimited compiles · Unlimited queries")}
                </p>
              )}
            </div>

            {/* Upgrade CTA for free users */}
            {!isPro && (
              <div className="space-y-2 mt-auto">
                {upgradeError && (
                  <p className="text-xs text-red-300">{upgradeError}</p>
                )}
                {hasUpgradeIntent ? (
                  <Link href={`/${locale}/settings/plan/upgrade`}>
                    <Button variant="ghost" size="sm" fullWidth rightIcon={<LineIcon name="arrow-right" className="h-3.5 w-3.5" />}>
                      {t("settings.plan.viewUpgrade", "Xem trạng thái nâng cấp")}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={handleUpgrade}
                    isLoading={isUpgrading}
                    leftIcon={<LineIcon name="bolt" className="h-3.5 w-3.5" />}
                  >
                    {t("settings.plan.upgradeCta", "Nâng cấp lên Pro")}
                  </Button>
                )}
              </div>
            )}

            {isPro && (
              <p className="text-xs text-auth-text-3 mt-auto">
                {t("settings.plan.proCurrentNote", "Bạn đang sử dụng gói Pro.")}
              </p>
            )}
          </section>
        </div>

        {/* ─── Plan comparison ─── */}
        {!isPro && proPlan && (
          <section
            id="settings-section-upgrade"
            className="rounded-2xl p-6 relative premium-hover-card"
            aria-labelledby="settings-compare-heading"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                <LineIcon name="star" className="h-3.5 w-3.5 text-auth-accent" />
              </div>
              <h2 id="settings-compare-heading" className="text-sm font-bold text-white uppercase tracking-wider">
                {t("settings.compare.title", "So sánh gói dịch vụ")}
              </h2>
            </div>

            <div className="plan-cards-container">
              {/* Free Plan Card */}
              <div className="plan-card-premium active-tier">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="plan-card-title">Free Plan</h3>
                    <p className="text-[10px] text-auth-accent font-semibold uppercase tracking-wider mt-0.5">
                      {locale === "vi" ? "Gói hiện tại" : "Current Plan"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-auth-text-3">
                    FREE
                  </span>
                </div>
                <div className="plan-card-price">
                  $0<span>/tháng</span>
                </div>
                <p className="plan-card-desc text-xs text-auth-text-2">
                  {locale === "vi"
                    ? "Công cụ cơ bản để bắt đầu xây dựng cơ sở tri thức của bạn"
                    : "Essential tools to start building your knowledge base"}
                </p>
                <div className="plan-card-divider" />
                <div className="plan-feature-list">
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>1 Role KB</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>500 MB storage</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>20 compiles / tháng</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>30 queries / ngày</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>3 domains max</span>
                  </div>
                  <div className="plan-feature-item excluded">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0" />
                    <span>Multi-role profiles</span>
                  </div>
                  <div className="plan-feature-item excluded">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0" />
                    <span>Auto-Heal features</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-2 bg-white/5 text-auth-text-3 font-semibold rounded-lg text-xs cursor-not-allowed border border-white/[0.04]"
                >
                  {locale === "vi" ? "Gói hiện tại" : "Current Plan"}
                </button>
              </div>

              {/* Pro Plan Card */}
              <div className="plan-card-premium pro-tier">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="plan-card-title text-auth-purple">Pro Plan</h3>
                    <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-0.5">
                      {locale === "vi" ? "Khuyên dùng" : "Recommended"}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    PRO
                  </span>
                </div>
                <div className="plan-card-price">
                  $19<span>/tháng</span>
                </div>
                <p className="plan-card-desc text-xs text-auth-text-2">
                  {locale === "vi"
                    ? "~450.000 VNĐ/tháng · Dành cho cá nhân và nhóm chuyên nghiệp"
                    : "For professionals and growing teams needing custom workflows"}
                </p>
                <div className="plan-card-divider" />
                <div className="plan-feature-list">
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span><strong>5</strong> Role KBs</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span><strong>10 GB</strong> storage</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited compiles</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited queries</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited domains</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Multi-role profiles</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Auto-Heal enabled</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleUpgrade}
                  isLoading={isUpgrading}
                  leftIcon={<LineIcon name="bolt" className="h-3.5 w-3.5" />}
                >
                  {hasUpgradeIntent
                    ? (locale === "vi" ? "Đã ghi nhận yêu cầu" : "Recorded interest")
                    : (locale === "vi" ? "Nâng cấp lên Pro" : "Upgrade to Pro")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ─── Quota cards ─── */}
        <section
          id="settings-section-quota"
          aria-labelledby="settings-quota-heading"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 id="settings-quota-heading" className="text-sm font-bold text-white">
              {t("settings.quota.title", "Hạn mức sử dụng")}
            </h2>
            <button
              onClick={loadOverview}
              disabled={isLoading || isRefreshingQuota}
              className="flex items-center gap-1.5 text-xs text-auth-text-2 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <LineIcon name="sync" className={`h-3.5 w-3.5 ${isRefreshingQuota ? "animate-spin" : ""}`} />
              {t("common.retry", "Làm mới")}
            </button>
          </div>

          {quotas && quotas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quotas.map((quota) => (
                <QuotaCard
                  key={quota.key}
                  quota={quota}
                  onRetry={quota.status === "unavailable" ? loadOverview : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-auth-text-3 text-center py-8 rounded-xl border border-auth-border bg-auth-surface">
              {t("settings.quota.noData", "Chưa tải được dữ liệu hạn mức.")}
            </div>
          )}
        </section>

        {/* ─── Logout section ─── */}
        <section
          className="rounded-2xl border border-auth-border bg-auth-surface p-5"
          aria-labelledby="settings-logout-heading"
        >
          <h2 id="settings-logout-heading" className="text-sm font-bold text-white mb-3">
            {t("settings.logout.title", "Phiên đăng nhập")}
          </h2>
          <p className="text-xs text-auth-text-2 mb-4">
            {t("settings.logout.desc", "Đăng xuất khỏi tài khoản trên thiết bị này. Dữ liệu của bạn sẽ được bảo toàn.")}
          </p>
          {logoutError && (
            <p className="text-xs text-red-300 mb-3">{logoutError}</p>
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={handleLogout}
            isLoading={isLoggingOut || isPending}
            leftIcon={<LineIcon name="exit" className="h-4 w-4" />}
            className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-400/30 hover:bg-red-950/20"
          >
            {t("common.logout", "Đăng xuất")}
          </Button>
        </section>
      </main>
    </div>
  );
}
