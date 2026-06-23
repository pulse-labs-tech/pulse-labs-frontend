"use client";

/**
 * Global loading UI — shown during Next.js route transitions.
 *
 * Design: Premium, minimalist loading interface with flat neutral colors.
 * Uses a central PulseLogo card and the DotMatrixLoader from the design system.
 */

import { PulseLogo } from "@/components/shared/pulse-logo";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-auth-bg"
      role="status"
      aria-label="Đang tải Pulse Knowledge"
    >
      {/* ── Ambient glow blobs (neutral, subtle) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255, 255, 255, 0.02) 0%, transparent 65%)",
        }}
      />

      {/* ── Dot grid background ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.015) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── Center Content ── */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Clean, premium container for the logo */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <PulseLogo size={40} className="text-white opacity-90" />
        </div>

        {/* Wordmark (white text, flat professional layout) */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <p className="text-lg font-bold tracking-tight text-white select-none">
            Pulse <span className="text-white/60 font-semibold">Knowledge</span>
          </p>
          <p className="text-[10px] font-medium tracking-[0.2em] text-white/35 uppercase select-none">
            AI Researcher
          </p>
        </div>

        {/* Premium Dot-matrix loader from library */}
        <div className="mt-4 text-white/50">
          <DotMatrixLoader variant="orbit" size="lg" />
        </div>
      </div>
    </div>
  );
}
