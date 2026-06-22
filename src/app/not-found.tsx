import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";

/**
 * Custom 404 Not Found page.
 * Premium dark theme with floating logo animation, ambient glows, and staggered entrance.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-auth-bg px-5 text-auth-text">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[500px] w-[700px] -translate-x-1/2 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.72 0.11 145 / 0.10) 0%, transparent 70%)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-[50px] bottom-[20%] h-[350px] w-[350px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.68 0.18 280 / 0.06) 0%, transparent 70%)" }} aria-hidden="true" />

      <div className="relative flex max-w-lg flex-col items-center text-center">
        {/* Floating animated logo */}
        <div className="relative mb-6 animate-[float_3s_ease-in-out_infinite]">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-auth-elevated shadow-[0_0_30px_oklch(0.72_0.11_145_/_0.30)]">
            <PulseLogo size={42} />
          </div>
          {/* Shimmer ring */}
          <div className="absolute -inset-1 -z-10 rounded-[18px] bg-gradient-conic from-[var(--color-brand-400)]/30 via-transparent to-[var(--color-brand-400)]/30 animate-[spin_4s_linear_infinite] blur-[2px]" />
        </div>

        {/* Brand name */}
        <Link href="/" className="mb-8 text-sm font-bold tracking-tight opacity-70 transition-opacity hover:opacity-100 animate-[fadeUp_0.5s_ease-out_0.1s_both]">
          <PulseWordmark />
        </Link>

        {/* 404 number — large gradient with glow */}
        <div className="relative animate-[fadeUp_0.5s_ease-out_0.2s_both]">
          <p className="bg-gradient-to-b from-[var(--color-brand-400)] via-[var(--color-accent-300)] to-[var(--color-brand-400)]/20 bg-clip-text text-[10rem] font-black leading-none tracking-tighter text-transparent sm:text-[12rem]">
            404
          </p>
          <div className="pointer-events-none absolute inset-0 blur-[60px]" style={{ background: "radial-gradient(circle, oklch(0.72 0.11 145 / 0.12) 0%, transparent 60%)" }} aria-hidden="true" />
        </div>

        {/* Message */}
        <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl animate-[fadeUp_0.5s_ease-out_0.3s_both]">
          Trang không tồn tại
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-auth-text-2 animate-[fadeUp_0.5s_ease-out_0.4s_both]">
          Trang bạn đang tìm kiếm có thể đã được di chuyển, đổi tên, hoặc không tồn tại.
        </p>

        {/* Action buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row animate-[fadeUp_0.5s_ease-out_0.5s_both]">
          <Link href="/" className="btn-primary-pulse text-sm group">
            <LineIcon name="arrow-left" className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Về trang chủ
          </Link>
          <a href="mailto:support@pulseknowledge.com" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95">
            Liên hệ hỗ trợ
          </a>
        </div>

        {/* Search hint */}
        <div className="mt-12 w-full max-w-sm animate-[fadeUp_0.5s_ease-out_0.6s_both]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-xs text-auth-text-3">
              <LineIcon name="search" className="h-3.5 w-3.5 shrink-0" />
              <span>Thử tìm kiếm nội dung bạn cần từ trang chủ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
