import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/brand-panel";
import { RegisterForm } from "@/components/auth/register-form";
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
    title: `${dict.auth.register.title} — Pulse Knowledge`,
    description: dict.auth.register.subtitle,
    path: `/${locale}/register`,
  });
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.auth.register.title} — Pulse Knowledge`,
    description: dict.auth.register.subtitle,
    path: `/${locale}/register`,
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

      {/* Right: Register Form */}
      <RegisterForm />
    </>
  );
}
