"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "./markdown-renderer";

interface StreamingMarkdownRendererProps {
  content: string;
  active?: boolean;
  animate?: boolean;
  className?: string;
}

const FRAME_INTERVAL_MS = 28;

function getChunkSize(backlog: number) {
  if (backlog > 2400) return 36;
  if (backlog > 1200) return 22;
  if (backlog > 600) return 14;
  if (backlog > 240) return 8;
  if (backlog > 80) return 4;
  return 2;
}

export function StreamingMarkdownRenderer({
  content,
  active = false,
  animate = false,
  className = "",
}: StreamingMarkdownRendererProps) {
  const shouldAnimate = active || animate;
  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? "" : content);
  const displayedRef = useRef(displayedContent);

  useEffect(() => {
    displayedRef.current = displayedContent;
  }, [displayedContent]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldAnimate || reducedMotion) {
      const syncFrameId = window.requestAnimationFrame(() => {
        displayedRef.current = content;
        setDisplayedContent(content);
      });
      return () => window.cancelAnimationFrame(syncFrameId);
    }

    if (!content.startsWith(displayedRef.current)) {
      displayedRef.current = "";
    }

    let frameId = 0;
    let lastFrameAt = 0;

    const revealNextChunk = (timestamp: number) => {
      if (timestamp - lastFrameAt < FRAME_INTERVAL_MS) {
        frameId = window.requestAnimationFrame(revealNextChunk);
        return;
      }

      lastFrameAt = timestamp;
      const current = displayedRef.current;
      const backlog = content.length - current.length;

      if (backlog <= 0) {
        setDisplayedContent(content);
        return;
      }

      const nextLength = Math.min(content.length, current.length + getChunkSize(backlog));
      const nextContent = content.slice(0, nextLength);
      displayedRef.current = nextContent;
      setDisplayedContent(nextContent);
      frameId = window.requestAnimationFrame(revealNextChunk);
    };

    frameId = window.requestAnimationFrame(revealNextChunk);
    return () => window.cancelAnimationFrame(frameId);
  }, [content, shouldAnimate]);

  const isRevealing = displayedContent.length < content.length;

  return (
    <div
      className={`ai-stream-response ${className}`.trim()}
      aria-live="polite"
      aria-busy={active || isRevealing}
    >
      <MarkdownRenderer content={displayedContent} />
      {(active || isRevealing) && displayedContent && (
        <span className="ai-stream-caret" aria-hidden="true" />
      )}
    </div>
  );
}
