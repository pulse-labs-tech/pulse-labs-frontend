import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

/**
 * Onboarding Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Thiết lập Knowledge Base — Pulse Knowledge",
  description:
    "Thiết lập Knowledge Base theo lĩnh vực chuyên môn của bạn để bắt đầu sử dụng Pulse Knowledge.",
  path: "/onboarding",
});

/**
 * Onboarding Page — Server Component shell.
 */
export default function OnboardingPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Thiết lập Knowledge Base — Pulse Knowledge",
    description:
      "Tạo lập môi trường làm việc thông minh và cá nhân hóa cho vai trò công việc của bạn.",
    path: "/onboarding",
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Protected Wizard Layout */}
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    </>
  );
}
