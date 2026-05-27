/**
 * Global loading UI — shown during Next.js route transitions.
 *
 * Design: Full-screen dark splash with dot-matrix grid animation,
 * Pulse logo, shimmer wordmark, and a dot-matrix progress indicator.
 * Inspired by dotmatrix.zzzzshawn.cloud + pixelpoint.io aesthetic.
 */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-auth-bg"
      role="status"
      aria-label="Đang tải Pulse Knowledge"
    >
      {/* ── Ambient glow blobs ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.72 0.11 145 / 0.18) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[15%] top-[20%] h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.14 195 / 0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── Dot grid background ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── Centre content ── */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo icon with dot-matrix orbital animation */}
        <div className="relative flex items-center justify-center">
          {/* Dot-matrix orbit ring (outer) */}
          <svg
            aria-hidden="true"
            className="absolute"
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ animation: "loading-orbit 6s linear infinite" }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const cx = 60 + Math.cos(angle) * 52;
              const cy = 60 + Math.sin(angle) * 52;
              const opacity = 0.15 + (i / 12) * 0.6;
              return (
                <circle
                  key={`o-${i}`}
                  cx={cx}
                  cy={cy}
                  r={2}
                  fill="var(--color-brand-400)"
                  opacity={opacity}
                />
              );
            })}
          </svg>

          {/* Dot-matrix orbit ring (inner, counter-rotate) */}
          <svg
            aria-hidden="true"
            className="absolute"
            width="88"
            height="88"
            viewBox="0 0 88 88"
            style={{ animation: "loading-orbit-rev 4.5s linear infinite" }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const cx = 44 + Math.cos(angle) * 36;
              const cy = 44 + Math.sin(angle) * 36;
              const opacity = 0.1 + (i / 8) * 0.5;
              return (
                <circle
                  key={`i-${i}`}
                  cx={cx}
                  cy={cy}
                  r={1.5}
                  fill="var(--color-accent-400)"
                  opacity={opacity}
                />
              );
            })}
          </svg>

          {/* Pulsing glow disc */}
          <div
            aria-hidden="true"
            className="absolute h-16 w-16 rounded-full bg-[var(--color-brand-500)]/10"
            style={{ animation: "loading-glow-pulse 2s ease-in-out infinite" }}
          />

          {/* Icon container — Pulse Logo */}
          <div
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.16 0.008 260) 0%, oklch(0.20 0.01 200) 100%)",
              boxShadow:
                "0 8px 32px oklch(0 0 0 / 0.6), 0 0 40px oklch(0.72 0.11 145 / 0.2)",
              animation:
                "loading-icon-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="ll-g" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--color-brand-400)" />
                  <stop offset="100%" stopColor="var(--color-accent-400)" />
                </linearGradient>
                <filter id="ll-glow" x="-30%" y="-60%" width="160%" height="220%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Left page */}
              <path
                d="M7 13 C7 12 8 11.5 9 11.5 C13 11.5 17 12 20.5 14 L20.5 32 C17 30.5 13 30 9 30 C8 30 7 29.5 7 28.5 Z"
                stroke="url(#ll-g)"
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Right page */}
              <path
                d="M37 13 C37 12 36 11.5 35 11.5 C31 11.5 27 12 23.5 14 L23.5 32 C27 30.5 31 30 35 30 C36 30 37 29.5 37 28.5 Z"
                stroke="url(#ll-g)"
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Spine */}
              <line
                x1="22" y1="14" x2="22" y2="32"
                stroke="url(#ll-g)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* ECG Waveform — animated draw-on */}
              <path
                d="M7 22 L13 22 L15.5 17.5 L18.5 26.5 L20.5 20.5 L22 23.5 L23.5 20.5 L25.5 26.5 L28.5 17.5 L31 22 L37 22"
                stroke="url(#ll-g)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                filter="url(#ll-glow)"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: 100,
                  animation: "waveform-draw 1.2s ease-out 0.4s forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div
          className="flex flex-col items-center gap-1"
          style={{ animation: "loading-text-appear 0.7s ease-out 0.3s both" }}
        >
          <p className="text-xl font-bold tracking-tight text-white">
            Pulse
            <span
              style={{
                background: "linear-gradient(90deg, var(--color-brand-400), var(--color-accent-400), var(--color-brand-400))",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "text-shimmer 2.5s linear infinite",
              }}
            >
              Knowledge
            </span>
          </p>
          <p className="text-xs font-medium tracking-[0.15em] text-[var(--color-brand-400)]/60 uppercase">
            AI Researcher cá nhân hoá
          </p>
        </div>

        {/* Dot-matrix progress indicator (replaces solid progress bar) */}
        <div
          className="flex items-center gap-1.5"
          style={{ animation: "loading-text-appear 0.5s ease-out 0.5s both" }}
          aria-hidden="true"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "4px",
                height: "4px",
                backgroundColor: "var(--color-brand-400)",
                opacity: 0.15,
                animation: `dotm-progress-dot 1.8s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Keyframe animations (scoped inline) ── */}
      <style>{`
        @keyframes loading-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes loading-orbit-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes loading-glow-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%       { transform: scale(1.6); opacity: 0; }
        }
        @keyframes loading-icon-appear {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes loading-text-appear {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveform-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes text-shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes dotm-progress-dot {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
