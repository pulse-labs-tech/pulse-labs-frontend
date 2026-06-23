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
        <linearGradient id={`${uid}-grad1`} x1="13" y1="9" x2="13" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#737373" />
        </linearGradient>
        <linearGradient id={`${uid}-grad2`} x1="13" y1="9" x2="35" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="oklch(0.65 0.13 160)" />
          <stop offset="100%" stopColor="oklch(0.50 0.13 160)" />
        </linearGradient>
      </defs>

      {/* Left Vertical Stem */}
      <path
        d="M 13 9 V 35"
        stroke={`url(#${uid}-grad1)`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Hexagonal Loop Bowl */}
      <path
        d="M 13 9 H 26.5 L 34.5 17 L 26.5 25 H 18.5"
        stroke={`url(#${uid}-grad2)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Floating Connection Node */}
      <circle cx="13" cy="25" r="2" fill="oklch(0.65 0.13 160)" />
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
