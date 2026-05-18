"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PulseLogo } from "@/components/shared/pulse-logo";

const navLinks = [
  { href: "#features", label: "Tính năng" },
  { href: "#how-it-works", label: "Cách hoạt động" },
  { href: "#cta", label: "Bảng giá" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.06] bg-auth-bg/70 backdrop-blur-2xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8 3xl:h-16 3xl:max-w-[1680px] 4xl:max-w-[2200px]">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Pulse Knowledge — trang chủ">
          <PulseLogo size={32} className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-sm font-bold tracking-tight text-auth-text 3xl:text-[15px]">
            Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (<a key={l.href} href={l.href} className="text-[13px] font-medium text-auth-text-2 transition-colors duration-200 hover:text-white 3xl:text-sm">{l.label}</a>))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-[13px] font-medium text-auth-text-2 transition-colors duration-200 hover:text-white 3xl:text-sm">Đăng nhập</Link>
          <Link href="/register" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(52,211,153,0.25)] transition-all duration-300 hover:-translate-y-px hover:scale-105 hover:shadow-[0_0_25px_rgba(52,211,153,0.45)] active:scale-95 3xl:text-sm">Bắt đầu miễn phí</Link>
        </div>
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-auth-text-2 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 md:hidden" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-auth-bg/95 px-5 pb-6 pt-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((l) => (<a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 transition-colors hover:text-white">{l.label}</a>))}
            <hr className="border-white/[0.06]" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-auth-text-2 hover:text-white">Đăng nhập</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-center text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95">Bắt đầu miễn phí</Link>
          </div>
        </div>
      )}
    </header>
  );
}
