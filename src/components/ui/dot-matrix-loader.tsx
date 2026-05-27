"use client";

/**
 * DotMatrix Loader — Premium loading animations inspired by dotmatrix.zzzzshawn.cloud
 *
 * Pure CSS animations, no external dependencies. Uses currentColor for theming.
 * Designed to replace all Loader2 + animate-spin instances across the app.
 *
 * Variants:
 *  - pulse:   3×3 dot grid with sequential fade-pulse (buttons, inline)
 *  - wave:    5-dot horizontal with wave bounce (text/content loading)
 *  - orbit:   Dots orbiting a center dot (page/section loading)
 *  - grid:    4×4 dot grid with cascade fade (full-screen loading)
 *  - ripple:  Concentric dot rings expanding (auth/transition)
 *  - breathe: Single dot with glow pulse (subtle background activity)
 */

import { memo } from "react";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type DotMatrixVariant = "pulse" | "wave" | "orbit" | "grid" | "ripple" | "breathe";
export type DotMatrixSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface DotMatrixLoaderProps {
  /** Animation variant. Default: "pulse" */
  variant?: DotMatrixVariant;
  /** Size preset. Default: "sm" */
  size?: DotMatrixSize;
  /** CSS color override (defaults to currentColor) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

// ────────────────────────────────────────────────────────────────
// Size mappings (px) — matches existing Loader2 size ranges
// ────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<DotMatrixSize, number> = {
  xs: 14,  // h-3.5 w-3.5 (buttons, badges)
  sm: 18,  // h-4 w-4 / h-5 w-5 (inline actions)
  md: 24,  // h-6 w-6 (form submissions)
  lg: 32,  // h-7/h-8 (page transitions, auth)
  xl: 40,  // h-10 (full-screen loading)
};

// Dot radius relative to container size
const DOT_R: Record<DotMatrixSize, number> = {
  xs: 1.2,
  sm: 1.4,
  md: 1.8,
  lg: 2.2,
  xl: 2.6,
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export const DotMatrixLoader = memo(function DotMatrixLoader({
  variant = "pulse",
  size = "sm",
  color,
  className = "",
  label = "Đang tải",
}: DotMatrixLoaderProps) {
  const px = SIZE_MAP[size];
  const r = DOT_R[size];
  const fill = color || "currentColor";

  return (
    <span
      role="status"
      aria-label={label}
      className={`dotm-loader inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox={`0 0 ${px} ${px}`}
        width={px}
        height={px}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="dotm-svg"
      >
        {variant === "pulse" && <PulseDots cx={px / 2} cy={px / 2} r={r} fill={fill} size={px} />}
        {variant === "wave" && <WaveDots cx={px / 2} cy={px / 2} r={r} fill={fill} size={px} />}
        {variant === "orbit" && <OrbitDots cx={px / 2} cy={px / 2} r={r} fill={fill} size={px} />}
        {variant === "grid" && <GridDots cx={px / 2} cy={px / 2} r={r} fill={fill} size={px} />}
        {variant === "ripple" && <RippleDots cx={px / 2} cy={px / 2} r={r} fill={fill} size={px} />}
        {variant === "breathe" && <BreatheDot cx={px / 2} cy={px / 2} r={r} fill={fill} />}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
});

// ────────────────────────────────────────────────────────────────
// Variant: Pulse (3×3 grid)
// ────────────────────────────────────────────────────────────────

function PulseDots({ cx, cy, r, fill, size }: DotProps) {
  const gap = size * 0.28;
  const positions = [-1, 0, 1];
  let idx = 0;

  return (
    <g>
      {positions.map((row) =>
        positions.map((col) => {
          const delay = (idx++) * 0.12;
          return (
            <circle
              key={`${row}-${col}`}
              cx={cx + col * gap}
              cy={cy + row * gap}
              r={r}
              fill={fill}
              opacity={0.15}
            >
              <animate
                attributeName="opacity"
                values="0.15;1;0.15"
                dur="1.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values={`${r};${r * 1.3};${r}`}
                dur="1.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        }),
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant: Wave (5 horizontal dots with bounce)
// ────────────────────────────────────────────────────────────────

function WaveDots({ cx, cy, r, fill, size }: DotProps) {
  const gap = size * 0.2;
  const dots = [-2, -1, 0, 1, 2];
  const amplitude = size * 0.2;

  return (
    <g>
      {dots.map((i) => {
        const delay = (i + 2) * 0.1;
        return (
          <circle key={i} cx={cx + i * gap} cy={cy} r={r} fill={fill} opacity={0.3}>
            <animate
              attributeName="cy"
              values={`${cy};${cy - amplitude};${cy}`}
              dur="1s"
              begin={`${delay}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant: Orbit (dots orbiting center)
// ────────────────────────────────────────────────────────────────

function OrbitDots({ cx, cy, r, fill, size }: DotProps) {
  const orbitR = size * 0.32;
  const dotCount = 6;

  return (
    <g>
      {/* Center dot — subtle pulse */}
      <circle cx={cx} cy={cy} r={r * 1.1} fill={fill} opacity={0.4}>
        <animate
          attributeName="opacity"
          values="0.4;0.8;0.4"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Orbiting dots */}
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 360;
        const delay = (i / dotCount) * -1.5; // negative = stagger
        const dotOpacity = 1 - (i / dotCount) * 0.6;

        return (
          <circle
            key={i}
            cx={cx + orbitR}
            cy={cy}
            r={r * (1 - i * 0.08)}
            fill={fill}
            opacity={dotOpacity}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`${angle} ${cx} ${cy}`}
              to={`${angle + 360} ${cx} ${cy}`}
              dur="1.5s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant: Grid (4×4 cascade)
