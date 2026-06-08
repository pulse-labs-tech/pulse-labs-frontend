"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { Button } from "@/components/ui/button";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { recordUpgradeIntentAction } from "@/lib/client-api";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function PricingView() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<"none" | "recorded" | "failed">("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = user?.plan === "pro";
  const hasRecordedIntent = user?.selectedPlanIntent === "pro" || upgradeStatus === "recorded";

  // Price calculations
  const freePrice = "$0";
  const proPriceMonthly = "$19";
  const proPriceAnnual = "$15"; // $19 * 12 * 0.8 = $228/yr ($15.2/mo, rounded down to $15 for display)

  const handleUpgradeAction = async () => {
    if (!isAuthenticated) {
      // Redirect to register with pro intent
      router.push(`/${locale}/register?plan=pro`);
      return;
    }

    if (isPro) return;

    setIsUpgrading(true);
    setErrorMessage(null);

    try {
      const res = await recordUpgradeIntentAction({
        targetPlan: "pro",
        source: "pricing_page",
      });
      console.log("🟢 [F12 API RESPONSE] recordUpgradeIntentAction:", res);

      if (res.status === "1" && res.data?.intent) {
        setUpgradeStatus("recorded");
        router.refresh();
      } else {
        setErrorMessage(
          locale === "vi"
            ? "Chưa thể ghi nhận yêu cầu nâng cấp lúc này. Vui lòng thử lại sau."
            : "Could not record upgrade intent. Please try again later."
        );
      }
    } catch {
      setErrorMessage(
        locale === "vi"
          ? "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại."
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full py-12">
      {/* Background radial glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[10%] bottom-[10%] h-[350px] w-[350px] blur-[100px]"
        style={{ background: "radial-gradient(circle, oklch(0.68 0.18 280 / 0.05) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="container-focused relative z-10 flex flex-col items-center gap-10">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold text-auth-text-2 backdrop-blur-md uppercase tracking-wider">
              <LineIcon name="crown" className="h-3 w-3 text-amber-400" />
              {locale === "vi" ? "Gói dịch vụ linh hoạt" : "Flexible Service Tiers"}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <h1 className="text-[36px] md:text-[48px] font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-auth-text-2 bg-clip-text text-transparent">
              {locale === "vi" ? "Chọn gói dịch vụ của bạn" : "Choose Your Plan"}
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <p className="text-sm md:text-base text-auth-text-2 mt-4 leading-relaxed">
              {locale === "vi"
                ? "Bắt đầu miễn phí hoặc nâng cấp lên gói Pro để mở khoá không giới hạn tài nguyên và tính năng AI nâng cao."
                : "Get started for free or upgrade to Pro to unlock unlimited knowledge storage and advanced AI workflows."}
            </p>
          </ScrollReveal>
        </div>

        {/* Billing cycle toggle */}
        <ScrollReveal direction="up" delay={0.4}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-auth-text-3 uppercase tracking-widest">
              {locale === "vi" ? "Chu kỳ thanh toán" : "Billing Cycle"}
            </span>
            <div className="billing-toggle-wrapper">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`billing-toggle-btn cursor-pointer ${billingCycle === "monthly" ? "active" : ""}`}
              >
                {locale === "vi" ? "Hàng tháng" : "Monthly"}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`billing-toggle-btn cursor-pointer ${billingCycle === "annual" ? "active" : ""}`}
              >
                {locale === "vi" ? "Hàng năm" : "Annual"}
                <span className="save-badge-accent">-20%</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Pricing Cards Container */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          
          {/* FREE PLAN */}
          <ScrollReveal direction="up" delay={0.5} className="flex">
            <div className={`plan-card-premium w-full flex-grow hover-lift ${!isPro ? "active-tier" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="plan-card-title">Free Plan</h3>
                  {!isPro && (
                    <p className="text-[10px] text-auth-accent font-semibold uppercase tracking-wider mt-0.5">
                      {locale === "vi" ? "Gói hiện tại" : "Current Plan"}
                    </p>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-auth-text-3">
                  FREE
                </span>
              </div>
              
              <div className="plan-card-price">
                {freePrice}<span>/tháng</span>
              </div>

              <p className="plan-card-desc">
                {locale === "vi"
                  ? "Tất cả công cụ cơ bản để bắt đầu lập chỉ mục và truy vấn tri thức cá nhân."
                  : "Essential features for cataloging and querying personal files."}
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
                  <span>Auto-Heal feature</span>
                </div>
              </div>

              <button
                disabled
                className="w-full py-3 bg-white/5 text-auth-text-3 font-semibold rounded-xl text-xs cursor-not-allowed border border-white/[0.04]"
              >
                {!isPro ? (locale === "vi" ? "Gói hiện tại" : "Current Plan") : (locale === "vi" ? "Gói cơ bản" : "Base Plan")}
              </button>
            </div>
          </ScrollReveal>

          {/* PRO PLAN */}
          <ScrollReveal direction="up" delay={0.6} className="flex">
            <div className={`plan-card-premium w-full flex-grow pro-tier hover-lift ${isPro ? "active-tier" : ""}`}>
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
                {billingCycle === "monthly" ? proPriceMonthly : proPriceAnnual}
                <span>/tháng {billingCycle === "annual" && (locale === "vi" ? "(thanh toán năm)" : "(billed annually)")}</span>
              </div>

              <p className="plan-card-desc">
                {locale === "vi"
                  ? "Tăng tốc hiệu suất làm việc với bộ lưu trữ mở rộng và truy cập API không giới hạn."
                  : "Boost productivity with larger knowledge sizes and unrestricted compilation pipelines."}
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

              {errorMessage && (
                <p className="text-xs text-red-400 font-semibold text-center mt-1">{errorMessage}</p>
              )}

              {isPro ? (
                <button
                  disabled
                  className="w-full py-3 bg-auth-accent/20 text-auth-accent font-semibold rounded-xl text-xs cursor-not-allowed border border-auth-accent/30 flex items-center justify-center gap-1.5"
                >
                  <LineIcon name="checkmark" className="h-3.5 w-3.5" />
                  {locale === "vi" ? "Đang hoạt động" : "Active"}
                </button>
              ) : hasRecordedIntent ? (
                <Link href={`/${locale}/settings/plan`} className="w-full">
                  <Button variant="ghost" size="lg" fullWidth rightIcon={<LineIcon name="arrow-right" className="h-4 w-4" />}>
                    {locale === "vi" ? "Xem trạng thái đăng ký" : "View intent status"}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleUpgradeAction}
                  isLoading={isUpgrading}
                  leftIcon={<LineIcon name="bolt" className="h-4 w-4" />}
                >
                  {locale === "vi" ? "Nâng cấp lên Pro" : "Upgrade to Pro"}
                </Button>
              )}
            </div>
          </ScrollReveal>

        </div>

        {/* Security / SSL stamp */}
        <ScrollReveal direction="up" delay={0.7} className="mt-4">
          <div className="flex items-center gap-2 text-xs text-auth-text-3 font-semibold select-none">
            <LineIcon name="shield" className="h-4 w-4 text-auth-text-3" />
            <span>
              {locale === "vi"
                ? "Hệ thống bảo mật 256-bit SSL · Hỗ trợ thanh toán an toàn"
                : "256-bit SSL secured checkout · Cancel anytime"}
            </span>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
