/**
 * Brand Panel — Left side of the auth split layout.
 * Server Component — no client JS needed.
 *
 * Displays logo, headline, value propositions with ambient glow effects.
 */

import { Brain, Search, Target, Zap } from "lucide-react";

const valueProps = [
  {
    icon: Brain,
    color: "green" as const,
    title: "Knowledge Base cá nhân hoá theo Role",
    description: "KB riêng theo domain, không shared với ai",
  },
  {
    icon: Search,
    color: "purple" as const,
    title: "Tự động Research khi KB chưa đủ",
    description: "Không cần chờ — hệ thống tự bổ sung khi cần",
  },
  {
    icon: Target,
    color: "orange" as const,
    title: "Expert Advisor, không phải chatbot",
    description: "Chuyên gia theo domain, trả lời có chiều sâu",
  },
];

const iconColorMap = {
  green:
    "bg-emerald-950/40 border border-emerald-400/20 text-emerald-400",
  purple:
    "bg-violet-950/30 border border-violet-500/20 text-violet-400",
  orange:
    "bg-amber-950/30 border border-amber-500/20 text-amber-400",
} as const;

export function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-center gap-10 overflow-hidden border-r border-white/[0.06] bg-auth-bg px-10 py-16 lg:flex lg:px-14 xl:px-16 3xl:px-20 4xl:px-28">
      {/* Ambient glow — top left emerald */}
      <div
        className="pointer-events-none absolute -left-[120px] -top-[120px] h-[400px] w-[400px] rounded-full opacity-100"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.19 160 / 0.10) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Ambient glow — bottom right purple */}
      <div
        className="pointer-events-none absolute -bottom-[80px] -right-[80px] h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.68 0.18 280 / 0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_14px_rgba(52,211,153,0.3)] 3xl:h-10 3xl:w-10">
          <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-auth-text 3xl:text-base">
          Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
        </span>
      </div>

      {/* Hero text */}
      <div className="relative flex flex-col gap-3">
        <h1 className="text-[28px] font-extrabold leading-[1.2] tracking-[-0.04em] text-auth-text 3xl:text-[32px] 4xl:text-[36px]">
          KB tích lũy theo domain —
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AI không bao giờ quên</span>
        </h1>
        <p className="max-w-[340px] text-sm leading-[1.7] text-auth-text-2 3xl:max-w-[400px] 3xl:text-[15px]">
          AI Researcher chuyên sâu theo lĩnh vực của bạn. Tích lũy knowledge,
          tự động research khi thiếu — dù 10 năm sau vẫn còn đó.
        </p>
      </div>

      {/* Value propositions */}
      <div className="relative flex flex-col gap-3.5">
        {valueProps.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3.5 py-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColorMap[item.color]} 3xl:h-9 3xl:w-9`}
              >
                <Icon className="h-4 w-4 3xl:h-[18px] 3xl:w-[18px]" />
              </div>
              <div>
                <strong className="block text-[13px] font-semibold text-auth-text 3xl:text-sm">
                  {item.title}
                </strong>
                <span className="text-xs text-auth-text-2 3xl:text-[13px]">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
