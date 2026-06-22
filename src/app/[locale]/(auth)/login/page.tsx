import type { Metadata } from "next";
import { Suspense } from "react";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { getDictionary } from "@/dictionaries";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.auth.login.title} — Pulse Knowledge`,
    description: dict.auth.login.subtitle,
    path: `/${locale}/login`,
  });
}

function LoginFallback() {
  return (
    <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-auth-surface px-6 py-12 sm:px-10 lg:px-14 xl:px-16 3xl:px-20">
      <div className="w-full max-w-[380px] 3xl:max-w-[420px] 4xl:max-w-[460px]">
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[0_0_12px_oklch(0.72_0.11_145_/_0.3)]">
              <PulseLogo size={20} className="drop-shadow-[0_0_6px_var(--color-auth-accent-glow)]" />
            </div>
          <PulseWordmark className="text-sm" />
        </div>

        {/* Form header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-auth-text 3xl:text-2xl 4xl:text-[28px]">
            Pulse Knowledge
          </h2>
          <p className="text-[13px] text-auth-text-2 3xl:text-sm">
            Loading...
          </p>
        </div>
        <div className="flex justify-center py-12">
          <DotMatrixLoader variant="orbit" size="lg" />
        </div>
      </div>
    </div>
  );
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.auth.login.title} — Pulse Knowledge`,
    description: dict.auth.login.subtitle,
    path: `/${locale}/login`,
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

      {/* Right: Login Form */}
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
