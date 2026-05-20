import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/brand-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";

/**
 * Register Page — SEO metadata.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Tạo tài khoản — Pulse Knowledge",
  description:
    "Đăng ký tài khoản Pulse Knowledge miễn phí — AI Researcher cá nhân hoá theo domain. Bắt đầu ngay trong 30 giây.",
  path: "/register",
});

/**
 * Register Page — Server Component shell.
 * Same 2-panel layout as Login (BrandPanel left, Form right).
 */
export default function RegisterPage() {
  const jsonLd = generateWebPageJsonLd({
    title: "Tạo tài khoản — Pulse Knowledge",
    description:
      "Đăng ký tài khoản Pulse Knowledge miễn phí để truy cập AI Researcher chuyên sâu theo lĩnh vực của bạn.",
    path: "/register",
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

      {/* Right: Register Form */}
      <RegisterForm />
    </>
  );
}
