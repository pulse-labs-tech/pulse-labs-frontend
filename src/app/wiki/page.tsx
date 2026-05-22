import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WikiListView } from "@/components/wiki/wiki-list-view";

/**
 * Wiki Library Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Thư viện Wiki — Pulse Knowledge",
  description:
    "Khám phá toàn bộ kiến thức chuyên môn đã được biên soạn và lập chỉ mục trong thư viện Wiki cá nhân của bạn.",
  path: "/wiki",
});

/**
 * Wiki Page — Server Component shell.
 */
export default function WikiPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Thư viện Wiki — Pulse Knowledge",
    description: "Tra cứu toàn bộ concepts, tags và domain kiến thức trong knowledge base cá nhân.",
    path: "/wiki",
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