// ────────────────────────────────────────────────────────────────

function GridDots({ cx, cy, r, fill, size }: DotProps) {
  const gap = size * 0.22;
  const positions = [-1.5, -0.5, 0.5, 1.5];
  let idx = 0;

  return (
    <g>
      {/* Background dots (very faint) */}
      {positions.map((row) =>
        positions.map((col) => (
          <circle
            key={`bg-${row}-${col}`}
            cx={cx + col * gap}
            cy={cy + row * gap}
            r={r * 0.6}
            fill={fill}
            opacity={0.08}
          />
        )),
      )}
      {/* Animated foreground dots */}
      {positions.map((row) =>
        positions.map((col) => {
          const delay = (idx++) * 0.08;
          return (
            <circle
              key={`fg-${row}-${col}`}
              cx={cx + col * gap}
              cy={cy + row * gap}
              r={r * 0.85}
              fill={fill}
              opacity={0.1}
            >
              <animate
                attributeName="opacity"
                values="0.1;0.9;0.1"
                dur="2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values={`${r * 0.6};${r};${r * 0.6}`}
                dur="2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        }),
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant: Ripple (expanding concentric dot rings)
// ────────────────────────────────────────────────────────────────

function RippleDots({ cx, cy, r, fill, size }: DotProps) {
  const rings = [0, 1, 2]; // 3 concentric rings
  const maxR = size * 0.4;

  return (
    <g>
      {/* Static center dot */}
      <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.9} />

      {/* Expanding rings */}
      {rings.map((ring) => {
        const dotCount = 8;
        const ringRadius = maxR * ((ring + 1) / rings.length);
        const delay = ring * 0.6;

        return (
          <g key={ring} opacity={0}>
            <animate
              attributeName="opacity"
              values="0.8;0"
              dur="1.8s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="scale"
              values="0.3;1"
              dur="1.8s"
              begin={`${delay}s`}
              repeatCount="indefinite"
              additive="sum"
            />
            {Array.from({ length: dotCount }).map((_, i) => {
              const angle = (i / dotCount) * Math.PI * 2;
              const dx = cx + Math.cos(angle) * ringRadius;
              const dy = cy + Math.sin(angle) * ringRadius;
              return (
                <circle
                  key={i}
                  cx={dx}
                  cy={dy}
                  r={r * 0.7}
                  fill={fill}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant: Breathe (single pulsing dot with glow)
// ────────────────────────────────────────────────────────────────

function BreatheDot({ cx, cy, r, fill }: Omit<DotProps, "size">) {
  return (
    <g>
      {/* Glow ring */}
      <circle cx={cx} cy={cy} r={r * 2.5} fill={fill} opacity={0}>
        <animate
          attributeName="opacity"
          values="0;0.15;0"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values={`${r * 1.5};${r * 3};${r * 1.5}`}
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.5}>
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values={`${r};${r * 1.4};${r}`}
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}

// ────────────────────────────────────────────────────────────────
// Shared types
// ────────────────────────────────────────────────────────────────

interface DotProps {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  size: number;
}
