import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";

/**
 * Login Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Đăng nhập — Pulse Knowledge",
  description:
    "Đăng nhập vào Pulse Knowledge — AI Researcher cá nhân hoá theo domain. Tích lũy knowledge, tự động research khi thiếu.",
  path: "/login",
});

function LoginFallback() {
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
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]">
            Đăng nhập
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            Đang tải trang đăng nhập...
          </p>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-auth-accent" />
        </div>
      </div>
    </div>
  );
}

/**
 * Login Page — Server Component shell.
 */
export default function LoginPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Đăng nhập — Pulse Knowledge",
    description:
      "Đăng nhập vào Pulse Knowledge để truy cập AI Researcher chuyên sâu theo lĩnh vực của bạn.",
    path: "/login",
  });

  return (
    <>
      {/* JSON-LD (hidden to prevent grid item displacement) */}
      <div className="hidden" aria-hidden="true">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>

      {/* Left: Brand Panel */}
      <BrandPanel />

      {/* Right: Login Form */}
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
