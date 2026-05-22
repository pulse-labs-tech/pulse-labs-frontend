import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDictionary } from "@/dictionaries";

/**
 * Dashboard Page — SEO metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale);
  return generatePageMetadata({
    title: `${t.dashboard.title} — Pulse Knowledge`,
    description: t.dashboard.subtitle,
    path: `/${locale}/dashboard`,
  });
}

/**
 * Dashboard Page — Server Component shell.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${t.dashboard.title} — Pulse Knowledge`,
    description: t.dashboard.subtitle,
    path: `/${locale}/dashboard`,
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Dashboard Layout */}
      <ProtectedRoute>
        <DashboardView />
      </ProtectedRoute>
    </>
  );
}
