import Link from "next/link";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.auth.forgot.title} — Pulse Knowledge`,
    description: dict.auth.forgot.subtitle,
    path: `/${locale}/forgot-password`,
  });
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  // We show a clean message that it is under development in both languages.
  const isVi = locale === "vi";
  const devMessage = isVi
    ? "Trang đặt lại mật khẩu đang được phát triển."
    : "Password reset page is under development.";

  return (
    <div className="col-span-full flex min-h-screen flex-col items-center justify-center bg-auth-bg px-6 text-center">
      <h1 className="text-2xl font-bold text-auth-text">
        {dict.auth.forgot.title}
      </h1>
      <p className="mt-2 text-sm text-auth-text-2">
        {devMessage}
      </p>
      <Link
        href={`/${locale}/login`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-500)] px-7 py-3 text-sm font-bold text-white shadow-[0_0_20px_oklch(0.72_0.11_145_/_0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_40px_oklch(0.72_0.11_145_/_0.5)] active:scale-95"
      >
        ← {dict.auth.forgot.backToLogin}
      </Link>
    </div>
  );
}
