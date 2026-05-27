"use client";

import { PulseLogo } from "@/components/shared/pulse-logo";

/**
 * AuthMobileHeader — Reusable header component for small/mobile screens.
 * Shows the unified Pulse logo and correctly styled PulseKnowledge brand name.
 * Rendered at the top of auth forms and fallbacks on mobile viewports.
 */
export function AuthMobileHeader() {
  return (
    <div className="mb-8 flex items-center gap-2.5 lg:hidden">
      <PulseLogo
        size={28}
        className="drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]"
      />
      <span className="text-sm font-bold tracking-tight text-auth-text">
        Pulse
        <span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">
          Knowledge
        </span>
      </span>
    </div>
  );
}
