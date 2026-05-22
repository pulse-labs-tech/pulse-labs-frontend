import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { QueryView } from "@/components/query/query-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.query.title} — Pulse Knowledge`,
    description: dict.query.startDesc || dict.query.subtitle,
    path: `/${locale}/query`,
  });
}

/**
 * Query Page — Server Component shell.
 */
export default async function QueryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.query.title} — Pulse Knowledge`,
    description: dict.query.startDesc || dict.query.subtitle,
    path: `/${locale}/query`,
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Query Layout */}
      <ProtectedRoute>
        <QueryView />
      </ProtectedRoute>
    </>
  );
}
