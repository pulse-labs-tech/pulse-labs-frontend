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
        <linearGradient id={`${uid}-g1`} x1="22" y1="6" x2="22" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="oklch(0.80 0.005 260)" />
          <stop offset="100%" stopColor="oklch(0.65 0.13 160)" />
        </linearGradient>
        <linearGradient id={`${uid}-g2`} x1="12" y1="12" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.65 0.13 160)" />
          <stop offset="100%" stopColor="oklch(0.65 0.13 160 / 0.12)" />
        </linearGradient>
      </defs>

      {/* Outer elegant pulse ring (broken loop representing infinite flow) */}
      <path
        d="M 22 6 A 16 16 0 1 1 11 11"
        stroke={`url(#${uid}-g1)`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Secondary overlapping wave arc that loops inwards */}
      <path
        d="M 12 18 C 16 12, 28 12, 32 20 C 36 28, 24 36, 18 30 C 14 26, 16 20, 22 20 C 26 20, 28 24, 26 28"
        stroke={`url(#${uid}-g2)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Central bright core node representing Knowledge */}
      <circle cx="22" cy="20" r="2.5" fill="#ffffff" />
      
      {/* Accent pulse spark representing Pulse */}
      <circle cx="26" cy="28" r="1.5" fill="oklch(0.65 0.13 160)" />
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
