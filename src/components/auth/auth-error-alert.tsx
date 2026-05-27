"use client";

/**
 * Auth Error Alert — Reusable error/warning block for auth pages.
 * Maps API error codes to localized user-facing messages.
 *
 * @see /features/api-docs/API_Auth_Docs.md — Error Code Catalog
 */

import { LineIcon } from "@/components/shared/line-icon";
import type { ReactNode } from "react";
import type { AuthErrorCode } from "@/types/auth";
import { useTranslation } from "@/contexts/locale-context";

// Re-export for backward compatibility
export type { AuthErrorCode } from "@/types/auth";

interface AuthErrorConfig {
  icon: ReactNode;
  variant: "error" | "warning";
  actionKey?: string;
  actionHref?: string;
}

const errorConfigs: Record<AuthErrorCode, AuthErrorConfig> = {
  // ── Auth Errors ──
  INVALID_CREDENTIALS: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  EMAIL_NOT_VERIFIED: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
  },
  ACCOUNT_LOCKED: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    actionKey: "contactSupport",
    actionHref: "/contact",
  },
  RATE_LIMITED: {
    icon: <LineIcon name="alarm" className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
  },

  // ── Validation ──
  VALIDATION_ERROR: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },

  // ── Token / Verify Email ──
  TOKEN_MISSING: {
    icon: <LineIcon name="link" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  TOKEN_INVALID: {
    icon: <LineIcon name="link" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  TOKEN_EXPIRED: {
    icon: <LineIcon name="alarm" className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
  },
  EMAIL_ALREADY_VERIFIED: {
    icon: <LineIcon name="checkmark-circle" className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    actionKey: "login",
    actionHref: "/login",
  },

  // ── Session / Access Token ──
  UNAUTHORIZED: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    actionKey: "login",
    actionHref: "/login",
  },

  // ── Refresh Token ──
  MISSING_REFRESH_TOKEN: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    actionKey: "login",
    actionHref: "/login",
  },
  INVALID_REFRESH_TOKEN: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    actionKey: "login",
    actionHref: "/login",
  },
  REFRESH_TOKEN_EXPIRED: {
    icon: <LineIcon name="alarm" className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    actionKey: "login",
    actionHref: "/login",
  },
  REFRESH_TOKEN_REUSED: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    actionKey: "loginAgain",
    actionHref: "/login",
  },

  // ── Client-side Errors ──
  SERVER_ERROR: {
    icon: <LineIcon name="warning" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  NETWORK_ERROR: {
    icon: <LineIcon name="signal" className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
};

interface AuthErrorAlertProps {
  code: AuthErrorCode;
  serverMessage?: string;
  retryAfterSeconds?: number;
  onAction?: () => void;
  className?: string;
}

export function AuthErrorAlert({
  code,
  serverMessage,
  retryAfterSeconds,
  onAction,
  className = "",
}: AuthErrorAlertProps) {
  const { t, locale } = useTranslation();
  const config = errorConfigs[code];
  if (!config) return null;

  const isWarning = config.variant === "warning";

  let messageToDisplay = serverMessage || t(`auth.errors.${code}`);
  if (code === "RATE_LIMITED" && retryAfterSeconds && retryAfterSeconds > 0) {
    messageToDisplay = t("auth.errors.RATE_LIMITED_RETRY").replace(
      "{seconds}",
      String(retryAfterSeconds),
    );
  }

  const actionHref = config.actionHref ? `/${locale}${config.actionHref}` : undefined;
  const actionLabel = config.actionKey ? t(`auth.errors.${config.actionKey}`) : undefined;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
        isWarning
          ? "border-auth-orange/20 bg-auth-orange-dim text-auth-orange"
          : "border-auth-error/20 bg-auth-error-dim text-auth-error"
      } ${className}`}
    >
      <span className="mt-0.5">{config.icon}</span>
      <span className="flex-1">
        {messageToDisplay}
        {actionLabel && (
          <>
            {" "}
            {actionHref ? (
              <a
                href={actionHref}
                className="ml-1 font-medium underline underline-offset-2 hover:no-underline"
              >
                {actionLabel}
              </a>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="ml-1 font-medium underline underline-offset-2 hover:no-underline"
              >
                {actionLabel}
              </button>
            )}
          </>
        )}
      </span>
    </div>
  );
}
