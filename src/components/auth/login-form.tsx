"use client";

/**
 * Login Form — Client Component with full state management.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors.
 */

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "";
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const { t, locale } = useTranslation();

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
            Pulse<span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">Knowledge</span>
          </span>
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

        {/* Form */}
        <form
          action={formAction}
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
      </div>
    </div>
  );
}
