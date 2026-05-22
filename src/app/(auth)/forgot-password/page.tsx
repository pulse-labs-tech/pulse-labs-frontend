import Link from "next/link";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

/**
 * Forgot Password Page — Placeholder.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Quên mật khẩu — Pulse Knowledge",
  description: "Đặt lại mật khẩu tài khoản Pulse Knowledge.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return (
    <div className="col-span-full flex min-h-screen flex-col items-center justify-center bg-auth-bg px-6 text-center">
      <h1 className="text-2xl font-bold text-auth-text">Quên mật khẩu</h1>
      <p className="mt-2 text-sm text-auth-text-2">
        Trang đặt lại mật khẩu đang được phát triển.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] px-7 py-3 text-sm font-bold text-white shadow-[0_0_20px_oklch(0.72_0.11_145_/_0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_40px_oklch(0.72_0.11_145_/_0.5)] active:scale-95"
      >
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
