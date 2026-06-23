"use client";

/**
 * Login Form — Client Component with full state management.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors.
 *
 * On success: server action returns { redirectTo, sessionUser }.
 * We call setUser() on AuthProvider THEN router.push() so ProtectedRoute
 * sees authenticated state before the next page renders.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";
import { useAuth } from "@/hooks/use-auth";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";
import { getLocalizedPath } from "@/lib/utils";
import type { AuthErrorCode, AuthUser } from "@/types/auth";
import { API_BASE } from "@/lib/client-api";

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "";
  const { t, locale } = useTranslation();
  const { setUser } = useAuth();
  const router = useRouter();

  // Local state for client-side submission
  const [state, setState] = useState<{
    globalError?: AuthErrorCode;
    serverMessage?: string;
    errors?: { email?: string[]; password?: string[] };
    redirectTo?: string;
    sessionUser?: AuthUser;
    retryAfterSeconds?: number;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Simple email/password validation on client side
    const errors: { email?: string[]; password?: string[] } = {};
    if (!email) {
      errors.email = [t("auth.validation.emailRequired", "Email là bắt buộc")];
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = [t("auth.validation.emailInvalid", "Email không hợp lệ")];
    }
    if (!password) {
      errors.password = [t("auth.validation.passwordRequired", "Mật khẩu là bắt buộc")];
    } else if (password.length < 8) {
      errors.password = [t("auth.validation.passwordMin", "Mật khẩu phải từ 8 ký tự")];
    }

    if (Object.keys(errors).length > 0) {
      setState({ errors });
      setIsPending(false);
      return;
    }

    try {
      // Call standard proxy endpoint
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Platform": "web",
        },
        body: JSON.stringify({ email, password, returnUrl }),
      });

      const res = await response.json();
      console.log("🟢 [F12 API RESPONSE] Client login fetch:", res);

      if (res.status === "1" && res.data) {
        // Sync user state to Auth Provider
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
        
        // Backend returns nextRoute/next_route
        const nextRoute = res.data.nextRoute || res.data.next_route || "/dashboard";
        setState({
          redirectTo: nextRoute.startsWith("/") ? nextRoute : "/" + nextRoute,
          sessionUser: res.data.user,
        });
      } else {
        const errCode = (res.error_code || "SERVER_ERROR") as AuthErrorCode;
        setState({
          globalError: errCode,
          serverMessage: res.msg,
          retryAfterSeconds: res.data?.retryAfterSeconds,
        });
      }
    } catch (err) {
      console.error("Client login error:", err);
      setState({
        globalError: "NETWORK_ERROR",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Handle successful login: update AuthProvider state THEN navigate.
  useEffect(() => {
    if (state?.redirectTo && state.sessionUser) {
      setUser(state.sessionUser);
      router.push(getLocalizedPath(state.redirectTo, locale));
    }
  }, [state, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <PulseLogo size={28} className="drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]" />
          <PulseWordmark className="text-sm" />
        </div>

        {/* Form header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <h2
            className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]"
            id="login-heading"
          >
            {t("auth.login.title")}
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            {t("auth.login.noAccount")}{" "}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-auth-accent hover:underline"
            >
              {t("auth.login.registerNow")} →
            </Link>
          </p>
        </div>

        {/* Loading overlay while redirecting after successful login */}
        {state?.redirectTo ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <DotMatrixLoader variant="wave" size="md" />
            <span className="text-sm text-auth-text-2">Đang đăng nhập...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            aria-labelledby="login-heading"
            noValidate
          >
            <input type="hidden" name="returnUrl" value={returnUrl} />

            {/* Global error */}
            {state?.globalError && (
              <AuthErrorAlert
                code={state.globalError}
                serverMessage={state.serverMessage}
                retryAfterSeconds={state.retryAfterSeconds}
              />
            )}

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
              >
                {t("auth.login.email")}
              </label>
              <input
                type="email"
                id="login-email"
                name="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                aria-invalid={!!state?.errors?.email}
                aria-describedby={
                  state?.errors?.email ? "login-email-error" : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.email
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.email && (
                <p
                  id="login-email-error"
                  className="text-xs text-auth-error"
                  role="alert"
                >
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
                >
                  {t("auth.login.password")}
                </label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs font-medium text-auth-accent hover:underline"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-invalid={!!state?.errors?.password}
                aria-describedby={
                  state?.errors?.password ? "login-password-error" : undefined
                }
                className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-base md:text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-colors duration-200 3xl:text-sm 3xl:py-3 ${
                  state?.errors?.password
                    ? "border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]"
                    : "border-auth-border focus:border-auth-accent focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]"
                }`}
              />
              {state?.errors?.password && (
                <p
                  id="login-password-error"
                  className="text-xs text-auth-error"
                  role="alert"
                >
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending}
              aria-busy={isPending}
            >
              {t("auth.login.button")} →
            </Button>

            {/* Footer — Terms */}
            <p className="text-center text-xs leading-relaxed text-auth-text-3">
              {t("auth.login.agreement")}{" "}
              <Link
                href={`/${locale}/terms`}
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                {t("auth.login.terms")}
              </Link>{" "}
              {t("auth.login.and")}{" "}
              <Link
                href={`/${locale}/privacy`}
                prefetch={false}
                className="text-auth-text-2 hover:text-auth-text underline underline-offset-2"
              >
                {t("auth.login.privacy")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
