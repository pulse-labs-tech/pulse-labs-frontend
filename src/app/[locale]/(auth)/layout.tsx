import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Auth Route Group Layout.
 * Provides the split two-panel layout for all auth pages.
 * Does NOT inherit the main app's header/footer.
 */

export const metadata: Metadata = {
  title: {
    default: `Đăng nhập — ${siteConfig.name}`,
    template: `%s — ${siteConfig.name}`,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {children}
    </div>
  );
}
