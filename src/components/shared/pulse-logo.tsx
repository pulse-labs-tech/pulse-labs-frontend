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
        <linearGradient id={`${uid}-g`} x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.77 0.16 158)" />
          <stop offset="100%" stopColor="oklch(0.66 0.13 184)" />
        </linearGradient>
      </defs>

      <path
        d="M12 15.8C12 13.7 13.7 12 15.8 12h12.4c2.1 0 3.8 1.7 3.8 3.8v12.4c0 2.1-1.7 3.8-3.8 3.8H15.8C13.7 32 12 30.3 12 28.2V15.8Z"
        stroke={`url(#${uid}-g)`}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M17 23.5h4.2l2-5 2.6 7 2-4.2H32"
        stroke={`url(#${uid}-g)`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="17" cy="23.5" r="1.8" fill={`url(#${uid}-g)`} />
      <circle cx="32" cy="21.3" r="1.8" fill={`url(#${uid}-g)`} />
      <path d="M12 18.5h-3.5M35.5 25.5H32" stroke={`url(#${uid}-g)`} strokeWidth="2" strokeLinecap="round" opacity="0.72" />
    </svg>
  );
}

export function PulseWordmark({ className = "", compact = false }: PulseWordmarkProps) {
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap font-black tracking-[-0.035em] text-auth-text ${className}`}>
      <span>Pulse</span>
      {!compact && <span className="ml-0.5 text-[oklch(0.70_0.18_160)]">Knowledge</span>}
    </span>
  );
}
