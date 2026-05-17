"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Custom hook for responsive media queries.
 * Uses useSyncExternalStore for safe, tear-free reads of window.matchMedia.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const is4K = useMediaQuery("(min-width: 3840px)");
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => {
    // Default to false on server — hydration will correct
    return false;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Preset breakpoint hooks for convenience.
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIs2K() {
  return useMediaQuery("(min-width: 1920px)");
}

export function useIs4K() {
  return useMediaQuery("(min-width: 3840px)");
}
