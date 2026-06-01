"use client";

/**
 * BrowserFrame — A sleek macOS-style browser chrome wrapper.
 * Wraps children in a realistic browser window with traffic lights
 * and a URL bar for premium product demo presentation.
 */
export function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="browser-frame group relative rounded-xl overflow-hidden border border-white/[0.08] bg-black/60 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.03)]">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="h-[10px] w-[10px] rounded-full bg-[#ff5f57] opacity-80" />
          <div className="h-[10px] w-[10px] rounded-full bg-[#febc2e] opacity-80" />
          <div className="h-[10px] w-[10px] rounded-full bg-[#28c840] opacity-80" />
        </div>
        
        {/* URL bar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-md px-3 py-1 max-w-[280px] w-full">
            <svg className="h-3 w-3 text-auth-text-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[10px] text-auth-text-3 font-mono truncate select-none">
              app.pulseknowledge.com
            </span>
          </div>
        </div>

        {/* Right spacer to balance traffic lights */}
        <div className="w-[52px]" />
      </div>
      
      {/* Content area */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
