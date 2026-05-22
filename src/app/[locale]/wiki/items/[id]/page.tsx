import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WikiItemView } from "@/components/wiki/wiki-item-view";
import { getDictionary } from "@/dictionaries";
import { getWikiItemAction } from "@/app/actions/wiki";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const dict = await getDictionary(locale);
  try {
    const response = await getWikiItemAction(id);
    if (response.status === "1" && response.data?.item) {
      return generatePageMetadata({
        title: `${response.data.item.title} — Pulse Knowledge`,
        description: response.data.item.summary || dict.wiki.detail.loadErrorDesc,
        path: `/${locale}/wiki/items/${id}`,
      });
    }
  } catch (err) {
    console.error("Failed to fetch wiki item metadata:", err);
  }

  return generatePageMetadata({
    title: `${dict.wiki.detail.itemNotFound || "Chi tiết Wiki"} — Pulse Knowledge`,
    description: dict.wiki.detail.loadErrorDesc || "Xem chi tiết nội dung mục wiki.",
    path: `/${locale}/wiki/items/${id}`,
  });
}

/**
 * Wiki Item Page — Server Component shell.
 */
export default async function WikiItemPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const dict = await getDictionary(locale);
  
  let pageTitle = dict.wiki.detail.itemNotFound || "Chi tiết Wiki";
  let pageDesc = dict.wiki.detail.loadErrorDesc || "Xem chi tiết nội dung mục wiki.";
  
  try {
    const response = await getWikiItemAction(id);
    if (response.status === "1" && response.data?.item) {
      pageTitle = response.data.item.title;
      pageDesc = response.data.item.summary || pageDesc;
    }
  } catch (err) {
    console.error("Failed to fetch wiki item for JSON-LD:", err);
  }

  const jsonLd = generateWebPageJsonLd({
    title: `${pageTitle} — Pulse Knowledge`,
    description: pageDesc,
    path: `/${locale}/wiki/items/${id}`,
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
