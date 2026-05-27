"use client";

/**
 * Pulse Icons — Custom SVG icon system for Pulse Knowledge.
 *
 * Inspired by TheSVG.org's clean, consistent brand SVGs.
 * All icons: viewBox="0 0 24 24", fill="none", stroke="currentColor", strokeWidth=1.5
 * Consistent rounded line-caps and line-joins.
 * Color inherits from parent via currentColor.
 */

import { memo } from "react";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type PulseIconName =
  | "dashboard"
  | "query"
  | "research"
  | "wiki"
  | "compile"
  | "settings"
  | "brain"
  | "chart"
  | "shield"
  | "rocket"
  | "star"
  | "globe"
  | "user"
  | "bolt"
  | "search"
  | "add"
  | "home";

export type PulseIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface PulseIconProps {
  /** Icon name */
  name: PulseIconName;
  /** Size preset. Default: "md" */
  size?: PulseIconSize;
  /** Additional CSS classes */
  className?: string;
  /** Accessible title */
  title?: string;
}

const SIZE_MAP: Record<PulseIconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export const PulseIcon = memo(function PulseIcon({
  name,
  size = "md",
  className = "",
  title,
}: PulseIconProps) {
  const px = SIZE_MAP[size];
  const path = ICON_PATHS[name];

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pulse-icon shrink-0 ${className}`}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
});

// ────────────────────────────────────────────────────────────────
// Icon Paths — Each icon is a JSX fragment of SVG elements
// ────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<PulseIconName, React.ReactNode> = {
  // Dashboard — 4-quadrant grid with pulse line through center
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M1 12h3l2-3 2 6 2-4 2 2h3" strokeWidth={1.2} opacity={0.5} />
    </>
  ),

  // Query — Chat bubble with dot-matrix dots inside
  query: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),

  // Research — Magnifying glass with data nodes
  research: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
      <circle cx="9" cy="9" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="9" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="11" cy="13" r="0.7" fill="currentColor" stroke="none" />
      <path d="M9 9l2 4M13 9l-2 4" strokeWidth={0.8} opacity={0.4} />
    </>
  ),

  // Wiki — Open book with knowledge graph lines
  wiki: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      <circle cx="6" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),

  // Compile — Stacked layers with arrow assembling
  compile: (
    <>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" opacity={0.6} />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" opacity={0.35} />
    </>
  ),

  // Settings — Gear with inner dot pattern
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  // Brain — Brain outline with circuit paths
  brain: (
    <>
      <path d="M12 2a5 5 0 0 0-4.58 3A5 5 0 0 0 3 10a5 5 0 0 0 2.06 4.04A4 4 0 0 0 5 16a4 4 0 0 0 4 4h1v-7" />
      <path d="M12 2a5 5 0 0 1 4.58 3A5 5 0 0 1 21 10a5 5 0 0 1-2.06 4.04A4 4 0 0 1 19 16a4 4 0 0 1-4 4h-1v-7" />
      <circle cx="10" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),

  // Chart — Bar chart with ascending trend
  chart: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="13" width="3" height="8" rx="0.5" fill="currentColor" opacity={0.2} stroke="none" />
      <rect x="12" y="9" width="3" height="12" rx="0.5" fill="currentColor" opacity={0.35} stroke="none" />
      <rect x="17" y="5" width="3" height="16" rx="0.5" fill="currentColor" opacity={0.5} stroke="none" />
      <path d="M7 12l5-4 5-3" strokeWidth={1.5} />
    </>
  ),

  // Shield — Shield with checkmark
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),

  // Rocket — Rocket with trailing dots
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      <circle cx="4" cy="20" r="0.5" fill="currentColor" stroke="none" opacity={0.3} />
      <circle cx="3" cy="18" r="0.4" fill="currentColor" stroke="none" opacity={0.2} />
    </>
  ),

  // Star — Star with radiating dots
  star: (
    <>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      <circle cx="12" cy="1" r="0.4" fill="currentColor" stroke="none" opacity={0.3} />
      <circle cx="23" cy="9" r="0.4" fill="currentColor" stroke="none" opacity={0.3} />
      <circle cx="1" cy="9" r="0.4" fill="currentColor" stroke="none" opacity={0.3} />
    </>
  ),

  // Globe — Globe with latitude dots
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <circle cx="6" cy="7" r="0.5" fill="currentColor" stroke="none" opacity={0.25} />
      <circle cx="18" cy="7" r="0.5" fill="currentColor" stroke="none" opacity={0.25} />
      <circle cx="6" cy="17" r="0.5" fill="currentColor" stroke="none" opacity={0.25} />
      <circle cx="18" cy="17" r="0.5" fill="currentColor" stroke="none" opacity={0.25} />
    </>
  ),

  // User — User silhouette with pulse ring
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),

  // Bolt — Lightning bolt (replaces all inline lightning bolt SVGs)
  bolt: (
    <>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity={0.1} />
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </>
  ),

  // Search — Search lens with dot-matrix grid
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <circle cx="8" cy="8.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
      <circle cx="11" cy="8.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
      <circle cx="14" cy="8.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
      <circle cx="11" cy="11.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
      <circle cx="14" cy="11.5" r="0.5" fill="currentColor" stroke="none" opacity={0.2} />
    </>
  ),

  // Add — Plus with decorative dots
  add: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </>
  ),

  // Home — House with pulse window
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
      <circle cx="12" cy="7" r="0.6" fill="currentColor" stroke="none" opacity={0.35} />
    </>
  ),
};
