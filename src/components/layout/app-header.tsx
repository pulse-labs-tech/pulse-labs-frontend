"use client";

import { ReactNode, useEffect, useRef, useState, useTransition } from "react";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roleQuery = active === "settings" ? null : selectedRoleKbId;
  const navItems: { id: AppHeaderActive; label: string; shortLabel: string; href: string }[] = [
    {
      id: "dashboard",
      label: locale === "vi" ? "Bảng điều khiển" : "Dashboard",
      shortLabel: locale === "vi" ? "Bảng" : "Dash",
      href: appHref(locale, "/dashboard", roleQuery),
    },
    {
      id: "query",
      label: locale === "vi" ? "Hỏi đáp AI" : "Ask AI",
      shortLabel: locale === "vi" ? "Hỏi AI" : "Ask",
      href: appHref(locale, "/query", roleQuery),
    },
    {
      id: "compile",
      label: locale === "vi" ? "Biên dịch" : "Compile",
      shortLabel: locale === "vi" ? "Dịch" : "Build",
      href: appHref(locale, "/compile/new", roleQuery),
    },
    {
      id: "research",
      label: locale === "vi" ? "Nghiên cứu AI" : "Research",
      shortLabel: locale === "vi" ? "Nghiên cứu" : "Research",
      href: appHref(locale, "/research", roleQuery),
    },
    {
      id: "wiki",
      label: locale === "vi" ? "Wiki cá nhân" : "Wiki",
      shortLabel: "Wiki",
      href: appHref(locale, "/wiki", roleQuery),
    },
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

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <>
      <header className="app-glass-header fixed inset-x-0 top-0 z-50 border-b border-white/[0.08]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-auth-accent/22 to-transparent" aria-hidden="true" />
        <div className="mx-auto grid min-h-[72px] w-full max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 xl:gap-5 2xl:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {leftAction}
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="app-glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-auth-text-2 transition-colors hover:text-white lg:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
            >
              <LineIcon name={menuOpen ? "xmark" : "list"} className="h-4 w-4" />
            </button>
            <Link
              href={`/${locale}/dashboard${roleQuery ? `?roleKbId=${roleQuery}` : ""}`}
              className="app-glass-pill inline-flex h-11 min-w-0 items-center gap-2 rounded-2xl border px-3 text-sm font-black text-auth-text transition-colors sm:px-4"
              aria-label="Pulse Knowledge dashboard"
            >
              <PulseLogo size={24} />
              <span className="hidden truncate whitespace-nowrap sm:inline">
                Pulse<span className="text-auth-accent">Knowledge</span>
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 justify-center lg:flex" aria-label={locale === "vi" ? "Điều hướng chính" : "Primary navigation"}>
            <div className="app-glass-pill flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border p-1">
              {navItems.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch={false}
                    title={item.label}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-transparent px-2.5 text-xs font-bold transition-colors 2xl:px-3 ${
                      isActive
                        ? "app-glass-pill-active text-auth-accent"
                        : "text-auth-text-2 hover:bg-white/[0.08] hover:text-auth-text"
                    }`}
                  >
                    <LineIcon name={navIcon[item.id]} className="h-3.5 w-3.5" />
                    <span className="hidden 2xl:inline">{item.label}</span>
                    <span className="hidden xl:inline 2xl:hidden">{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <button
              onClick={openSearch}
              className="app-glass-pill hidden h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold text-auth-text-3 transition-colors hover:text-auth-text xl:inline-flex"
              title={locale === "vi" ? "Tìm kiếm (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <LineIcon name="search" className="h-3.5 w-3.5" />
              <span className="hidden 2xl:inline">{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
              <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-auth-text-3 2xl:inline">
                Ctrl K
              </kbd>
            </button>
            <button
              onClick={openSearch}
              className="app-glass-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-auth-text-2 transition-colors hover:text-auth-text xl:hidden"
              title={locale === "vi" ? "Tìm kiếm" : "Search"}
              aria-label={locale === "vi" ? "Tìm kiếm" : "Search"}
            >
              <LineIcon name="search" className="h-4 w-4" />
            </button>

            <LocaleSwitcher id={`app-${active}`} />

            {user ? (
              <div
                ref={userMenuRef}
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="app-glass-pill group flex h-10 min-w-10 items-center gap-2 rounded-2xl border py-1 pl-1 pr-2 text-left transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-auth-accent-dark text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden min-w-0 leading-none min-[500px]:block">
                    <div className="max-w-[104px] truncate text-[11px] font-bold text-white">{userName}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-auth-accent">{planName}</div>
                  </div>
                  <LineIcon
                    name="chevron-down"
                    className={`hidden h-3 w-3 text-auth-text-3 transition-transform sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 w-[min(90vw,320px)] pt-2"
                  >
                    <div
                      role="menu"
                      className="app-user-menu overflow-hidden rounded-[22px] border p-3"
                    >
                      <div className="flex items-center gap-3 px-3 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-auth-accent-dark text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                          {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">{user.displayName || user.email || "User"}</div>
                          <div className="mt-1 truncate text-xs text-auth-text-3">{user.email}</div>
                          <div className="mt-2 inline-flex rounded-full border border-auth-accent/20 bg-auth-accent-dim px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-auth-accent">
                            {planName}
                          </div>
                        </div>
                      </div>
                      <div className="my-2 h-px bg-white/[0.08]" />
                      <Link
                        href={`/${locale}/settings`}
                        prefetch={false}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-auth-text-2 transition-colors hover:bg-auth-card-hover hover:text-white"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                          <LineIcon name="gear" className="h-4 w-4 text-auth-accent" />
                        </span>
                        <span className="leading-5">{locale === "vi" ? "Cài đặt tài khoản" : "Account settings"}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isPending}
                        role="menuitem"
                        className="mt-1 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/[0.10] disabled:opacity-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-500/[0.06]">
                          {isPending ? <DotMatrixLoader variant="pulse" size="xs" /> : <LineIcon name="exit" className="h-4 w-4" />}
                        </span>
                        <span>{locale === "vi" ? "Đăng xuất" : "Log out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="app-glass-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-auth-text-3 transition-colors hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-red-300 disabled:opacity-50"
                title={locale === "vi" ? "Đăng xuất" : "Log out"}
                aria-label={locale === "vi" ? "Đăng xuất" : "Log out"}
              >
                {isPending ? <DotMatrixLoader variant="pulse" size="xs" /> : <LineIcon name="exit" className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.08] bg-auth-bg/70 px-4 pb-4 backdrop-blur-2xl lg:hidden">
            <nav className="mx-auto grid max-w-[1760px] grid-cols-2 gap-2 pt-4 sm:grid-cols-3" aria-label={locale === "vi" ? "Điều hướng di động" : "Mobile navigation"}>
              {navItems.map((item) => {
                const isActive = item.id === active;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className={`flex h-12 items-center gap-2 rounded-2xl border px-3 text-sm font-bold transition-colors ${
                      isActive
                        ? "border-auth-accent/25 bg-auth-accent-dim text-auth-accent"
                        : "app-glass-pill text-auth-text-2 hover:text-auth-text"
                    }`}
                  >
                    <LineIcon name={navIcon[item.id]} className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <div className="h-[73px] shrink-0" aria-hidden="true" />
    </>
  );
}
