import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";

/**
 * Login Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Đăng nhập — Pulse Knowledge",
  description:
    "Đăng nhập vào Pulse Knowledge — AI Researcher cá nhân hoá theo domain. Tích lũy knowledge, tự động research khi thiếu.",
  path: "/login",
});

/**
 * Login Page — Server Component shell.
 */
export default function LoginPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Đăng nhập — Pulse Knowledge",
    description:
      "Đăng nhập vào Pulse Knowledge để truy cập AI Researcher chuyên sâu theo lĩnh vực của bạn.",
    path: "/login",
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Left: Brand Panel */}
      <BrandPanel />

      {/* Right: Login Form */}
      <LoginForm />
    </>
  );
}
