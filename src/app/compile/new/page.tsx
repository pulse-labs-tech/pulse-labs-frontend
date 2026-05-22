import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CompileView } from "@/components/compile/compile-view";

/**
 * Compile New Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Nạp nguồn tài liệu mới — Pulse Knowledge",
  description:
    "Trích xuất tri thức từ văn bản, URL hoặc tệp tải lên thành Wiki item có cấu trúc trong Knowledge Base cá nhân của bạn.",
  path: "/compile/new",
  noIndex: true,
});

/**
 * Compile New Page — Server Component shell.
 * Wraps CompileView in ProtectedRoute for auth guard.
 */
export default function CompileNewPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Nạp nguồn tài liệu mới — Pulse Knowledge",
    description: "Trích xuất tri thức từ văn bản, URL thành Wiki item có cấu trúc.",
    path: "/compile/new",
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
