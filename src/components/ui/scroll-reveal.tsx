"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

/**
 * ScrollReveal — CSS-only scroll reveal with IntersectionObserver.
 *
 * Replaces Framer Motion whileInView for jank-free, GPU-composited
 * reveal animations. Zero JS animation overhead — uses CSS transitions
 * on `transform` and `opacity` only (compositor-only properties).
 *
 * @see /knowledge/animation-performance-kit.md
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduced.matches) {
      setTimeout(() => setIsVisible(true), 0);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const directionClass = {
    up: "sr-up",
    down: "sr-down",
    left: "sr-left",
    right: "sr-right",
    none: "sr-none",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn("sr-base", directionClass, isVisible && "sr-visible", className)}
      style={
        delay > 0
          ? ({ "--sr-delay": `${delay * 1000}ms` } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
