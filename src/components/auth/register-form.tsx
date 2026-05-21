"use client";

/**
 * Register Form — Client Component with full state management.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors, success state.
 *
 * Fields: firstName, lastName, email, password, acceptedTerms, selectedPlanIntent
 * On success → shows "check your email" verification screen.
 */

import { useActionState, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { registerAction, resendVerificationAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // ─── Password strength ──
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecialChar ? 1 : 0);

  const strengthLabels = [
    "Tối thiểu 8 ký tự, 1 chữ hoa, 1 số",
    "⚠ Yếu — thêm chữ hoa hoặc số",
    "~ Trung bình",
    "✓ Tốt",
    "✓✓ Rất mạnh",
  ];
  const strengthLabel = strengthLabels[strengthScore];

  // ─── Success state → "Check your email" screen ──
  if (state?.success) {
    return (
      <VerifyEmailScreen
        email={state.email || ""}
        password={password}
        initialCountdown={state.resendAvailableInSeconds || 60}
      />
    );
  }

  // ─── Registration form ──
  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="h-4 w-4 text-white"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-auth-text">
            Pulse
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Knowledge
            </span>
          </span>
        </div>

        {/* Form header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <h2
            className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]"
            id="register-heading"
          >
            Tạo tài khoản
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-medium text-auth-accent hover:underline"
            >
              Đăng nhập →
            </Link>
          </p>
        </div>

        {/* Form */}
        <form
          action={formAction}
          className="flex flex-col gap-4"
          aria-labelledby="register-heading"
          noValidate
        >
          {/* Global error */}
          {state?.globalError && (
            <AuthErrorAlert
              code={state.globalError}
              serverMessage={state.serverMessage}
              retryAfterSeconds={state.retryAfterSeconds}
            />
          )}

          {/* Name fields — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* First name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-firstName"
                className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
              >
                Tên
              </label>
              <input
                type="text"
                id="register-firstName"
                name="firstName"
                placeholder="Tên"
                autoComplete="given-name"
                required
                aria-invalid={!!state?.errors?.firstName}
                aria-describedby={
                  state?.errors?.firstName
                    ? "register-firstName-error"
                    : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.firstName
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.firstName && (
                <p
                  id="register-firstName-error"
                  className="text-xs text-auth-error"
                  role="alert"
                >
                  {state.errors.firstName[0]}
                </p>
              )}
            </div>

            {/* Last name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-lastName"
                className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
              >
                Họ
              </label>
              <input
                type="text"
                id="register-lastName"
                name="lastName"
                placeholder="Họ"
                autoComplete="family-name"
                required
                aria-invalid={!!state?.errors?.lastName}
                aria-describedby={
                  state?.errors?.lastName
                    ? "register-lastName-error"
                    : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.lastName
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.lastName && (
                <p
                  id="register-lastName-error"
                  className="text-xs text-auth-error"
                  role="alert"
                >
                  {state.errors.lastName[0]}
                </p>
              )}
            </div>
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-email"
              className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
            >
              Email
            </label>
            <input
              type="email"
              id="register-email"
              name="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              aria-invalid={!!state?.errors?.email}
              aria-describedby={
                state?.errors?.email ? "register-email-error" : undefined
              }
              className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
                state?.errors?.email
                  ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                  : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
              }`}
            />
            {state?.errors?.email && (
              <p
                id="register-email-error"
                className="text-xs text-auth-error"
                role="alert"
              >
                {state.errors.email[0]}
              </p>
            )}
          </div>

          {/* Password field with visibility toggle */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-password"
              className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="register-password"
                name="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!state?.errors?.password}
                aria-describedby="register-password-strength"
                className={`w-full rounded-lg border bg-auth-elevated px-3.5 py-2.5 pr-10 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.password
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-text-3 transition-colors hover:text-auth-text-2"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {state?.errors?.password && (
              <p className="text-xs text-auth-error" role="alert">
                {state.errors.password[0]}
              </p>
            )}

            {/* Password strength bar */}
            {password.length > 0 && (
              <div
                id="register-password-strength"
                className="mt-1 flex flex-col gap-1.5"
              >
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-[3px] flex-1 rounded-full transition-all duration-200 ${
                        i < strengthScore
                          ? strengthScore <= 1
                            ? "bg-red-500"
                            : strengthScore === 2
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                          : "bg-auth-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-auth-text-3">
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Hidden plan intent */}
          <input type="hidden" name="selectedPlanIntent" value="free" />

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="register-terms"
              name="acceptedTerms"
              value="true"
              required
              aria-invalid={!!state?.errors?.acceptedTerms}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded border border-auth-border bg-auth-elevated transition-all duration-200 checked:border-emerald-500 checked:bg-emerald-500 focus:ring-2 focus:ring-auth-accent-dim cursor-pointer relative
              checked:after:content-['✓'] checked:after:text-white checked:after:text-[10px] checked:after:font-bold checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center"
            />
            <label
              htmlFor="register-terms"
              className="text-xs leading-relaxed text-auth-text-3 cursor-pointer select-none"
            >
              Tôi đồng ý với{" "}
              <Link
                href="/terms"
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                Chính sách bảo mật
              </Link>
            </label>
          </div>
          {state?.errors?.acceptedTerms && (
            <p className="-mt-2 text-xs text-auth-error" role="alert">
              {state.errors.acceptedTerms[0]}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 3xl:text-sm 3xl:py-3.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              "Tạo tài khoản miễn phí →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────
// Verify Email Screen — Countdown timer + Resend
// ────────────────────────────────────────────────────────────────

function VerifyEmailScreen({
  email,
  password,
  initialCountdown,
}: {
  email: string;
  password?: string;
  initialCountdown: number;
}) {
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Handle resend — also handles auto-verify when BE returns verificationLink
  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const result = await resendVerificationAction(email, password);

      if (result.success) {
        // Auto-verified — redirect immediately
        if (result.autoVerifiedRedirect) {
          setResendMessage("✓ Email đã xác minh! Đang chuyển hướng...");
          window.location.href = result.autoVerifiedRedirect;
          return;
        }

        setCountdown(result.resendAvailableInSeconds || 60);
        setResendMessage("✓ Đã gửi lại email xác minh");
      } else {
        setResendMessage(result.serverMessage || "Không thể gửi lại. Vui lòng thử lại sau.");
      }
    } catch {
      setResendMessage("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, email, password]);

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Success icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/30">
          <Mail className="h-6 w-6 text-emerald-400" />
        </div>

        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
          Kiểm tra email
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-auth-text-2 3xl:text-sm">
          Chúng tôi đã gửi email xác minh đến{" "}
          <span className="font-semibold text-auth-text">
            {email}
          </span>
          . Vui lòng kiểm tra hộp thư và nhấn vào link xác minh.
        </p>

        {/* Countdown + resend */}
        <div className="mt-3">
          {countdown > 0 ? (
            <p className="text-xs text-auth-text-3">
              Có thể gửi lại sau{" "}
              <span className="font-mono font-semibold text-auth-text-2">
                {countdown}
              </span>{" "}
              giây.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-medium text-auth-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Đang gửi..." : "Gửi lại email xác minh →"}
            </button>
          )}

          {resendMessage && (
            <p className={`mt-1 text-xs ${
              resendMessage.startsWith("✓")
                ? "text-emerald-400"
                : "text-auth-error"
            }`}>
              {resendMessage}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] 3xl:text-sm 3xl:py-3.5"
          >
            Đi tới đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
