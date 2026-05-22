import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CompileView } from "@/components/compile/compile-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.compile.labels.headerTitleNew} — Pulse Knowledge`,
    description: dict.compile.labels.headerDesc,
    path: `/${locale}/compile/new`,
    noIndex: true,
  });
}

/**
 * Compile New Page — Server Component shell.
 * Wraps CompileView in ProtectedRoute for auth guard.
 */
export default async function CompileNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.compile.labels.headerTitleNew} — Pulse Knowledge`,
    description: dict.compile.labels.headerDesc,
    path: `/${locale}/compile/new`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProtectedRoute>
        <CompileView />
      </ProtectedRoute>
    </>
  );
}
