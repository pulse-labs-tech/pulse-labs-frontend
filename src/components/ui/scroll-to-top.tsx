"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  className?: string;
  threshold?: number;
}

/**
 * ScrollToTop — A premium, glassmorphic floating scroll-to-top button.
 *
 * Design features:
 * - High blur backdrop filter matching the DeepMind premium glass aesthetic
 * - Elegant scale & fade transition
 * - Micro-animation on hover (arrow slides upward slightly)
 * - Click triggers a smooth scroll to the top of the viewport
 */
export function ScrollToTop({ className = "", threshold = 300 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Passive listener for best scrolling performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed z-[150] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-90 pointer-events-none"
      } ${className}`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        className="group btn-scroll-top"
        aria-label="Scroll to top"
        title="Cuộn lên đầu trang"
      >
        <ArrowUp />
      </button>
    </div>
  );
}

