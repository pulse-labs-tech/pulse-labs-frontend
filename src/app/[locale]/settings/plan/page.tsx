import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SettingsView } from "@/components/settings/settings-view";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale);
  return generatePageMetadata({
    title: `${t.settings?.plan?.title ?? "Gói dịch vụ"} — Pulse Knowledge`,
    description: t.settings?.plan?.subtitle ?? "Xem gói dịch vụ hiện tại và hạn mức sử dụng.",
    path: `/${locale}/settings/plan`,
  });
}

/**
 * Settings/Plan Page — Focus on plan & quota section.
 * Reuses SettingsView with a section focus prop.
 */
export default async function SettingsPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <ProtectedRoute>
      <SettingsView initialSection="plan" />
    </ProtectedRoute>
  );
}
