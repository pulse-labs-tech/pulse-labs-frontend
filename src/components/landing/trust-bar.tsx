"use client";

import { useEffect, useRef, useState } from "react";

/**
 * TrustBar — Animated counter stats that count up when visible.
 * Shows social proof metrics below the hero CTA buttons.
 */

function AnimatedNumber({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduced.matches) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, started]);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return (
    <span ref={ref} className="font-mono font-bold tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

interface TrustStat {
  value: number;
  suffix: string;
  label: string;
}

export function TrustBar({ stats }: { stats: TrustStat[] }) {
  return (
    <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-xl sm:text-2xl text-white">
            <AnimatedNumber target={stat.value} suffix={stat.suffix} />
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-auth-text-3 uppercase tracking-wider">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
