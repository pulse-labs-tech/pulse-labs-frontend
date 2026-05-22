import { use } from "react";
import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WikiItemView } from "@/components/wiki/wiki-item-view";

/**
 * Wiki Item Detail Page — SEO metadata.
 * Static fallback metadata (dynamic title would require fetching from server).
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Chi tiết Wiki — Pulse Knowledge",
  description:
    "Xem chi tiết nội dung, tóm tắt, điểm then chốt và concepts của một mục wiki trong thư viện kiến thức cá nhân.",
  path: "/wiki/items",
});

/**
 * Wiki Item Page — Server Component shell.
 * Uses `use(params)` for Next.js 16 async params handling.
 */
export default function WikiItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const jsonLd = generateWebPageJsonLd({
    title: "Chi tiết Wiki — Pulse Knowledge",
    description: "Xem chi tiết nội dung và thông tin của một mục wiki trong knowledge base cá nhân.",
    path: `/wiki/items/${id}`,
  });

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Wiki Item Detail */}
      <ProtectedRoute>
        <WikiItemView id={id} />
      </ProtectedRoute>
    </>
  );
}
