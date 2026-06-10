"use client";

import { useEffect, useRef, useState } from "react";

interface LandingStat {
  value: number;
  suffix: string;
  label: string;
}

function AnimatedStat({ stat, delay = 0 }: { stat: LandingStat; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      setCount(stat.value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [stat.value]);

  useEffect(() => {
    if (!visible) return;

    const duration = 1200;
    const start = performance.now() + delay;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * stat.value));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [delay, stat.value, visible]);

  const formatted = stat.value >= 1000
    ? (count / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })
    : count.toLocaleString();

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-white/[0.08] bg-auth-elevated/70 p-5 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-70"
      }`}
    >
      <div className="font-mono text-3xl font-black leading-none tracking-[-0.04em] text-white sm:text-4xl">
        {formatted}{stat.suffix}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-auth-accent transition-[width] duration-1000 ease-[var(--ease-emphasized-decelerate)]"
          style={{ width: visible ? "100%" : "0%" }}
        />
      </div>
      <div className="mt-3 text-sm font-bold text-auth-text-2">{stat.label}</div>
    </div>
  );
}

export function LandingStats({ stats }: { stats: LandingStat[] }) {
  return (
    <section className="border-y border-white/[0.08] bg-auth-surface px-4 py-7 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1280px] gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <AnimatedStat key={stat.label} stat={stat} delay={index * 120} />
        ))}
      </div>
    </section>
  );
}
