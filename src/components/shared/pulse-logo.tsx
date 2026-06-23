import { useId } from "react";

interface PulseLogoProps {
  size?: number;
  className?: string;
}

interface PulseWordmarkProps {
  className?: string;
  compact?: boolean;
}

export function PulseLogo({ size = 40, className = "" }: PulseLogoProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-g1`} x1="12" y1="8" x2="28" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="oklch(0.82 0.002 260)" />
          <stop offset="100%" stopColor="oklch(0.65 0.13 160)" />
        </linearGradient>
        <linearGradient id={`${uid}-g2`} x1="12" y1="17" x2="32" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.65 0.13 160)" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Main letter P stem and bowl loop */}
      <path
        d="M 13 36 V 10 C 13 10, 29 8, 29 17 C 29 26, 13 24, 13 24"
        stroke={`url(#${uid}-g1)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Heartbeat pulse wave running through the center of the P bowl */}
      <path
        d="M 13 17 H 16.5 L 19.5 10 L 22.5 24 L 25.5 14 L 28.5 17 H 32.5"
        stroke={`url(#${uid}-g2)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing connection nodes */}
      <circle cx="19.5" cy="10" r="1.2" fill="#ffffff" />
      <circle cx="22.5" cy="24" r="1.2" fill="oklch(0.65 0.13 160)" />
      <circle cx="32.5" cy="17" r="1.5" fill="#ffffff" />
    </svg>
  );
}

export function PulseWordmark({ className = "", compact = false }: PulseWordmarkProps) {
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap font-sans font-black tracking-[-0.035em] text-white ${className}`}>
      <span className="text-white">Pulse</span>
      {!compact && <span className="ml-1 font-semibold text-auth-text-2">Knowledge</span>}
    </span>
  );
}
