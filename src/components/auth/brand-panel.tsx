/**
 * Brand Panel — Left side of the auth split layout.
 * Server Component — no client JS needed.
 *
 * Displays logo, headline, value propositions with ambient glow effects.
 */

import { LineIcon } from "@/components/shared/line-icon";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { getDictionary } from "@/dictionaries";

export async function BrandPanel({ locale = "vi" }: { locale?: string }) {
  const dict = await getDictionary(locale);

  const valueProps = [
    {
      icon: "brain-alt",
      title: dict.auth.brand.prop1Title,
      description: dict.auth.brand.prop1Desc,
    },
    {
      icon: "search",
      title: dict.auth.brand.prop2Title,
      description: dict.auth.brand.prop2Desc,
    },
    {
      icon: "target",
      title: dict.auth.brand.prop3Title,
      description: dict.auth.brand.prop3Desc,
    },
  ];

  return (
    <div className="relative hidden flex-col justify-center gap-10 overflow-hidden border-r border-white/[0.06] bg-auth-bg px-10 py-16 lg:flex lg:px-14 xl:px-16 3xl:px-20 4xl:px-28">
      {/* Ambient glow — top left Royal Indigo */}
      <div
        className="pointer-events-none absolute -left-[120px] -top-[120px] h-[400px] w-[400px] rounded-full opacity-100"
        style={{
          background:
            "radial-gradient(circle, var(--color-auth-accent-glow) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Ambient glow — bottom right Royal Indigo */}
      <div
        className="pointer-events-none absolute -bottom-[80px] -right-[80px] h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.15 265 / 0.04) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <PulseLogo size={36} className="drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]" />
        <span className="text-[15px] font-bold tracking-tight text-auth-text 3xl:text-base">
          Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
        </span>
      </div>

      {/* Hero text */}
      <div className="relative flex flex-col gap-3">
        <h1 className="text-[28px] font-extrabold leading-[1.2] tracking-[-0.04em] text-auth-text 3xl:text-[32px] 4xl:text-[36px]">
          {dict.auth.brand.title1}
          <br />
          <span className="text-auth-accent">{dict.auth.brand.title2}</span>
        </h1>
        <p className="max-w-[340px] text-sm leading-[1.7] text-auth-text-2 3xl:max-w-[400px] 3xl:text-[15px]">
          {dict.auth.brand.subtitle}
        </p>
      </div>

      {/* Value propositions */}
      <div className="relative flex flex-col gap-3.5">
        {valueProps.map((item) => {
          return (
            <div key={item.title} className="flex items-center gap-3.5 py-1">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-auth-accent-dim)] border border-[var(--color-auth-accent)]/20 text-[var(--color-auth-accent)] 3xl:h-9 3xl:w-9"
              >
                <LineIcon name={item.icon} className="h-4 w-4 3xl:h-[18px] 3xl:w-[18px]" />
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
