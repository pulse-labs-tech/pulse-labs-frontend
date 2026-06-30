import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { QueryApiDocsView } from "@/components/query/query-api-docs-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${locale === "vi" ? "Tài liệu API" : "Developer APIs"} — Pulse Knowledge`,
    description: "System integration API documentation",
    path: `/${locale}/query/api`,
  });
}

export default async function QueryApiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = generateWebPageJsonLd({
    title: `${locale === "vi" ? "Tài liệu API" : "Developer APIs"} — Pulse Knowledge`,
    description: "System integration API documentation",
    path: `/${locale}/query/api`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProtectedRoute>
        <QueryApiDocsView locale={locale} />
      </ProtectedRoute>
    </>
  );
}
