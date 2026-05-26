import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SettingsView } from "@/components/settings/settings-view";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Nâng cấp Pro — Pulse Knowledge",
    description: "Đăng ký nâng cấp lên gói Pro để mở khoá thêm tính năng.",
    path: "/settings/plan/upgrade",
  });
}

/**
 * Settings/Plan/Upgrade Page — Upgrade intent placeholder.
 * MVP: Records intent, does NOT activate Pro entitlements.
 */
export default async function SettingsPlanUpgradePage() {
  return (
    <ProtectedRoute>
      <SettingsView initialSection="upgrade" />
    </ProtectedRoute>
  );
}
