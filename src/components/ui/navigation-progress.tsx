"use client";

/**
 * NavigationProgress — single neutral header progress bar for route transitions.
 *
 * Design:
 * - Slim bar aligned with the app header chrome
 * - Neutral graphite/white shimmer to avoid adding extra brand color
 * - Starts IMMEDIATELY on link click (no waiting for server)
 * - Completes (100%) when pathname changes (navigation done)
 * - Fades out gracefully after completion
 *
 * Behavior:
 * - Intercepts all same-origin anchor clicks globally via capture listener
 * - Progressive ramp-up: 0 → 20% (50ms) → 55% (350ms) → 80% (900ms) [faked]
 * - On route change: snaps to 100% then fades
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — uses useSearchParams (needs Suspense boundary)
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeSegment = pathname.split("/").filter(Boolean)[1] ?? "";
  const isAppRoute = ["dashboard", "query", "research", "wiki", "compile", "settings"].includes(routeSegment);

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isNavigating = useRef(false);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const push = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /** Start the progress ramp — called on link click */
  const startProgress = useCallback(() => {
    if (isNavigating.current) return; // debounce double-clicks
    isNavigating.current = true;

    clearAll();
    setCompleting(false);
    setProgress(0);
    setVisible(true);

    // Staged ramp: looks natural — slows as it approaches the "waiting" zone
    push(() => setProgress(15),  60);
    push(() => setProgress(35),  250);
    push(() => setProgress(55),  500);
    push(() => setProgress(72),  900);
    push(() => setProgress(82),  1800);
    push(() => setProgress(88),  3500); // soft ceiling — never reaches 100% alone
  }, [clearAll, push]);

  /** Complete the bar — called on pathname change */
  const completeProgress = useCallback(() => {
    if (!isNavigating.current) return;
    isNavigating.current = false;

    clearAll();
    setCompleting(true);
    setProgress(100);

    // Fade out after completion
    push(() => {
      setVisible(false);
      setCompleting(false);
      setProgress(0);
    }, 700);
  }, [clearAll, push]);

  // ── Intercept anchor clicks globally ──────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      // Skip non-navigation links
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.origin);
        // Only same-origin navigations that change the path
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;

        startProgress();
      } catch {
        // Relative URL parsing failure — skip
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startProgress]);

  // ── Complete on route change ───────────────────────────────────────────────
  useEffect(() => {
    completeProgress();
    // pathname + searchParams as a string to avoid stale closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => clearAll(), [clearAll]);

  if (!visible) return null;

  const barStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    left: 0,
    top: 0,
    height: "100%",
    width: `${progress}%`,
    background: "linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.88) 48%, rgba(255,255,255,0.32) 100%)",
    backgroundSize: "200% 100%",
    boxShadow: "0 0 14px rgba(255,255,255,0.18), 0 0 2px rgba(255,255,255,0.24)",
    // Complete immediately, ramp slowly
    transition: completing
      ? "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out 0.25s"
      : "width 0.5s cubic-bezier(0.1, 0.4, 0.5, 1)",
    opacity: completing && progress === 100 ? 0 : 1,
    animation: !completing ? "nav-shimmer 1.8s linear infinite" : undefined,
  };

  return (
    <>
      <style>{`
        @keyframes nav-shimmer {
          0%   { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
      <div
        role="progressbar"
        aria-label="Đang điều hướng"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: "fixed",
          top: isAppRoute ? "72px" : 0,
          left: 0,
          right: 0,
          height: "2px",
          zIndex: 55,
          overflow: "hidden",
          background: "rgba(255,255,255,0.045)",
          pointerEvents: "none",
          boxShadow: "0 1px 0 rgba(255,255,255,0.035)",
        }}
      >
        <div style={barStyle} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported component — wrapped in Suspense (required for useSearchParams)
// ─────────────────────────────────────────────────────────────────────────────

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
