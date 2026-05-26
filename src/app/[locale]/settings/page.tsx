import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SettingsView } from "@/components/settings/settings-view";
import { getDictionary } from "@/dictionaries";

/**
 * Settings Page — SEO metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale);
  return generatePageMetadata({
    title: `${t.settings?.title ?? "Cài đặt"} — Pulse Knowledge`,
    description: t.settings?.subtitle ?? "Quản lý tài khoản, gói dịch vụ và hạn mức sử dụng.",
    path: `/${locale}/settings`,
  });
}

/**
 * Settings Page — Server Component shell.
 * Route guard: authenticated + email verified + onboarding completed.
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${t.settings?.title ?? "Cài đặt"} — Pulse Knowledge`,
    description: t.settings?.subtitle ?? "Quản lý tài khoản, gói dịch vụ và hạn mức sử dụng.",
    path: `/${locale}/settings`,
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Settings Layout */}
      <ProtectedRoute>
        <SettingsView />
      </ProtectedRoute>
    </>
  );
}
