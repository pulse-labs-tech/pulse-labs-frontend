"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export function ShowcaseVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = "/videos/hls/playlist.m3u8";

    // Playback logic on metadata loaded
    const handlePlay = () => {
      video.play().catch((err) => {
        console.log("Autoplay was prevented by browser policies:", err);
      });
      setIsLoaded(true);
    };

    // Native HLS support (specifically for iOS Safari and macOS Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", handlePlay);
      return () => {
        video.removeEventListener("loadedmetadata", handlePlay);
      };
    } 
    // Hls.js library support (Chrome, Firefox, Brave, Edge, etc.)
    else if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 8,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, handlePlay);

      return () => {
        hls.destroy();
      };
    }
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-[0_0_60px_rgba(16,185,129,0.12)] border border-white/[0.06] group transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_0_80px_rgba(16,185,129,0.18)]">
      {/* Ambient glass glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-brand-500/5 via-transparent to-accent-500/5 opacity-40 transition-opacity duration-500 group-hover:opacity-60" />
      
      {/* Video Stream */}
      <video
        ref={videoRef}
        muted
        autoPlay
        loop
        playsInline
        controls={false}
        className={`w-full h-auto aspect-video object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          // Apply a radial transparency mask to blend video edges smoothly into pure black
          maskImage: "radial-gradient(ellipse 98% 98% at 50% 50%, black 85%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 98% 98% at 50% 50%, black 85%, transparent 100%)",
        }}
      />
      
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            <span className="text-[10px] uppercase tracking-widest text-auth-text-3 font-semibold">Tải luồng video...</span>
          </div>
        </div>
      )}
    </div>
  );
}
