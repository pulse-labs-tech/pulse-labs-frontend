/**
 * Global loading UI — shown during route transitions.
 * Dark theme with emerald pulse animation.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg" role="status" aria-label="Đang tải">
      <div className="flex flex-col items-center gap-4">
        {/* Animated pulse logo */}
        <div className="relative">
          <div className="h-12 w-12 rounded-xl border border-emerald-400/20 bg-emerald-950/30 animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 rounded-xl bg-emerald-400/10 animate-ping" />
        </div>
        {/* Loading dots */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-auth-text-2">Đang tải</span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}
