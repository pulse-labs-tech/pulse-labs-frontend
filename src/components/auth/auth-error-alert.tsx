/**
 * Auth Error Alert — Reusable error/warning block for auth pages.
 * Maps API error codes to Vietnamese user-facing messages.
 *
 * @see /features/api-docs/API_Auth_Docs.md — Error Code Catalog
 */

import {
  AlertCircle,
  ShieldAlert,
  WifiOff,
  Clock,
  ServerCrash,
  MailWarning,
  Link2Off,
  CheckCircle2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AuthErrorCode } from "@/types/auth";

// Re-export for backward compatibility
export type { AuthErrorCode } from "@/types/auth";

interface AuthErrorConfig {
  message: string;
  icon: ReactNode;
  variant: "error" | "warning";
  action?: { label: string; href?: string };
}

const errorConfigs: Record<AuthErrorCode, AuthErrorConfig> = {
  // ── Auth Errors ──
  INVALID_CREDENTIALS: {
    message: "Email hoặc mật khẩu không đúng.",
    icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  EMAIL_NOT_VERIFIED: {
    message: "Tài khoản cần xác minh email trước khi sử dụng.",
    icon: <MailWarning className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    action: { label: "Gửi lại email xác minh" },
  },
  ACCOUNT_LOCKED: {
    message:
      "Tài khoản đang bị tạm khoá. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
    icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Liên hệ hỗ trợ", href: "/contact" },
  },
  RATE_LIMITED: {
    message: "Bạn thử quá nhiều lần. Vui lòng thử lại sau ít phút.",
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
  },

  // ── Validation ──
  VALIDATION_ERROR: {
    message: "Vui lòng kiểm tra lại thông tin.",
    icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },

  // ── Token / Verify Email ──
  TOKEN_MISSING: {
    message: "Link xác minh không hợp lệ.",
    icon: <Link2Off className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  TOKEN_INVALID: {
    message: "Link xác minh không hợp lệ hoặc đã được sử dụng.",
    icon: <Link2Off className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Gửi lại email xác minh" },
  },
  TOKEN_EXPIRED: {
    message: "Link xác minh đã hết hạn. Vui lòng gửi lại.",
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    action: { label: "Gửi lại" },
  },
  EMAIL_ALREADY_VERIFIED: {
    message: "Email đã được xác minh trước đó.",
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    action: { label: "Đăng nhập", href: "/login" },
  },

  // ── Session / Access Token ──
  UNAUTHORIZED: {
    message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
    icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Đăng nhập", href: "/login" },
  },

  // ── Refresh Token ──
  MISSING_REFRESH_TOKEN: {
    message: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
    icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Đăng nhập", href: "/login" },
  },
  INVALID_REFRESH_TOKEN: {
    message: "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.",
    icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Đăng nhập", href: "/login" },
  },
  REFRESH_TOKEN_EXPIRED: {
    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
    variant: "warning",
    action: { label: "Đăng nhập", href: "/login" },
  },
  REFRESH_TOKEN_REUSED: {
    message:
      "Phát hiện hoạt động bất thường. Tất cả phiên đã bị đăng xuất vì lý do bảo mật.",
    icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
    action: { label: "Đăng nhập lại", href: "/login" },
  },

  // ── Client-side Errors ──
  SERVER_ERROR: {
    message: "Hệ thống đang bận. Vui lòng thử lại.",
    icon: <ServerCrash className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
  NETWORK_ERROR: {
    message: "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.",
    icon: <WifiOff className="h-3.5 w-3.5 shrink-0" />,
    variant: "error",
  },
};

interface AuthErrorAlertProps {
  code: AuthErrorCode;
  onAction?: () => void;
  className?: string;
}

export function AuthErrorAlert({
  code,
  onAction,
  className = "",
}: AuthErrorAlertProps) {
  const config = errorConfigs[code];
  if (!config) return null;

  const isWarning = config.variant === "warning";

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
        {config.message}
        {config.action && (
          <>
            {" "}
            {config.action.href ? (
              <a
                href={config.action.href}
                className="ml-1 font-medium underline underline-offset-2 hover:no-underline"
              >
                {config.action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="ml-1 font-medium underline underline-offset-2 hover:no-underline"
              >
                {config.action.label}
              </button>
            )}
          </>
        )}
      </span>
    </div>
  );
}
