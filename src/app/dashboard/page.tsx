import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardView } from "@/components/dashboard/dashboard-view";

/**
 * Dashboard Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Bảng điều khiển — Pulse Knowledge",
  description:
    "Bảng điều khiển Pulse Knowledge — quản lý Knowledge Base cá nhân, xem tiến trình nạp tài liệu và đặt câu hỏi AI.",
  path: "/dashboard",
});

/**
 * Dashboard Page — Server Component shell.
 */
export default function DashboardPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Bảng điều khiển — Pulse Knowledge",
    description: "Quản lý dữ liệu kiến thức chuyên môn cá nhân của bạn.",
    path: "/dashboard",
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Dashboard Layout */}
      <ProtectedRoute>
        <DashboardView />
      </ProtectedRoute>
    </>
  );
}
