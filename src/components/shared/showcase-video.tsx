"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Volume2, VolumeX } from "lucide-react";

export function ShowcaseVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Bulletproof programmatic configuration to bypass autoplay blocks on all mobile/desktop devices
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    const src = "/videos/hls/playlist.m3u8";

    const handlePlay = () => {
      setIsLoaded(true);
      video.play().catch((err) => {
        console.log("Autoplay play() call rejected: trying manual play trigger...", err);
        // Fallback: try playing again on any click/touch if blocked
        const forcePlay = () => {
          video.play().then(() => {
            document.removeEventListener("click", forcePlay);
            document.removeEventListener("touchstart", forcePlay);
          });
        };
        document.addEventListener("click", forcePlay);
        document.addEventListener("touchstart", forcePlay);
      });
    };

    // Native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", handlePlay);
      // If metadata is already loaded, trigger play
      if (video.readyState >= 1) {
        handlePlay();
      }
      return () => {
        video.removeEventListener("loadedmetadata", handlePlay);
      };
    } 
    // Hls.js support (Chrome, Firefox, Edge, etc.)
    else if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 6,
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

  const toggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    // Toggle muted property on the video element
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div 
      className="relative w-full overflow-visible select-none cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Ambient pulsing background glow (Static, no hover color animation) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[85%] rounded-full opacity-35 pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.02) 55%, transparent 75%)",
          filter: "blur(70px)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* 2. Inner Container (Flat & Straight to prevent distortion, masked edge blending) */}
      <div
        className="relative w-full overflow-hidden bg-transparent transition-transform duration-700 ease-out"
        style={{
          transform: isHovered ? "scale(1.02)" : "scale(1)",
          // Radical ellipse transparency mask to completely hide rectangular card boundaries
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 25%, transparent 100%)",
        }}
      >
        {/* HLS Video Element with MP4 source fallback */}
        <video
          ref={videoRef}
          muted={isMuted}
          autoPlay
          loop
          playsInline
          controls={false}
          preload="auto"
          onPlay={() => setIsLoaded(true)}
          className={`w-full h-auto aspect-video object-cover bg-transparent transition-opacity duration-1000 ease-in-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/videos/hls/playlist.m3u8" type="application/x-mpegURL" />
          <source src="/videos/showcase.mp4" type="video/mp4" />
        </video>

        {/* 3. Glossy sheen reflection overlay (Static, no hover color movement) */}
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/0"
          style={{
            transform: "translate3d(-10%, -10%, 0)",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* 4. Elegant skeleton fallback */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-auth-text-3 font-semibold">Tải demo...</span>
          </div>
        </div>
      )}

      {/* 5. Floating Audio Toggle Button */}
      {isLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-5 right-5 z-30 flex items-center justify-center rounded-full bg-black/60 border border-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 hover:border-white/20 active:scale-95 shadow-xl cursor-pointer"
          aria-label={isMuted ? "Mở tiếng" : "Tắt tiếng"}
          title={isMuted ? "Mở tiếng" : "Tắt tiếng"}
        >
          {isMuted ? (
            <VolumeX className="h-4.5 w-4.5 text-white/80" />
          ) : (
            <Volume2 className="h-4.5 w-4.5 text-emerald-400" />
          )}
        </button>
      )}
    </div>
  );
}
