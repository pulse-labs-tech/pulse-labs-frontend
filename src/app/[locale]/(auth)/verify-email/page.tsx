import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.auth.verify.title} — Pulse Knowledge`,
    description: dict.auth.verify.subtitle,
    path: `/${locale}/verify-email`,
  });
}

function VerifyEmailFallback() {
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

        {/* Card Content Fallback */}
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-auth-accent/20 bg-auth-accent-dim">
              <Loader2 className="h-6 w-6 animate-spin text-auth-accent" />
            </div>
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl">
              Pulse Knowledge
            </h2>
            <p className="text-[13px] text-auth-text-2 max-w-[320px] leading-relaxed">
              Loading...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.auth.verify.title} — Pulse Knowledge`,
    description: dict.auth.verify.subtitle,
    path: `/${locale}/verify-email`,
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
      <BrandPanel locale={locale} />

      {/* Right: Verify Email Form (Wrapped in Suspense because of useSearchParams) */}
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailForm />
      </Suspense>
    </>
  );
}
