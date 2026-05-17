"use client";

/**
 * Login Form — Client Component with full state management.
 *
 * Uses React 19 useActionState for form submission.
 * Handles: idle, editing, submitting, field errors, global errors.
 */

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

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
            Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
        </div>

        {/* Form header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <h2
            className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]"
            id="login-heading"
          >
            Đăng nhập
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-medium text-auth-accent hover:underline"
            >
              Tạo tài khoản miễn phí →
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
          {/* Global error */}
          {state?.globalError && (
            <AuthErrorAlert code={state.globalError} />
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold uppercase tracking-wider text-auth-text-2"
            >
              Email
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
              className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
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
                Mật khẩu
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-auth-accent hover:underline"
              >
                Quên mật khẩu?
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
              className={`rounded-lg border bg-auth-elevated px-3.5 py-2.5 text-[13px] text-auth-text outline-none placeholder:text-auth-text-3 transition-all duration-200 3xl:text-sm 3xl:py-3 ${
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
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 3xl:text-sm 3xl:py-3.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập →"
            )}
          </button>

          {/* Footer — Terms */}
          <p className="text-center text-xs leading-relaxed text-auth-text-3">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Link
              href="/terms"
              className="text-auth-text-2 hover:text-auth-text"
            >
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link
              href="/privacy"
              className="text-auth-text-2 hover:text-auth-text"
            >
              Chính sách bảo mật
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
