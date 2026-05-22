import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WikiListView } from "@/components/wiki/wiki-list-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.wiki.title} — Pulse Knowledge`,
    description: dict.wiki.subtitle || "Wiki library",
    path: `/${locale}/wiki`,
  });
}

/**
 * Wiki Page — Server Component shell.
 */
export default async function WikiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.wiki.title} — Pulse Knowledge`,
    description: dict.wiki.subtitle || "Wiki library",
    path: `/${locale}/wiki`,
  });

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Wiki Library */}
      <ProtectedRoute>
        <WikiListView />
      </ProtectedRoute>
    </>
  );
}
