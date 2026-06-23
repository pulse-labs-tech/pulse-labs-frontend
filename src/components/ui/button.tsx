/**
 * Button — Pulse Knowledge Design System
 *
 * Variants:
 *   primary   — jade-teal gradient, glow shadow  (main CTA)
 *   secondary — elevated surface, subtle border  (secondary actions)
 *   ghost     — transparent, border only         (tertiary / nav)
 *   danger    — auth-error tint                  (destructive)
 *   outline   — border accent, transparent bg    (soft emphasis)
 *
 * Sizes:
 *   sm   — compact inline actions
 *   md   — default
 *   lg   — prominent CTAs
 *   icon — square, icon-only
 *
 * Usage:
 *   <Button variant="primary" size="lg">Nạp nguồn tài liệu</Button>
 *   <Button variant="secondary" size="md" isLoading>Đang xử lý</Button>
 *   <Button variant="ghost" size="icon" aria-label="Đăng xuất"><LogOut /></Button>
 */

import * as React from "react";
import { DotMatrixLoader } from "./dot-matrix-loader";

// ─── Variant + Size Maps ───────────────────────────────────────────────────

const variantClasses: Record<string, string> = {
  primary: [
    // Muted jade — not neon, aligned with dark UI aesthetic
    "bg-[var(--color-auth-accent-dark)] text-white",
    "shadow-[0_2px_12px_var(--color-auth-accent-glow)]",
    "hover:bg-[var(--color-auth-accent)] hover:shadow-[0_4px_20px_var(--color-auth-accent-glow)] hover:-translate-y-[1px]",
    "active:scale-[0.97] active:shadow-none active:translate-y-0",
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
  ].join(" "),

  premium: [
    "relative overflow-hidden z-0",
    "bg-[var(--color-auth-bg)] border border-[var(--color-auth-border)] text-white",
    "hover:border-[var(--color-auth-accent)]/50",
    "hover:shadow-[0_4px_16px_var(--color-auth-accent-glow)] hover:-translate-y-[1px]",
    "active:scale-[0.97] active:shadow-none",
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
    "before:absolute before:inset-[-150%] before:z-[-2] before:bg-[conic-gradient(from_0deg,transparent_45%,var(--color-auth-accent)_50%,transparent_55%)] before:animate-[spin_4s_linear_infinite] before:opacity-0 hover:before:opacity-70 before:transition-opacity before:duration-300",
    "after:absolute after:inset-[1px] after:z-[-1] after:bg-[var(--color-auth-bg)] after:rounded-[inherit] hover:after:bg-[var(--color-auth-surface)] after:transition-colors after:duration-200",
  ].join(" "),

  secondary: [
    "bg-[var(--color-auth-elevated)] border border-[var(--color-auth-border)]",
    "text-[var(--color-auth-text)] hover:border-white/[0.18]",
    "hover:bg-[var(--color-auth-card-hover)]",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
  ].join(" "),

  ghost: [
    "bg-transparent border border-[var(--color-auth-border)] text-[var(--color-auth-text-2)]",
    "hover:bg-white/[0.05] hover:text-white hover:border-white/[0.14]",
    "active:scale-[0.97]",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
  ].join(" "),

  danger: [
    "bg-[var(--color-auth-error-dim)] border border-[var(--color-auth-error)]/25",
    "text-[var(--color-auth-error)]",
    "hover:bg-[var(--color-auth-error)]/15 hover:border-[var(--color-auth-error)]/45",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-error)]",
  ].join(" "),

  outline: [
    "bg-transparent border border-white/[0.14]",
    "text-[var(--color-auth-text-2)]",
    "hover:bg-white/[0.05] hover:border-white/[0.22] hover:text-white",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
  ].join(" "),
};

const sizeClasses: Record<string, string> = {
  sm:   "h-7 px-3 text-[11px] font-semibold gap-1.5 rounded-lg",
  md:   "h-9 px-4 text-xs font-semibold gap-2 rounded-lg",
  lg:   "h-11 px-5 text-sm font-bold gap-2 rounded-xl",
  icon: "h-9 w-9 text-sm rounded-lg p-0",
};

// ─── Props ─────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  isLoading?: boolean;
  /** Icon shown before label */
  leftIcon?: React.ReactNode;
  /** Icon shown after label */
  rightIcon?: React.ReactNode;
  /** Makes the button expand to 100% width */
  fullWidth?: boolean;
  /** Makes the button pill-shaped (rounded-full) */
  pill?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      pill = false,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    let variantCls = variantClasses[variant] || "";
    let sizeCls = sizeClasses[size] || "";

    if (pill) {
      // Remove any existing non-full rounded classes to avoid styling conflicts
      variantCls = variantCls.replace(/\brounded-(?:lg|xl|md|sm|2xl)\b/g, "");
      sizeCls = sizeCls.replace(/\brounded-(?:lg|xl|md|sm|2xl)\b/g, "");
      sizeCls += " rounded-full";
    }

    const base = [
      "inline-flex items-center justify-center",
      "box-border",           // prevent border from adding to size
      "overflow-hidden",      // clip content + border within bounds
      "transition-all duration-200 ease-[var(--ease-emphasized-decelerate)]",
      "cursor-pointer select-none",
      "whitespace-nowrap",
      "group",
      variantCls,
      sizeCls,
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={base}
        {...props}
      >
        {isLoading ? (
          <>
            <DotMatrixLoader variant="pulse" size="xs" />
            {children && size !== "icon" && (
              <span className="opacity-70">{children}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
