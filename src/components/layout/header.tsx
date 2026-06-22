"use client";
import { type MouseEvent, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineIcon } from "@/components/shared/line-icon";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "./locale-switcher";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const homeHref = `/${locale}`;

  const navLinks = [
    { href: "#features", label: t("landing.navFeatures") },
    { href: "#how-it-works", label: t("landing.navHowItWorks") },
    { href: `/${locale}/pricing`, label: t("landing.navPricing") },
  ];

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== homeHref) return;

    event.preventDefault();
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.08] glass-premium">
      {/* ── Desktop nav: 1fr | auto | 1fr → nav always truly centered ── */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 h-14 lg:h-16 hidden lg:grid lg:grid-cols-[1fr_auto_1fr] items-center gap-6">

        {/* Col 1 — Logo (1fr, left-aligned) */}
        <div className="flex justify-start">
          <Link
            href={homeHref}
            onClick={handleLogoClick}
            className="group flex items-center gap-2 shrink-0"
            aria-label="Pulse Knowledge — trang chủ"
          >
            <PulseLogo
              size={32}
              className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_var(--color-auth-accent-glow)]"
            />
            <PulseWordmark className="text-[15px] leading-none" />
          </Link>
        </div>

        {/* Col 2 — Nav links (auto, truly centered) */}
        <nav className="flex justify-center items-center gap-8 xl:gap-10">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold tracking-wide text-auth-text-2 whitespace-nowrap transition-all duration-200 hover:text-white hover:scale-105"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Col 3 — Actions (1fr, right-aligned) */}
        <div className="flex items-center gap-5 justify-end">
          <LocaleSwitcher id="desktop" />
          <Link
            href={`/${locale}/login`}
            className="text-sm font-semibold text-auth-text-2 whitespace-nowrap transition-all duration-200 hover:text-white hover:scale-105"
          >
            {t("auth.login.title")}
          </Link>
          <Link href={`/${locale}/register`}>
            <Button
              variant="primary"
              size="md"
              pill={true}
              className="px-5 font-bold whitespace-nowrap shadow-[0_0_15px_var(--color-auth-accent-glow)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_var(--color-auth-accent-glow)] active:scale-95"
            >
              {t("landing.ctaStart")}
            </Button>
          </Link>
        </div>
      </div>


      {/* ── Mobile nav bar ── */}
      <div className="w-full max-w-[1440px] mx-auto px-5 h-14 flex items-center justify-between lg:hidden">
        {/* Logo */}
        <Link
          href={homeHref}
          onClick={handleLogoClick}
          className="group flex items-center gap-2"
          aria-label="Pulse Knowledge — trang chủ"
        >
          <PulseLogo
            size={28}
            className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]"
          />
          <PulseWordmark className="text-[14px] leading-none" />
        </Link>

        {/* Mobile right: locale + hamburger */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher id="mobile" />
          <Button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <LineIcon name="xmark" className="h-5 w-5" />
              : <LineIcon name="menu" className="h-5 w-5" />
            }
          </Button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div className="border-t border-white/[0.08] glass-premium px-5 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-auth-text-2 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <hr className="border-white/[0.06]" />
            <Link
              href={`/${locale}/login`}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold text-auth-text-2 hover:text-white"
            >
              {t("auth.login.title")}
            </Link>
            <Link
              href={`/${locale}/register`}
              onClick={() => setMobileOpen(false)}
              className="w-full"
            >
              <Button variant="primary" size="lg" pill={true} fullWidth={true}>
                {t("landing.ctaStart")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
