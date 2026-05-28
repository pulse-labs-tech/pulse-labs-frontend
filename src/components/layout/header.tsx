"use client";
import { useState } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";
import { LocaleSwitcher } from "./locale-switcher";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale } = useTranslation();

  const navLinks = [
    { href: "#features", label: t("landing.navFeatures") },
    { href: "#how-it-works", label: t("landing.navHowItWorks") },
    { href: `/${locale}/pricing`, label: t("landing.navPricing") },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.08] glass-premium">
      {/* ── Desktop nav: CSS grid 3-column prevents overlap at any width ── */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 h-14 lg:h-16 hidden lg:grid lg:grid-cols-[auto_1fr_auto] items-center gap-8">

        {/* Col 1 — Logo (fixed width, left-aligned) */}
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-2 shrink-0"
          aria-label="Pulse Knowledge — trang chủ"
        >
          <PulseLogo
            size={32}
            className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_var(--color-auth-accent-glow)]"
          />
          <span className="text-[15px] font-extrabold tracking-tight text-auth-text leading-none whitespace-nowrap">
            Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
        </Link>

        {/* Col 2 — Nav links (centered in remaining space) */}
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

        {/* Col 3 — Actions (fixed width, right-aligned) */}
        <div className="flex items-center gap-5 shrink-0 justify-end">
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
          href={`/${locale}`}
          className="group flex items-center gap-2"
          aria-label="Pulse Knowledge — trang chủ"
        >
          <PulseLogo
            size={28}
            className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]"
          />
          <span className="text-[14px] font-extrabold tracking-tight text-auth-text leading-none">
            Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
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
