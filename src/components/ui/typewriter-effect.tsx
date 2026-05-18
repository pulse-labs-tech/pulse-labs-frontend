"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
  highlightText?: string;
  highlightClassName?: string;
}

export function TypewriterText({
  text,
  className,
  delay = 0,
  highlightText = "",
  highlightClassName = "",
}: TypewriterTextProps) {
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
    },
  };

  return (
    <motion.div
      style={{ overflow: "hidden", display: "inline-block" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("", className)}
    >
      {words.map((word, index) => {
        // Simple logic to detect if this word is part of the highlight
        // For more complex highlighting, we should ideally pass a structured array of tokens.
        const isHighlight = highlightText && highlightText.includes(word.replace(/[,.]/g, ""));
        
        return (
          <motion.span
            variants={child}
            key={index}
            className={cn("inline-block mr-[0.25em]", isHighlight ? highlightClassName : "")}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

interface TypewriterWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// A more flexible typewriter that works on child elements instead of text strings
export function TypewriterWrapper({ children, className, delay = 0 }: TypewriterWrapperProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: delay },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const TypewriterChild = motion.span;
