"use client";

import { ReactNode, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { useAuth } from "@/hooks/use-auth";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { LocaleSwitcher } from "./locale-switcher";

type AppHeaderActive = "dashboard" | "query" | "compile" | "wiki" | "research" | "settings";

interface AppHeaderProps {
  active: AppHeaderActive;
  locale: string;
  selectedRoleKbId?: string | null;
  leftAction?: ReactNode;
}

function appHref(locale: string, path: string, roleKbId?: string | null) {
  const query = roleKbId ? `?roleKbId=${roleKbId}` : "";
  return `/${locale}${path}${query}`;
}

const navIcon: Record<AppHeaderActive, string> = {
  dashboard: "grid-alt",
  query: "comment",
  compile: "upload",
  wiki: "book",
  research: "compass",
  settings: "database",
};

export function AppHeader({ active, locale, selectedRoleKbId, leftAction }: AppHeaderProps) {
  const { user, clearAuth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleQuery = active === "settings" ? null : selectedRoleKbId;
  const navItems: { id: AppHeaderActive; label: string; href: string }[] = [
    { id: "dashboard", label: locale === "vi" ? "Bảng điều khiển" : "Dashboard", href: appHref(locale, "/dashboard", roleQuery) },
    { id: "query", label: locale === "vi" ? "Hỏi đáp AI" : "Ask AI", href: appHref(locale, "/query", roleQuery) },
    { id: "research", label: locale === "vi" ? "Nghiên cứu AI" : "Research", href: appHref(locale, "/research", roleQuery) },
    { id: "wiki", label: locale === "vi" ? "Wiki cá nhân" : "Wiki", href: appHref(locale, "/wiki", roleQuery) },
    { id: "settings", label: locale === "vi" ? "Cài đặt" : "Settings", href: `/${locale}/settings` },
  ];

  const userName = user?.displayName?.split(" ").slice(-1)[0] || user?.email?.split("@")[0] || "User";
  const planName = user?.plan === "pro" ? "Pro Plan" : "Free Plan";

  const openSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-global-search"));
    }
  };

  const handleLogout = () => {
    startTransition(async () => {
      try {
        clearAuth();
        await logoutAction();
      } catch {
        window.location.href = `/${locale}/login`;
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-white/[0.08] bg-auth-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1480px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {leftAction}
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-auth-elevated text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            <LineIcon name={menuOpen ? "xmark" : "list"} className="h-4 w-4" />
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex h-11 min-w-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-auth-elevated px-3 text-sm font-black text-auth-text"
            aria-label="Pulse Knowledge home"
          >
            <PulseLogo size={24} />
            <span className="hidden truncate whitespace-nowrap sm:inline">
              Pulse<span className="text-auth-accent">Knowledge</span>
            </span>
          </Link>
        </div>

        <nav className="hidden max-w-[620px] items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-auth-elevated p-1 md:flex">
          {navItems.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={false}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-auth-accent-dim text-auth-accent"
                    : "text-auth-text-2 hover:bg-white/[0.06] hover:text-auth-text"
                }`}
              >
                <LineIcon name={navIcon[item.id]} className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <button
            onClick={openSearch}
            className="hidden h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-auth-elevated px-3 text-xs font-semibold text-auth-text-3 transition-colors hover:bg-white/[0.06] hover:text-auth-text lg:inline-flex"
            title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
          >
            <LineIcon name="search" className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
            <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-auth-text-3 xl:inline">
              Ctrl K
            </kbd>
          </button>
          <button
            onClick={openSearch}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-auth-elevated text-auth-text-2 lg:hidden"
            title={locale === "vi" ? "Tìm kiếm" : "Search"}
          >
            <LineIcon name="search" className="h-4 w-4" />
          </button>

          <LocaleSwitcher id={`app-${active}`} />

          {user && (
            <div className="hidden items-center gap-2 rounded-2xl border border-white/[0.08] bg-auth-elevated py-1 pl-1 pr-2 lg:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-auth-accent-dark text-xs font-black text-white">
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-none">
                <div className="max-w-[82px] truncate text-[11px] font-bold text-white">{userName}</div>
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-auth-accent">{planName}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-auth-elevated text-auth-text-3 transition-colors hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-red-300 disabled:opacity-50"
            title={locale === "vi" ? "Đăng xuất" : "Log out"}
            aria-label={locale === "vi" ? "Đăng xuất" : "Log out"}
          >
            {isPending ? <DotMatrixLoader variant="pulse" size="xs" /> : <LineIcon name="exit" className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/[0.08] px-4 pb-4 md:hidden">
          <nav className="mx-auto grid max-w-[1480px] grid-cols-2 gap-2 pt-4">
            {navItems.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMenuOpen(false)}
                  className={`flex h-12 items-center gap-2 rounded-2xl border px-3 text-sm font-bold ${
                    isActive
                      ? "border-auth-accent/25 bg-auth-accent-dim text-auth-accent"
                      : "border-white/[0.08] bg-auth-elevated text-auth-text-2"
                  }`}
                >
                  <LineIcon name={navIcon[item.id]} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
