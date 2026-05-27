"use client";

/**
 * Skeleton — Dot-matrix-inspired shimmer loading placeholder.
 *
 * Uses a subtle dot-grid pattern with a cascading shimmer wave
 * instead of the standard gradient shimmer. Adapts to parent theme.
 */

import { memo } from "react";

export interface SkeletonProps {
  /** Visual variant */
  variant?: "text" | "avatar" | "card" | "chart" | "table-row" | "block";
  /** Width. Accepts CSS value. Default: "100%" */
  width?: string | number;
  /** Height. Accepts CSS value or auto-set by variant. */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Number of rows (for "text" variant). Default: 1 */
  rows?: number;
}

export const Skeleton = memo(function Skeleton({
  variant = "block",
  width,
  height,
  className = "",
  rows = 1,
}: SkeletonProps) {
  const baseClass =
    "skeleton-dotm relative overflow-hidden rounded-lg";

  if (variant === "text") {
    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              height: height || "0.875rem",
              width: i === rows - 1 && rows > 1 ? "75%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    const sz = height || width || "2.5rem";
    return (
      <div
        className={`${baseClass} rounded-full shrink-0 ${className}`}
        style={{ width: sz, height: sz }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`${baseClass} ${className}`}
        style={{ width: width || "100%", height: height || "8rem" }}
      />
    );
  }

  if (variant === "chart") {
    return (
      <div
        className={`${baseClass} ${className}`}
        style={{ width: width || "100%", height: height || "12rem" }}
      />
    );
  }

  if (variant === "table-row") {
    return (
      <div className={`flex items-center gap-3 ${className}`} style={{ width }}>
        <div className={baseClass} style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem" }} />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className={baseClass} style={{ height: "0.75rem", width: "65%" }} />
          <div className={baseClass} style={{ height: "0.625rem", width: "40%" }} />
        </div>
        <div className={baseClass} style={{ height: "0.75rem", width: "3rem" }} />
      </div>
    );
  }

  // Default: block
  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ width: width || "100%", height: height || "2rem" }}
    />
  );
});
