/**
 * Application-wide constants.
 */

/** Custom breakpoint values (must match Tailwind @theme config) */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
  "4xl": 2560,
  "5xl": 3840,
} as const;

/** Animation durations in milliseconds */
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

/** Max widths for container at each breakpoint */
export const CONTAINER_MAX_WIDTH = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
  "3xl": "1680px",
  "4xl": "2200px",
  "5xl": "3200px",
} as const;

/** Revalidation time for ISR (Incremental Static Regeneration) */
export const REVALIDATE_TIME = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  daily: 86400, // 24 hours
} as const;
