'use client';

import './hero-background.css';

/**
 * HeroBackground — premium ambient layer for the landing hero.
 *
 * Four visual layers stacked via absolute positioning:
 *   1. Animated mesh-gradient orbs (jade, teal, violet)
 *   2. Repeating dot grid
 *   3. Horizontal scan line
 *   4. Radial vignette
 *
 * All motion is CSS keyframes on compositor-only properties
 * (transform + opacity). Reduced-motion users get a static backdrop.
 */
export function HeroBackground() {
  return (
    <div
      className="hero-bg"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* ── Layer 1: Animated gradient orbs ── */}

      {/* Orb 1 — Large jade/emerald, top-center */}
      <div
        className="hero-bg__orb"
        style={{
          position: 'absolute',
          top: '-8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(720px, 60vw)',
          height: 'min(720px, 60vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, oklch(0.65 0.13 160 / 0.15), transparent 70%)',
          filter: 'blur(120px)',
          willChange: 'transform',
          animation: 'hero-orb-1 20s cubic-bezier(0.37, 0, 0.63, 1) infinite',
        }}
        aria-hidden="true"
      />

      {/* Orb 2 — Medium teal/cyan, right */}
      <div
        className="hero-bg__orb"
        style={{
          position: 'absolute',
          top: '20%',
          right: '-5%',
          width: 'min(520px, 45vw)',
          height: 'min(520px, 45vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, oklch(0.78 0.14 195 / 0.10), transparent 70%)',
          filter: 'blur(100px)',
          willChange: 'transform',
          animation: 'hero-orb-2 25s cubic-bezier(0.37, 0, 0.63, 1) infinite',
        }}
        aria-hidden="true"
      />

      {/* Orb 3 — Small violet, bottom-left */}
      <div
        className="hero-bg__orb"
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '5%',
          width: 'min(380px, 35vw)',
          height: 'min(380px, 35vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, oklch(0.68 0.18 280 / 0.06), transparent 70%)',
          filter: 'blur(140px)',
          willChange: 'transform',
          animation: 'hero-orb-3 30s cubic-bezier(0.37, 0, 0.63, 1) infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 2: Dot grid ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, oklch(1 0 0 / 0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 3: Scan line ── */}
      <div
        className="hero-bg__scanline"
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'oklch(1 0 0 / 0.05)',
          willChange: 'transform',
          animation: 'hero-scanline 8s linear infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 4: Radial vignette ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 30%, oklch(0.12 0.006 260) 100%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
