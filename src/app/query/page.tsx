import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { QueryView } from "@/components/query/query-view";

/**
 * Query (AI Q&A) Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Hỏi đáp AI — Pulse Knowledge",
  description:
    "Đặt câu hỏi dựa trên Knowledge Base cá nhân của bạn. Pulse Knowledge AI trả lời có trích dẫn nguồn minh bạch từ tài liệu đã nạp.",
  path: "/query",
});

/**
 * Query Page — Server Component shell.
 */
export default function QueryPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Hỏi đáp AI — Pulse Knowledge",
    description:
      "Đặt câu hỏi cho AI dựa trên Knowledge Base cá nhân với trích dẫn nguồn minh bạch.",
    path: "/query",
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
