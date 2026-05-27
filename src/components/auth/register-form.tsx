"use client";

/**
 * Register Form — Client Component with full state management.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors,
 *          verifyPending (show verify screen + auto-bypass), success (manual verify).
 *
 * Register flow:
 *  1. Submit form → registerAction
 *  2a. verifyPending = true  → show VerifyEmailScreen
 *      - If verificationLink present (dev mode) → auto-bypass after brief delay
 *      - If not → user must check email; resend available after countdown
 *  2b. redirectTo set        → tokens stored server-side, navigate to /onboarding
 *      → OnboardingWizard shows Welcome screen (step 1)
 */

import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, Check, Sparkles, Brain, Search, Target, ChevronRight } from "lucide-react";
import { registerAction, resendVerificationAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";
import { useAuth } from "@/hooks/use-auth";

export function RegisterForm() {
  const { t, locale } = useTranslation();
  const { setUser } = useAuth();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  // Handle successful auto-login after register: update AuthProvider THEN navigate.
  // This prevents the "no user data" issue where root layout cache returns null initialUser.
  useEffect(() => {
    if (state?.redirectTo) {
      if (state.sessionUser) {
        setUser(state.sessionUser);
      }
      const path = state.redirectTo.startsWith("/") ? state.redirectTo : "/" + state.redirectTo;
      router.push(`/${locale}${path}`);
    }
  }, [state?.redirectTo, state?.sessionUser]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <Loader2 className="h-7 w-7 animate-spin text-auth-accent" />
          <p className="text-sm text-auth-text-2">Đang thiết lập tài khoản...</p>
        </div>
      </div>
    );
  }

  // ─── Verify Email screen (both verifyPending and legacy success state) ──
  if (state?.verifyPending || state?.success) {
    return (
      <VerifyEmailScreen
        email={state.email || ""}
        password={password}
        initialCountdown={state.resendAvailableInSeconds || 60}
        verificationLink={state.verificationLink}
      />
    );
  }

  // ─── Registration form ──
  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[0_0_12px_oklch(0.72_0.11_145_/_0.3)]">
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
            <span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">
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
            {t("auth.register.title")}
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            {t("auth.register.hasAccount")}{" "}
            <Link
              href={`/${locale}/login`}
              className="font-medium text-auth-accent hover:underline"
            >
              {t("auth.register.loginNow")} →
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
                aria-describedby={
                  state?.errors?.firstName
                    ? "register-firstName-error"
                    : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
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
                aria-describedby={
                  state?.errors?.lastName
                    ? "register-lastName-error"
                    : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
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
              aria-describedby={
                state?.errors?.email ? "register-email-error" : undefined
              }
              className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
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
                      className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${
                        i < strengthScore
                          ? strengthScore <= 1
                            ? "bg-red-500"
                            : strengthScore === 2
                              ? "bg-orange-500"
                              : "bg-[var(--color-brand-500)]"
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
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded border border-auth-border bg-auth-elevated transition-colors duration-200 checked:border-[var(--color-auth-accent)] checked:bg-[var(--color-auth-accent)] focus:ring-2 focus:ring-auth-accent-dim cursor-pointer relative
              checked:after:content-['✓'] checked:after:text-white checked:after:text-[10px] checked:after:font-bold checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center"
            />
            <label
              htmlFor="register-terms"
              className="text-xs leading-relaxed text-auth-text-3 cursor-pointer select-none"
            >
              {t("auth.register.agreement")}{" "}
              <Link
                href={`/${locale}/terms`}
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                {t("auth.register.terms")}
              </Link>{" "}
              {t("auth.register.and")}{" "}
              <Link
                href={`/${locale}/privacy`}
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                {t("auth.register.privacy")}
              </Link>
            </label>
          </div>
          {state?.errors?.acceptedTerms && (
            <p className="-mt-2 text-xs text-auth-error" role="alert">
              {state.errors.acceptedTerms[0]}
            </p>
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
// Verify Email Screen
// ────────────────────────────────────────────────────────────────
// Shown after register when BE signals verificationRequired: true.
// If verificationLink is present (dev mode), auto-bypass after a
// brief countdown so user sees the screen before being redirected.
// ────────────────────────────────────────────────────────────────

function VerifyEmailScreen({
  email,
  password,
  initialCountdown,
  verificationLink,
}: {
  email: string;
  password?: string;
  initialCountdown: number;
  verificationLink?: string;
}) {
  const { t, locale } = useTranslation();
  const { setUser } = useAuth();
  const router = useRouter();

  const [countdown, setCountdown] = useState(initialCountdown);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Auto-bypass state: when verificationLink present, show progress then redirect
  const [autoBypassState, setAutoBypassState] = useState<
    "idle" | "verifying" | "done" | "error"
  >(verificationLink ? "verifying" : "idle");
  const [autoBypassCountdown, setAutoBypassCountdown] = useState(3);
  const autoBypassStarted = useRef(false);

  // ── Auto-bypass when verificationLink is present (dev mode) ──
  // Show a brief "Đang xác minh..." state → then auto-login → redirect /onboarding
  useEffect(() => {
    if (!verificationLink || autoBypassStarted.current) return;
    autoBypassStarted.current = true;

    // Show "verifying" for 2s, then auto-login using resend action
    const verifyTimer = setTimeout(async () => {
      try {
        const result = await resendVerificationAction(email, password);

        if (result.success && result.autoVerifiedRedirect) {
          // Store user from auth context if returned
          setAutoBypassState("done");

          // Brief "done" display then redirect
          setTimeout(() => {
            const path = result.autoVerifiedRedirect!.startsWith("/")
              ? result.autoVerifiedRedirect!
              : "/" + result.autoVerifiedRedirect!;
            window.location.href = `/${locale}${path}`;
          }, 1000);
        } else {
          // Auto-bypass failed — fall back to manual verify UI
          setAutoBypassState("idle");
        }
      } catch {
        setAutoBypassState("idle");
      }
    }, 2000);

    return () => clearTimeout(verifyTimer);
  }, [verificationLink]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend countdown timer (only when in manual mode)
  useEffect(() => {
    if (autoBypassState !== "idle") return;
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
  }, [countdown, autoBypassState]);

  // Handle manual resend — also handles auto-verify when BE returns verificationLink
  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const result = await resendVerificationAction(email, password);

      if (result.success) {
        // Auto-verified — redirect immediately
        if (result.autoVerifiedRedirect) {
          setResendMessage(t("auth.register.verifiedRedirecting"));
          const path = result.autoVerifiedRedirect.startsWith("/")
            ? result.autoVerifiedRedirect
            : "/" + result.autoVerifiedRedirect;
          window.location.href = `/${locale}${path}`;
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
  }, [countdown, isResending, email, password, t, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-bypass loading state ──
  if (autoBypassState === "verifying") {
    return (
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
        <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
          {/* Animated verify icon */}
          <div className="mb-6 relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border border-[var(--color-auth-accent)]/30 bg-[var(--color-auth-accent-dim)] animate-pulse" />
            <Mail className="relative h-7 w-7 text-[var(--color-auth-accent)]" />
          </div>

          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
            Đang xác minh email...
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-auth-text-2 3xl:text-sm">
            Hệ thống đang tự động xác minh{" "}
            <span className="font-semibold text-auth-text">{email}</span>.
            Vui lòng đợi trong giây lát.
          </p>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-auth-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] transition-all duration-[2000ms] ease-in-out"
              style={{ width: "85%" }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-auth-accent" />
            <span className="text-xs text-auth-text-3">Đang kích hoạt tài khoản...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Auto-bypass done state ──
  if (autoBypassState === "done") {
    return (
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
        <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
          {/* Success icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
            <Check className="h-7 w-7 text-emerald-400" strokeWidth={2.5} />
          </div>

          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
            Xác minh thành công! 🎉
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-auth-text-2 3xl:text-sm">
            Email{" "}
            <span className="font-semibold text-auth-text">{email}</span>{" "}
            đã được xác minh. Đang chuyển hướng...
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-auth-accent" />
            <span className="text-xs text-auth-text-3">Thiết lập tài khoản...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Manual verify screen (idle state — user must check email) ──
  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Success icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-auth-accent)]/20 bg-[var(--color-auth-accent-dim)]">
          <Mail className="h-6 w-6 text-[var(--color-auth-accent)]" />
        </div>

        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
          {t("auth.register.checkEmail")}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-auth-text-2 3xl:text-sm">
          {t("auth.register.sentEmailTo")}{" "}
          <span className="font-semibold text-auth-text">
            {email}
          </span>
          . {t("auth.register.checkInbox")}
        </p>

        {/* Steps hint */}
        <div className="mt-5 rounded-xl border border-auth-border bg-auth-elevated p-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-auth-text-3">
            Các bước tiếp theo
          </p>
          {[
            "Kiểm tra hộp thư của bạn (kể cả Spam/Junk)",
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

        {/* Countdown + resend */}
        <div className="mt-5">
          {countdown > 0 ? (
            <p className="text-xs text-auth-text-3">
              {t("auth.register.canResend").replace("{seconds}", countdown.toString())}
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isResending}
              onClick={handleResend}
            >
              {t("auth.register.resendButton")}
            </Button>
          )}

          {resendMessage && (
            <p className={`mt-1 text-xs ${
              resendMessage.startsWith("✓")
                ? "text-[var(--color-auth-accent)]"
                : "text-auth-error"
            }`}>
              {resendMessage}
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link
            href={`/${locale}/login`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_0_15px_oklch(0.72_0.11_145_/_0.20)] transition-all duration-200 hover:shadow-[0_0_28px_oklch(0.72_0.11_145_/_0.45)] hover:-translate-y-[1px] active:scale-[0.97] 3xl:text-sm"
          >
            {t("auth.register.goToLogin")}
          </Link>
        </div>

        {/* Bottom hint */}
        <p className="mt-4 text-center text-[11px] text-auth-text-3">
          Không nhận được email?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-auth-text-2 underline underline-offset-2 hover:text-auth-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Gửi lại
          </button>
        </p>
      </div>
    </div>
  );
}
