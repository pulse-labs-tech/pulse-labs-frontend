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
import { Loader2 } from "lucide-react";

// ─── Variant + Size Maps ───────────────────────────────────────────────────

const variantClasses: Record<string, string> = {
  primary: [
    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    "shadow-[0_0_15px_oklch(0.75_0.19_160_/_0.20)]",
    "hover:shadow-[0_0_28px_oklch(0.75_0.19_160_/_0.45)] hover:-translate-y-[1px]",
    "active:scale-[0.97] active:shadow-none",
    "disabled:opacity-60 disabled:pointer-events-none disabled:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
  ].join(" "),

  secondary: [
    "bg-[var(--color-auth-elevated)] border border-[var(--color-auth-border)]",
    "text-[var(--color-auth-text)] hover:border-[var(--color-auth-accent)]/40",
    "hover:bg-[var(--color-auth-card-hover)]",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
  ].join(" "),

  ghost: [
    "bg-white/5 border border-white/10 text-[var(--color-auth-text-2)]",
    "hover:bg-white/10 hover:text-white hover:border-white/20",
    "active:scale-[0.97]",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
  ].join(" "),

  danger: [
    "bg-[var(--color-auth-error-dim)] border border-[var(--color-auth-error)]/30",
    "text-[var(--color-auth-error)]",
    "hover:bg-[var(--color-auth-error)]/20 hover:border-[var(--color-auth-error)]/60",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-error)]",
  ].join(" "),

  outline: [
    "bg-transparent border border-[var(--color-auth-accent)]/40",
    "text-[var(--color-auth-accent)]",
    "hover:bg-[var(--color-auth-accent-dim)] hover:border-[var(--color-auth-accent)]/70",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-auth-accent)]",
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
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const base = [
      "inline-flex items-center justify-center",
      "transition-all duration-200",
      "cursor-pointer select-none",
      "whitespace-nowrap",
      variantClasses[variant],
      sizeClasses[size],
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
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
            {children && size !== "icon" && (
              <span className="opacity-70">{children}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {size !== "icon" && children}
            {rightIcon && (
              <span className="shrink-0" aria-hidden="true">
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
