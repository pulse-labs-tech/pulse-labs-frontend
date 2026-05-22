"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { Button } from "@/components/ui";

const navLinks = [
  { href: "#features", label: "Tính năng" },
  { href: "#how-it-works", label: "Cách hoạt động" },
  { href: "#cta", label: "Bảng giá" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.08] glass-premium">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8 3xl:h-16 3xl:max-w-[1680px] 4xl:max-w-[2200px]">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Pulse Knowledge — trang chủ">
          <PulseLogo size={32} className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]" />
          <span className="text-sm font-bold tracking-tight text-auth-text 3xl:text-[15px]">
            Pulse<span className="bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (<a key={l.href} href={l.href} className="text-[13px] font-medium text-auth-text-2 transition-colors duration-200 hover:text-white 3xl:text-sm">{l.label}</a>))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-[13px] font-medium text-auth-text-2 transition-colors duration-200 hover:text-white 3xl:text-sm">Đăng nhập</Link>
          <Link href="/register">
            <Button variant="primary" size="md" pill={true} className="px-5">Bắt đầu miễn phí</Button>
          </Link>
        </div>
        <Button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>
      {mobileOpen && (
        <div className="border-t border-white/[0.08] glass-premium px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((l) => (<a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 transition-colors hover:text-white">{l.label}</a>))}
            <hr className="border-white/[0.06]" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 hover:text-white mb-1">Đăng nhập</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="w-full">
              <Button variant="primary" size="lg" pill={true} fullWidth={true}>Bắt đầu miễn phí</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
