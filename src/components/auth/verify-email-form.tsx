"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { verifyEmailAction } from "@/app/actions/auth";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import type { AuthErrorCode } from "@/types/auth";
import { useTranslation } from "@/contexts/locale-context";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { getLocalizedPath } from "@/lib/utils";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { t, locale } = useTranslation();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [countdown, setCountdown] = useState(3);
  const [nextRoute, setNextRoute] = useState(`/${locale}/login`);
  const [errorDetails, setErrorDetails] = useState<{
    code: AuthErrorCode;
    message?: string;
  } | null>(
    token
      ? null
      : {
          code: "TOKEN_MISSING",
          message: t("auth.errors.TOKEN_MISSING"),
        }
  );

  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token || hasCalled.current) return;
    hasCalled.current = true;

    const verify = async () => {
      try {
        const result = await verifyEmailAction(token);
        console.log("🟢 [F12 API RESPONSE] verifyEmailAction:", result);
        if (result.success) {
          if (result.nextRoute) {
            setNextRoute(getLocalizedPath(result.nextRoute, locale));
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
  }, [token, locale]);

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
              <PulseLogo size={20} className="drop-shadow-[0_0_6px_var(--color-auth-accent-glow)]" />
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
                <DotMatrixLoader variant="ripple" size="md" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                {t("auth.verify.verifyingTitle")}
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed">
                {t("auth.verify.verifyingSubtitle")}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-950/30">
                <LineIcon name="checkmark-circle" className="h-6 w-6 text-brand-400" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                {t("auth.verify.successTitle")}
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed">
                {t("auth.verify.successSubtitle").replace("{countdown}", countdown.toString())}
              </p>
              <Link
                href={`/${locale}/login`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_oklch(0.72_0.11_145_/_0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_oklch(0.72_0.11_145_/_0.45)] 3xl:text-sm 3xl:py-3.5"
              >
                {t("auth.verify.successButton")}
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-auth-error/20 bg-auth-error-dim">
                <LineIcon name="warning" className="h-6 w-6 text-auth-error" />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
                {t("auth.verify.failedTitle")}
              </h2>
              <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed mb-2">
                {t("auth.verify.failedSubtitle")}
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
                href={`/${locale}/login`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-auth-border bg-auth-elevated px-4 py-3 text-[13px] font-bold text-auth-text transition-all duration-200 hover:bg-auth-border active:scale-[0.98] 3xl:text-sm 3xl:py-3.5"
              >
                {t("auth.verify.failedButton")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
