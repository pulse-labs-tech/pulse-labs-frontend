"use client";

/**
 * Register Form — Client Component.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors,
 *          verifyPending (show check-email state), redirectTo (auto-login success).
 *
 * Register flow (per API docs):
 *  1. Submit form → registerAction (server)
 *  2a. verifyPending = true  → show "Check your email" screen (manual verify flow)
 *      - Server already attempted auto-bypass via verificationLink (dev mode)
 *      - If bypass failed → user must click the link in their email
 *      - Resend available after countdown
 *  2b. redirectTo set        → tokens stored, navigate to /welcome (new user) or /dashboard (existing)
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { resendVerificationAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";
import { useAuth } from "@/hooks/use-auth";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { getLocalizedPath } from "@/lib/utils";
import type { AuthErrorCode, AuthUser } from "@/types/auth";
import { API_BASE } from "@/lib/client-api";

export function RegisterForm() {
  const { t, locale } = useTranslation();
  const { setUser } = useAuth();
  const router = useRouter();

  // Local state for client-side submission
  const [state, setState] = useState<{
    globalError?: AuthErrorCode;
    serverMessage?: string;
    errors?: { firstName?: string[]; lastName?: string[]; email?: string[]; password?: string[]; acceptedTerms?: string[] };
    redirectTo?: string;
    sessionUser?: AuthUser;
    retryAfterSeconds?: number;
    verifyPending?: boolean;
    email?: string;
    resendAvailableInSeconds?: number;
    success?: boolean;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const passwordInput = formData.get("password") as string;
    const acceptedTerms = formData.get("acceptedTerms") === "true";

    // Client-side validations
    const errors: any = {};
    if (!firstName) errors.firstName = [t("auth.validation.firstNameRequired", "Tên là bắt buộc")];
    if (!lastName) errors.lastName = [t("auth.validation.lastNameRequired", "Họ là bắt buộc")];
    if (!email) {
      errors.email = [t("auth.validation.emailRequired", "Email là bắt buộc")];
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = [t("auth.validation.emailInvalid", "Email không hợp lệ")];
    }
    if (!passwordInput) {
      errors.password = [t("auth.validation.passwordRequired", "Mật khẩu là bắt buộc")];
    } else if (passwordInput.length < 8) {
      errors.password = [t("auth.validation.passwordMin", "Mật khẩu phải từ 8 ký tự")];
    }
    if (!acceptedTerms) {
      errors.acceptedTerms = [t("auth.validation.termsRequired", "Bạn phải đồng ý với Điều khoản")];
    }

    if (Object.keys(errors).length > 0) {
      setState({ errors });
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Platform": "web",
        },
        body: JSON.stringify({ firstName, lastName, email, password: passwordInput, selectedPlanIntent: "free", acceptedTerms }),
      });

      const res = await response.json();
      console.log("🟢 [F12 API RESPONSE] Client register fetch:", res);

      if (res.status === "1" && res.data) {
        if (res.data.accessToken) {
          // Auto-login success!
          setUser(res.data.user);
          
          // Save tokens and user data in browser cookies so middleware and API helpers can use them
          const maxAge = res.data.expiresIn || 900;
          const secure = window.location.protocol === "https:";
          const sameSite = "lax";
          
          document.cookie = `pulse_at=${res.data.accessToken}; path=/; max-age=${maxAge}; ${secure ? "secure;" : ""} samesite=${sameSite}`;
          if (res.data.refreshToken) {
            document.cookie = `pulse_rt=${res.data.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; ${secure ? "secure;" : ""} samesite=${sameSite}`;
          }
          
          const safeData = {
            id: res.data.user.id,
            email: res.data.user.email,
            firstName: res.data.user.firstName,
            lastName: res.data.user.lastName,
            displayName: res.data.user.displayName,
            plan: res.data.user.plan,
            onboardingStatus: res.data.user.onboardingStatus,
            roleKbId: res.data.user.roleKbId,
          };
          const encoded = encodeURIComponent(JSON.stringify(safeData));
          document.cookie = `pulse_user=${encoded}; path=/; max-age=${30 * 24 * 60 * 60}; ${secure ? "secure;" : ""} samesite=${sameSite}`;
          
          const nextRoute = res.data.nextRoute || "/welcome";
          setState({
            redirectTo: nextRoute.startsWith("/") ? nextRoute : "/" + nextRoute,
            sessionUser: res.data.user,
          });
        } else if (res.data.verificationRequired) {
          setState({
            verifyPending: true,
            email: res.data.email,
            resendAvailableInSeconds: res.data.resendAvailableInSeconds || 60,
          });
        } else {
          // Fallback
          setState({
            verifyPending: true,
            email: res.data.email,
            resendAvailableInSeconds: res.data.resendAvailableInSeconds || 60,
          });
        }
      } else {
        const errCode = (res.error_code || "SERVER_ERROR") as AuthErrorCode;
        setState({
          globalError: errCode,
          serverMessage: res.msg,
          retryAfterSeconds: res.data?.resendAvailableInSeconds,
        });
      }
    } catch (err) {
      console.error("Client register error:", err);
      setState({
        globalError: "NETWORK_ERROR",
      });
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (state?.redirectTo) {
      if (state.sessionUser) {
        setUser(state.sessionUser);
      }
      router.push(getLocalizedPath(state.redirectTo, locale));
    }
  }, [state, locale]); // eslint-disable-line react-hooks/exhaustive-deps

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
    t("auth.register.strengthMin"),
    t("auth.register.strengthWeak"),
    t("auth.register.strengthMedium"),
    t("auth.register.strengthGood"),
    t("auth.register.strengthStrong"),
  ];
  const strengthLabel = strengthLabels[strengthScore];

  // ─── Redirect in-progress (auto-login succeeded) ──
  if (state?.redirectTo) {
    return (
      <div className="flex w-full flex-col items-center justify-center bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16">
        <div className="flex flex-col items-center gap-4">
          <DotMatrixLoader variant="orbit" size="lg" />
          <p className="text-sm text-auth-text-2">Đang thiết lập tài khoản...</p>
        </div>
      </div>
    );
  }

  // ─── Verify Email screen (shown when BE needs manual verification) ──
  // Server already attempted auto-bypass via verificationLink in dev mode.
  // This screen is only shown when auto-bypass failed or not available.
  if (state?.verifyPending || state?.success) {
    return (
      <VerifyEmailScreen
        email={state.email || ""}
        initialCountdown={state.resendAvailableInSeconds || 60}
      />
    );
  }

  // ─── Registration form ──
  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[0_0_12px_oklch(0.72_0.11_145_/_0.3)]">
              <PulseLogo size={20} className="drop-shadow-[0_0_6px_var(--color-auth-accent-glow)]" />
            </div>
          <span className="text-sm font-bold tracking-tight text-auth-text">
            Pulse<span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">Knowledge</span>
          </span>
        </div>

        {/* Form header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <h2
            className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]"
            id="register-heading"
          >
            {t("auth.register.title")}
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            {t("auth.register.hasAccount")}{" "}
            <Link href={`/${locale}/login`} className="font-medium text-auth-accent hover:underline">
              {t("auth.register.loginNow")} →
            </Link>
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-firstName" className="text-xs font-semibold uppercase tracking-wider text-auth-text-2">
                {t("auth.register.firstName")}
              </label>
              <input
                type="text"
                id="register-firstName"
                name="firstName"
                placeholder={t("auth.register.firstName")}
                autoComplete="given-name"
                required
                aria-invalid={!!state?.errors?.firstName}
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.firstName
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.firstName && (
                <p className="text-xs text-auth-error" role="alert">{state.errors.firstName[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-lastName" className="text-xs font-semibold uppercase tracking-wider text-auth-text-2">
                {t("auth.register.lastName")}
              </label>
              <input
                type="text"
                id="register-lastName"
                name="lastName"
                placeholder={t("auth.register.lastName")}
                autoComplete="family-name"
                required
                aria-invalid={!!state?.errors?.lastName}
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.lastName
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.lastName && (
                <p className="text-xs text-auth-error" role="alert">{state.errors.lastName[0]}</p>
              )}
            </div>
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-email" className="text-xs font-semibold uppercase tracking-wider text-auth-text-2">
              {t("auth.register.email")}
            </label>
            <input
              type="email"
              id="register-email"
              name="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              aria-invalid={!!state?.errors?.email}
              className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
                state?.errors?.email
                  ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                  : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
              }`}
            />
            {state?.errors?.email && (
              <p className="text-xs text-auth-error" role="alert">{state.errors.email[0]}</p>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-xs font-semibold uppercase tracking-wider text-auth-text-2">
              {t("auth.register.password")}
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
                className={`w-full rounded-lg border bg-auth-elevated px-3.5 py-2.5 pr-10 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
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
                {showPassword ? <LineIcon name="eye" className="h-4 w-4" /> : <LineIcon name="eye" className="h-4 w-4" />}
              </button>
            </div>
            {state?.errors?.password && (
              <p className="text-xs text-auth-error" role="alert">{state.errors.password[0]}</p>
            )}

            {/* Password strength bar */}
            {password.length > 0 && (
              <div id="register-password-strength" className="mt-1 flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${
                        i < strengthScore
                          ? strengthScore <= 1 ? "bg-red-500" : strengthScore === 2 ? "bg-orange-500" : "bg-[var(--color-brand-500)]"
                          : "bg-auth-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-auth-text-3">{strengthLabel}</span>
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
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-auth-border bg-auth-elevated transition-colors duration-200 checked:border-[var(--color-auth-accent)] checked:bg-[var(--color-auth-accent)] focus:ring-2 focus:ring-auth-accent-dim"
            />
            <label htmlFor="register-terms" className="cursor-pointer select-none text-xs leading-relaxed text-auth-text-3">
              {t("auth.register.agreement")}{" "}
              <Link href={`/${locale}/terms`} prefetch={false} className="text-auth-text-2 underline underline-offset-2 hover:text-auth-text">
                {t("auth.register.terms")}
              </Link>{" "}
              {t("auth.register.and")}{" "}
              <Link href={`/${locale}/privacy`} prefetch={false} className="text-auth-text-2 underline underline-offset-2 hover:text-auth-text">
                {t("auth.register.privacy")}
              </Link>
            </label>
          </div>
          {state?.errors?.acceptedTerms && (
            <p className="-mt-2 text-xs text-auth-error" role="alert">{state.errors.acceptedTerms[0]}</p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            aria-busy={isPending}
            className="mt-1"
          >
            {t("auth.register.button")}
          </Button>
        </form>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────
// Verify Email Screen — shown after register when manual verify required
// ────────────────────────────────────────────────────────────────
// This screen is shown when the server requires manual email verification
// (auto-bypass via verificationLink was not available or failed).
// User must click the link in their email, then come back to login.
// ────────────────────────────────────────────────────────────────

function VerifyEmailScreen({
  email,
  initialCountdown,
}: {
  email: string;
  initialCountdown: number;
}) {
  const { t, locale } = useTranslation();
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Manual resend (calls server action — server may auto-verify if in dev mode)
  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setResendMessage(null);

    try {
      const result = await resendVerificationAction(email);
      console.log("🟢 [F12 API RESPONSE] resendVerificationAction:", result);
      if (result.success) {
        // If server auto-verified in dev mode, redirect is handled via window.location
        if (result.autoVerifiedRedirect) {
          setResendMessage(t("auth.register.verifiedRedirecting"));
          window.location.href = getLocalizedPath(result.autoVerifiedRedirect, locale);
          return;
        }
        setCountdown(result.resendAvailableInSeconds || 60);
        setResendMessage(t("auth.register.verificationResent"));
      } else {
        setResendMessage(result.serverMessage || t("auth.register.resendFailed"));
      }
    } catch {
      setResendMessage(t("auth.register.connectionError"));
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, email, t, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-auth-accent)]/20 bg-[var(--color-auth-accent-dim)]">
          <LineIcon name="envelope" className="h-6 w-6 text-[var(--color-auth-accent)]" />
        </div>

        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
          {t("auth.register.checkEmail")}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-auth-text-2 3xl:text-sm">
          {t("auth.register.sentEmailTo")}{" "}
          <span className="font-semibold text-auth-text">{email}</span>.{" "}
          {t("auth.register.checkInbox")}
        </p>

        {/* Steps */}
        <div className="mt-5 rounded-xl border border-auth-border bg-auth-elevated p-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-auth-text-3">Các bước tiếp theo</p>
          {[
            "Kiểm tra hộp thư (kể cả Spam/Junk)",
            "Click vào link xác minh trong email",
            "Bạn sẽ được chuyển đến trang Đăng nhập",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-auth-accent-dim)] text-[10px] font-bold text-auth-accent">
                {i + 1}
              </span>
              <span className="text-xs text-auth-text-2 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        {/* Resend section */}
        <div className="mt-5">
          {countdown > 0 ? (
            <p className="text-xs text-auth-text-3">
              {t("auth.register.canResend").replace("{seconds}", countdown.toString())}
            </p>
          ) : (
            <Button type="button" variant="outline" size="sm" isLoading={isResending} onClick={handleResend}>
              {t("auth.register.resendButton")}
            </Button>
          )}
          {resendMessage && (
            <p className={`mt-1.5 text-xs ${resendMessage.startsWith("✓") ? "text-[var(--color-auth-accent)]" : "text-auth-error"}`}>
              {resendMessage}
            </p>
          )}
        </div>

        {/* Go to login */}
        <div className="mt-6">
          <Link
            href={`/${locale}/login`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_0_15px_oklch(0.72_0.11_145_/_0.20)] transition-all duration-200 hover:shadow-[0_0_28px_oklch(0.72_0.11_145_/_0.45)] hover:-translate-y-[1px] active:scale-[0.97] 3xl:text-sm"
          >
            {t("auth.register.goToLogin")}
          </Link>
        </div>

        <p className="mt-4 text-center text-[11px] text-auth-text-3">
          Không nhận được email?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-auth-text-2 underline underline-offset-2 hover:text-auth-text disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            Gửi lại
          </button>
        </p>
      </div>
    </div>
  );
}
