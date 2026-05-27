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
    { href: "#cta", label: t("landing.navPricing") },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.08] glass-premium">
      <nav className="w-full max-w-[1440px] mx-auto px-6 md:px-12 flex h-14 md:h-16 items-center justify-between relative transition-all duration-300 ease-in-out">
        <div className="flex justify-start z-10">
          <Link href={`/${locale}`} className="group flex items-center gap-2.5" aria-label="Pulse Knowledge — trang chủ">
            <PulseLogo size={34} className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_var(--color-auth-accent-glow)]" />
            <span className="text-sm font-extrabold tracking-tight text-auth-text md:text-base transition-colors">
              Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
            </span>
          </Link>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden justify-center items-center gap-10 lg:gap-12 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold tracking-wide text-auth-text-2 transition-all duration-300 hover:text-white hover:scale-105">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden justify-end items-center gap-6 lg:gap-8 md:flex z-10">
          <LocaleSwitcher id="desktop" />
          <Link href={`/${locale}/login`} className="inline-flex items-center text-sm font-semibold text-auth-text-2 transition-all duration-300 hover:text-white hover:scale-105">
            {t("auth.login.title")}
          </Link>
          <Link href={`/${locale}/register`}>
            <Button variant="primary" size="md" pill={true} className="px-6 font-bold shadow-[0_0_15px_var(--color-auth-accent-glow)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_var(--color-auth-accent-glow)] active:scale-95">{t("landing.ctaStart")}</Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 justify-end md:hidden z-10">
          <LocaleSwitcher id="mobile" />
          <Button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <LineIcon name="xmark" className="h-5 w-5" /> : <LineIcon name="menu" className="h-5 w-5" />}
          </Button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="border-t border-white/[0.08] glass-premium px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((l) => (<a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 transition-colors hover:text-white">{l.label}</a>))}
            <hr className="border-white/[0.06]" />
            <Link href={`/${locale}/login`} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 hover:text-white mb-1">{t("auth.login.title")}</Link>
            <Link href={`/${locale}/register`} onClick={() => setMobileOpen(false)} className="w-full">
              <Button variant="primary" size="lg" pill={true} fullWidth={true}>{t("landing.ctaStart")}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
