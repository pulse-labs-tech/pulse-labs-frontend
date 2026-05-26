"use client";

import { AlertTriangle, CheckCircle2, XCircle, Infinity, RefreshCw, Loader2 } from "lucide-react";
import type { QuotaCardData, QuotaStatus } from "@/types/settings";
import { useTranslation } from "@/contexts/locale-context";

interface QuotaCardProps {
  quota: QuotaCardData;
  onRetry?: () => void;
  isRetrying?: boolean;
}

function getStatusColor(status: QuotaStatus): string {
  switch (status) {
    case "ok":
      return "text-auth-accent";
    case "warning":
      return "text-amber-400";
    case "exceeded":
      return "text-red-400";
    case "unlimited":
      return "text-auth-accent";
    case "unavailable":
    default:
      return "text-auth-text-2";
  }
}

function getStatusBarColor(status: QuotaStatus): string {
  switch (status) {
    case "ok":
      return "bg-auth-accent";
    case "warning":
      return "bg-amber-400";
    case "exceeded":
      return "bg-red-400";
    case "unlimited":
      return "bg-auth-accent";
    default:
      return "bg-auth-text-3";
  }
}

function getStatusBadge(status: QuotaStatus, t: (key: string, fallback: string) => string) {
  switch (status) {
    case "ok":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
          <CheckCircle2 className="h-3 w-3" />
          {t("settings.quota.statusOk", "Bình thường")}
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/40 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          {t("settings.quota.statusWarning", "Sắp đầy")}
        </span>
      );
    case "exceeded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/40 border border-red-500/20 text-red-400">
          <XCircle className="h-3 w-3" />
          {t("settings.quota.statusExceeded", "Đã đầy")}
        </span>
      );
    case "unlimited":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
          <Infinity className="h-3 w-3" />
          {t("settings.quota.statusUnlimited", "Không giới hạn")}
        </span>
      );
    case "unavailable":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
          {t("settings.quota.statusUnavailable", "Không khả dụng")}
        </span>
      );
    default:
      return null;
  }
}

function formatResetTime(resetsAt: string | null, window: QuotaCardData["window"], t: (key: string, fallback: string) => string): string | null {
  if (!resetsAt) return null;
  try {
    const date = new Date(resetsAt);
    if (window === "daily") {
      return t("settings.quota.resetsDaily", "Làm mới lúc 00:00 theo giờ của bạn");
    }
    if (window === "monthly") {
      return t("settings.quota.resetsMonthly", "Làm mới vào đầu tháng");
    }
  } catch {
    // ignore
  }
  return null;
}

export function QuotaCard({ quota, onRetry, isRetrying }: QuotaCardProps) {
  const { t } = useTranslation();

  if (quota.status === "unavailable") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-auth-border bg-auth-surface p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-auth-text-2 uppercase tracking-wider">
            {quota.label}
          </span>
          {getStatusBadge(quota.status, t)}
        </div>
        <p className="text-xs text-auth-text-3">
          {t("settings.quota.unavailableMsg", "Chưa tải được hạn mức này.")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-auth-accent hover:text-auth-accent-light transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t("common.retry", "Thử lại")}
          </button>
        )}
      </div>
    );
  }

  const percentage = quota.percentage !== null ? Math.min(100, Math.max(0, quota.percentage)) : null;
  const resetMsg = formatResetTime(quota.resetsAt, quota.window, t);

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-auth-surface p-4 relative overflow-hidden transition-all duration-300 ${
        quota.status === "exceeded"
          ? "border-red-500/30 bg-red-950/10"
          : quota.status === "warning"
          ? "border-amber-500/30 bg-amber-950/10"
          : "border-auth-border"
      }`}
    >
      {/* Top accent line for exceeded/warning */}
      {quota.status === "exceeded" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />
      )}
      {quota.status === "warning" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-auth-text-2 uppercase tracking-wider leading-tight">
          {quota.label}
        </span>
        {getStatusBadge(quota.status, t)}
      </div>

      {/* Usage numbers */}
      {quota.status === "unlimited" ? (
        <div className="flex items-center gap-1.5">
          <Infinity className="h-5 w-5 text-auth-accent" />
          <span className="text-xl font-bold text-white">
            {t("settings.quota.unlimited", "Không giới hạn")}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-extrabold tracking-tight ${getStatusColor(quota.status)}`}>
            {quota.used.toLocaleString()}
          </span>
          {quota.limit !== null && (
            <>
              <span className="text-sm text-auth-text-3">/</span>
              <span className="text-sm font-semibold text-auth-text-2">
                {quota.limit.toLocaleString()}
              </span>
            </>
          )}
        </div>
      )}

      {/* Progress bar */}
      {percentage !== null && quota.status !== "unlimited" && (
        <div className="space-y-1">
          <div
            className="h-1.5 w-full rounded-full bg-auth-elevated overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${quota.label}: ${percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${getStatusBarColor(quota.status)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] text-auth-text-3">{percentage}% {t("settings.quota.used", "đã dùng")}</span>
        </div>
      )}

      {/* Reset timing */}
      {resetMsg && (
        <p className="text-[10px] text-auth-text-3 leading-tight">{resetMsg}</p>
      )}

      {/* Helper copy for warning/exceeded */}
      {quota.helperCopy && (
        <p className={`text-xs leading-relaxed ${
          quota.status === "exceeded" ? "text-red-300" : "text-amber-300"
        }`}>
          {quota.helperCopy}
        </p>
      )}
    </div>
  );
}
