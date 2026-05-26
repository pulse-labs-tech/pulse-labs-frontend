import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ResearchView } from "@/components/research/research-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale);
  return generatePageMetadata({
    title: `${t.research?.title ?? "Nghiên cứu AI"} — Pulse Knowledge`,
    description: t.research?.subtitle ?? "Nghiên cứu chuyên sâu có nguồn gốc từ tài liệu và web.",
    path: `/${locale}/research`,
  });
}

/**
 * Research Page — List & create research runs.
 */
export default async function ResearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${t.research?.title ?? "Nghiên cứu AI"} — Pulse Knowledge`,
    description: t.research?.subtitle ?? "Nghiên cứu chuyên sâu có nguồn gốc từ tài liệu và web.",
    path: `/${locale}/research`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProtectedRoute>
        <ResearchView />
      </ProtectedRoute>
    </>
  );
}
