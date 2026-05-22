"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmailAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import type { AuthErrorCode } from "@/types/auth";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [countdown, setCountdown] = useState(3);
  const [nextRoute, setNextRoute] = useState("/login");
  const [errorDetails, setErrorDetails] = useState<{
    code: AuthErrorCode;
    message?: string;
  } | null>(
    token
      ? null
      : {
          code: "TOKEN_MISSING",
          message: "Link xác minh không hợp lệ hoặc thiếu token.",
        }
  );

  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token || hasCalled.current) return;
    hasCalled.current = true;

    const verify = async () => {
      try {
        const result = await verifyEmailAction(token);
        if (result.success) {
          if (result.nextRoute) {
            setNextRoute(result.nextRoute);
          }
          setStatus("success");
        } else {
          setStatus("error");
          setErrorDetails({
            code: result.error || "SERVER_ERROR",
            message: result.serverMessage,
          });
        }
      } catch {
        setStatus("error");
        setErrorDetails({
          code: "NETWORK_ERROR",
        });
      }
    };

    verify();
  }, [token]);

  // Countdown and redirect effect
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push(nextRoute);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, router, nextRoute]);

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 shadow-[0_0_12px_var(--color-auth-accent-glow)]">
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
            Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
        </div>

        {/* Card Content */}
        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-auth-accent/20 bg-auth-accent-dim">
                <Loader2 className="h-6 w-6 animate-spin text-auth-accent" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                Đang xác minh email
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed">
                Hệ thống đang kiểm tra token xác minh của bạn. Vui lòng đợi trong giây lát...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-950/30">
                <CheckCircle2 className="h-6 w-6 text-brand-400" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                Xác minh thành công!
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed">
                Tài khoản của bạn đã được kích hoạt. Trình duyệt sẽ tự động chuyển hướng về trang Đăng nhập sau {countdown} giây.
              </p>
              <Link
                href="/login"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_oklch(0.72_0.11_145_/_0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_oklch(0.72_0.11_145_/_0.45)] 3xl:text-sm 3xl:py-3.5"
              >
                Đăng nhập ngay →
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-auth-error/20 bg-auth-error-dim">
                <AlertCircle className="h-6 w-6 text-auth-error" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                Xác minh thất bại
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed mb-2">
                Đã xảy ra lỗi trong quá trình xác minh tài khoản của bạn.
              </p>
              
              {errorDetails && (
                <div className="w-full text-left">
                  <AuthErrorAlert
                    code={errorDetails.code}
                    serverMessage={errorDetails.message}
                  />
                </div>
              )}

              <Link
                href="/login"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-auth-border bg-auth-elevated px-4 py-3 text-[13px] font-bold text-auth-text transition-all duration-200 hover:bg-auth-border active:scale-[0.98] 3xl:text-sm 3xl:py-3.5"
              >
                Quay lại Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
