import type { Metadata } from "next";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getDictionary } from "@/dictionaries";

/**
 * Onboarding Page — SEO metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    title: `${locale === "vi" ? "Thiết lập Knowledge Base" : "Setup Knowledge Base"} — Pulse Knowledge`,
    description: locale === "vi"
      ? "Thiết lập Knowledge Base theo lĩnh vực chuyên môn của bạn để bắt đầu sử dụng Pulse Knowledge."
      : "Configure your Knowledge Base based on your professional field to start using Pulse Knowledge.",
    path: `/${locale}/onboarding`,
  });
}

/**
 * Onboarding Page — Server Component shell.
 */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = generateWebPageJsonLd({
    title: `${locale === "vi" ? "Thiết lập Knowledge Base" : "Setup Knowledge Base"} — Pulse Knowledge`,
    description: locale === "vi"
      ? "Tạo lập môi trường làm việc thông minh và cá nhân hóa cho vai trò công việc của bạn."
      : "Create an intelligent and personalized workspace for your professional role.",
    path: `/${locale}/onboarding`,
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
