import Link from "next/link";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

/**
 * Register Page — Placeholder.
 */
export const metadata: Metadata = generatePageMetadata({
  title: "Tạo tài khoản — Pulse Knowledge",
  description: "Đăng ký tài khoản Pulse Knowledge miễn phí.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <div className="col-span-full flex min-h-screen flex-col items-center justify-center bg-auth-bg px-6 text-center">
      <h1 className="text-2xl font-bold text-auth-text">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-auth-text-2">
        Trang đăng ký đang được phát triển.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-95"
      >
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
