"use client";

import { useEffect, useRef } from "react";
import { X, Zap, Lock, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/locale-context";
import type { GateReason, PlanGateResult } from "@/types/settings";

interface PlanGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gate: PlanGateResult | null;
  /**
   * Optional override for the upgrade CTA href.
   * Defaults to /settings/plan/upgrade
   */
  upgradeHref?: string;
  /** Variant: modal (default), banner, or inline */
  variant?: "modal" | "banner" | "inline";
}

function getGateMessage(reason: GateReason | null, t: (key: string, fallback: string) => string): string {
  switch (reason) {
    case "ROLE_LIMIT_REACHED":
      return t("settings.planGate.ROLE_LIMIT_REACHED", "Gói Free chỉ hỗ trợ 1 Role KB.");
    case "STORAGE_LIMIT_REACHED":
      return t("settings.planGate.STORAGE_LIMIT_REACHED", "Bạn đã dùng hết dung lượng của gói hiện tại.");
    case "COMPILE_LIMIT_REACHED":
      return t("settings.planGate.COMPILE_LIMIT_REACHED", "Bạn đã dùng hết lượt compile trong chu kỳ này.");
    case "QUERY_LIMIT_REACHED":
      return t("settings.planGate.QUERY_LIMIT_REACHED", "Bạn đã dùng hết lượt hỏi AI hôm nay.");
    case "DOMAIN_LIMIT_REACHED":
      return t("settings.planGate.DOMAIN_LIMIT_REACHED", "Bạn đã dùng hết số domain của gói hiện tại.");
    case "PLAN_REQUIRED":
      return t("settings.planGate.PLAN_REQUIRED", "Tính năng này cần gói Pro.");
    default:
      return t("settings.planGate.default", "Hành động này bị giới hạn bởi gói hiện tại.");
  }
}

function getGateTitle(reason: GateReason | null, t: (key: string, fallback: string) => string): string {
  switch (reason) {
    case "ROLE_LIMIT_REACHED":
      return t("settings.planGate.titleRoleLimit", "Đã đạt giới hạn Role KB");
    case "STORAGE_LIMIT_REACHED":
      return t("settings.planGate.titleStorageLimit", "Đã hết dung lượng lưu trữ");
    case "COMPILE_LIMIT_REACHED":
      return t("settings.planGate.titleCompileLimit", "Đã hết lượt compile");
    case "QUERY_LIMIT_REACHED":
      return t("settings.planGate.titleQueryLimit", "Đã hết lượt hỏi AI");
    case "DOMAIN_LIMIT_REACHED":
      return t("settings.planGate.titleDomainLimit", "Đã hết số domain");
    case "PLAN_REQUIRED":
      return t("settings.planGate.titlePlanRequired", "Cần gói Pro");
    default:
      return t("settings.planGate.titleDefault", "Giới hạn gói Free");
  }
}

export function PlanGateModal({
  isOpen,
  onClose,
  gate,
  upgradeHref,
  variant = "modal",
}: PlanGateModalProps) {
  const { t, locale } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  const upgradePath = upgradeHref ?? `/${locale}/settings/plan/upgrade`;
  const settingsPath = `/${locale}/settings/plan`;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Trap focus when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !gate) return null;

  const reason = gate.reason;
  const title = getGateTitle(reason, t);
  const message = getGateMessage(reason, t);

  const hasQuota = gate.quota !== null && gate.quota !== undefined;
  const hasResetTime = hasQuota && gate.quota?.resetsAt;

  if (variant === "banner") {
    return (
      <div
        className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 animate-fade-in"
        role="alert"
      >
        <Lock className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">{title}</p>
          <p className="text-xs text-red-400/80 mt-0.5">{message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={upgradePath}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-auth-accent text-white text-xs font-semibold hover:bg-auth-accent-dark transition-colors"
          >
            <Zap className="h-3 w-3" />
            {t("settings.planGate.upgradeCta", "Nâng cấp")}
          </Link>
          <button
            onClick={onClose}
            className="text-red-400/60 hover:text-red-300 transition-colors cursor-pointer"
            aria-label={t("common.cancel", "Đóng")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-950/10 p-5"
        role="alert"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-auth-text-2 mt-0.5">{message}</p>
          </div>
        </div>

        {hasQuota && gate.quota && (
          <div className="text-xs text-auth-text-2 bg-auth-elevated/50 rounded-lg px-3 py-2">
            {t("settings.planGate.usage", "Sử dụng:")} {gate.quota.used?.toLocaleString()} / {gate.quota.limit?.toLocaleString()}
            {hasResetTime && (
              <span className="ml-2 text-auth-text-3">
                · {t("settings.planGate.resets", "Làm mới theo chu kỳ")}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={upgradePath}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-auth-accent text-white text-xs font-semibold hover:bg-auth-accent-dark transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            {t("settings.planGate.upgradeCta", "Nâng cấp Pro")}
          </Link>
          <Link
            href={settingsPath}
            className="text-xs text-auth-text-2 hover:text-white transition-colors"
          >
            {t("settings.planGate.viewSettings", "Xem hạn mức →")}
          </Link>
        </div>
      </div>
    );
  }

  // Modal variant (default)
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-gate-title"
    >
      <div className="w-full max-w-md bg-auth-surface border border-auth-border rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2
                id="plan-gate-title"
                className="text-base font-bold text-white"
              >
                {title}
              </h2>
              <p className="text-xs text-auth-text-2 mt-0.5">
                {gate.plan === "free"
                  ? t("settings.planGate.currentPlanFree", "Gói Free hiện tại")
                  : t("settings.planGate.currentPlanPro", "Gói Pro hiện tại")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-auth-text-3 hover:text-white hover:bg-auth-elevated transition-colors cursor-pointer"
            aria-label={t("common.cancel", "Đóng")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Gate message */}
          <div className="flex items-start gap-2.5 rounded-lg bg-red-950/20 border border-red-500/20 p-3.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <p className="text-sm text-red-200 leading-relaxed">{message}</p>
          </div>

          {/* Quota detail if available */}
          {hasQuota && gate.quota && (
            <div className="rounded-lg bg-auth-elevated border border-auth-border p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-auth-text-2">{t("settings.planGate.currentUsage", "Sử dụng hiện tại")}</span>
                <span className="font-semibold text-white">
                  {gate.quota.used?.toLocaleString()} / {gate.quota.limit?.toLocaleString()}
                </span>
              </div>
              {hasResetTime && (
                <div className="flex items-center gap-1.5 text-xs text-auth-text-3">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t("settings.planGate.resetsInfo", "Hạn mức tự động làm mới theo chu kỳ")}</span>
                </div>
              )}
            </div>
          )}

          {/* Upgrade CTA */}
          <div className="space-y-2">
            <Link href={upgradePath} onClick={onClose}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Zap className="h-4 w-4" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {t("settings.planGate.upgradeCta", "Nâng cấp lên Pro")}
              </Button>
            </Link>
            <Link href={settingsPath} onClick={onClose}>
              <Button variant="ghost" size="md" fullWidth>
                {t("settings.planGate.viewQuota", "Xem chi tiết hạn mức")}
              </Button>
            </Link>
          </div>

          <p className="text-center text-[10px] text-auth-text-3">
            {t("settings.planGate.notice", "Gói của bạn sẽ không thay đổi cho đến khi được xác nhận.")}
          </p>
        </div>
      </div>
    </div>
  );
}
