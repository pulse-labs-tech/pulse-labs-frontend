"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Global error boundary.
 * Premium dark theme matching the app's design system.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-auth-bg px-5 text-auth-text">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[400px] w-[500px] -translate-x-1/2 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.63 0.24 25 / 0.08) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative flex max-w-md flex-col items-center text-center">
        {/* Error icon — glowing red badge */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/30">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Đã xảy ra lỗi
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-auth-text-2">
          Có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.
        </p>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-5 max-w-full overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs text-auth-text-3">
            {error.message}
          </pre>
        )}

        <button
          onClick={reset}
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-95"
        >
          <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
          Thử lại
        </button>
      </div>
    </div>
  );
}
