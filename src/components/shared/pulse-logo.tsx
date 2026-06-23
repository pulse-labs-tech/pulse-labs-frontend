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
        {/* Emerald → Teal icon gradient */}
        <linearGradient id={`${uid}-g`} x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>

        {/* Soft glow for the waveform */}
        <filter id={`${uid}-glow`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Book icon (open book, viewed from above) ── */}
      {/* Left page */}
      <path
        d="M7 13 C7 12 8 11.5 9 11.5 C13 11.5 17 12 20.5 14 L20.5 32 C17 30.5 13 30 9 30 C8 30 7 29.5 7 28.5 Z"
        stroke={`url(#${uid}-g)`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right page */}
      <path
        d="M37 13 C37 12 36 11.5 35 11.5 C31 11.5 27 12 23.5 14 L23.5 32 C27 30.5 31 30 35 30 C36 30 37 29.5 37 28.5 Z"
        stroke={`url(#${uid}-g)`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Spine / center line */}
      <line x1="22" y1="14" x2="22" y2="32" stroke={`url(#${uid}-g)`} strokeWidth="1.5" strokeLinecap="round" />

      {/* ── ECG / Pulse waveform across the book's middle ── */}
      <path
        d="M7 22 L13 22 L15.5 17.5 L18.5 26.5 L20.5 20.5 L22 23.5 L23.5 20.5 L25.5 26.5 L28.5 17.5 L31 22 L37 22"
        stroke={`url(#${uid}-g)`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${uid}-glow)`}
      />
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
