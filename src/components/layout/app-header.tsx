"use client";

import { type MouseEvent, type PointerEvent as ReactPointerEvent, ReactNode, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { logoutAction } from "@/app/actions/auth";
import { useAuth } from "@/hooks/use-auth";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { LocaleSwitcher } from "./locale-switcher";

type AppHeaderActive = "dashboard" | "query" | "compile" | "wiki" | "research" | "settings";
type AppHeaderNavItem = "dashboard" | "query" | "research" | "wiki";

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

const navIcon: Record<AppHeaderNavItem, string> = {
  dashboard: "grid-alt",
  query: "comment",
  research: "compass",
  wiki: "book",
};

export function AppHeader({ active, locale, selectedRoleKbId, leftAction }: AppHeaderProps) {
  const { user, clearAuth } = useAuth();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navCanScrollPrev, setNavCanScrollPrev] = useState(false);
  const [navCanScrollNext, setNavCanScrollNext] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement>(null);
  const navDragStartXRef = useRef(0);
  const navDragStartScrollRef = useRef(0);
  const navDraggingRef = useRef(false);
  const navDidDragRef = useRef(false);

  const roleQuery = active === "settings" ? null : selectedRoleKbId;
  const dashboardHref = `/${locale}/dashboard${roleQuery ? `?roleKbId=${roleQuery}` : ""}`;
  const navItems: { id: AppHeaderNavItem; label: string; shortLabel: string; href: string }[] = [
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
      id: "research",
      label: locale === "vi" ? "Nghiên cứu AI" : "AI Research",
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

  const syncNavScrollState = useCallback(() => {
    const rail = navRailRef.current;
    if (!rail) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setNavCanScrollPrev(rail.scrollLeft > 4);
    setNavCanScrollNext(rail.scrollLeft < maxScroll - 4);
  }, []);

  const scrollNavRail = (direction: "prev" | "next") => {
    const rail = navRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === "next" ? 180 : -180,
      behavior: "smooth",
    });
  };

  const handleNavPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = navRailRef.current;
    if (!rail) return;

    navDraggingRef.current = true;
    navDidDragRef.current = false;
    navDragStartXRef.current = event.clientX;
    navDragStartScrollRef.current = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  };

  const handleNavPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = navRailRef.current;
    if (!rail || !navDraggingRef.current) return;

    const deltaX = event.clientX - navDragStartXRef.current;
    if (Math.abs(deltaX) > 5) {
      navDidDragRef.current = true;
    }
    rail.scrollLeft = navDragStartScrollRef.current - deltaX;
  };

  const handleNavPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = navRailRef.current;
    if (rail?.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }

    navDraggingRef.current = false;
    syncNavScrollState();
    window.setTimeout(() => {
      navDidDragRef.current = false;
    }, 0);
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== `/${locale}/dashboard`) return;

    event.preventDefault();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    const handlePointerDown = (event: globalThis.PointerEvent) => {
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

  useEffect(() => {
    syncNavScrollState();

    const rail = navRailRef.current;
    if (!rail) return;

    const handleScroll = () => syncNavScrollState();
    const handleResize = () => syncNavScrollState();

    rail.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      rail.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [syncNavScrollState]);

  return (
    <>
      <header className="app-glass-header fixed inset-x-0 top-0 z-50 border-b border-white/[0.08]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" aria-hidden="true" />
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
              href={dashboardHref}
              onClick={handleLogoClick}
              className="app-brand-lockup inline-flex h-11 min-w-0 items-center gap-2 rounded-2xl border px-3 text-sm text-auth-text transition-colors sm:px-4"
              aria-label="Pulse Knowledge dashboard"
            >
              <PulseLogo size={24} />
              <PulseWordmark className="hidden text-[14px] sm:inline-flex" />
            </Link>
          </div>

          <nav className="hidden min-w-0 justify-center lg:flex" aria-label={locale === "vi" ? "Điều hướng chính" : "Primary navigation"}>
            <div
              className={`app-nav-shell relative flex max-w-full items-center rounded-[18px] border p-0.5 ${
                navCanScrollPrev ? "can-scroll-prev" : ""
              } ${navCanScrollNext ? "can-scroll-next" : ""}`}
            >
              <button
                type="button"
                onClick={() => scrollNavRail("prev")}
                className={`app-nav-arrow left-1 transition-opacity duration-150 ${navCanScrollPrev ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-label={locale === "vi" ? "Mục trước" : "Previous item"}
              >
                <LineIcon name="chevron-left" className="h-3.5 w-3.5" />
              </button>
              <div
                ref={navRailRef}
                className="app-nav-rail flex max-w-full touch-pan-x select-none items-center gap-0.5 overflow-x-auto rounded-[15px]"
                onPointerDown={handleNavPointerDown}
                onPointerMove={handleNavPointerMove}
                onPointerUp={handleNavPointerEnd}
                onPointerCancel={handleNavPointerEnd}
                onWheel={(event) => {
                  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                    event.currentTarget.scrollLeft += event.deltaY;
                  }
                }}
              >
                {navItems.map((item) => {
                  const isActive = item.id === active;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch={false}
                      title={item.label}
                      draggable={false}
                      onClick={(event) => {
                        if (navDidDragRef.current) {
                          event.preventDefault();
                        }
                      }}
                      className="relative inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[14px] px-3.5 text-[11px] font-bold transition-colors duration-200 select-none"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="app-active-tab"
                          className="absolute inset-0 rounded-[14px] border border-auth-accent/25 bg-auth-accent-dim shadow-[0_0_18px_rgba(35,197,132,0.10)]"
                          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.82 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-auth-accent" : "text-auth-text-2 hover:text-auth-text"}`}>
                        <LineIcon name={navIcon[item.id]} className="h-3.5 w-3.5 opacity-90" />
                        <span className="hidden 2xl:inline">{item.label}</span>
                        <span className="hidden xl:inline 2xl:hidden">{item.shortLabel}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => scrollNavRail("next")}
                className={`app-nav-arrow right-1 transition-opacity duration-150 ${navCanScrollNext ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-label={locale === "vi" ? "Mục tiếp theo" : "Next item"}
              >
                <LineIcon name="chevron-right" className="h-3.5 w-3.5" />
              </button>
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-auth-elevated)] text-xs font-black text-auth-text shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden min-w-0 leading-none min-[500px]:block">
                    <div className="max-w-[104px] truncate text-[11px] font-bold text-white">{userName}</div>
                    <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.08em] text-auth-text-3">{planName}</div>
                  </div>
                  <LineIcon
                    name="chevron-down"
                    className={`hidden h-3 w-3 text-auth-text-3 transition-transform sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full z-50 w-[min(90vw,320px)] pt-2"
                    >
                      <div
                        role="menu"
                        className="app-user-menu overflow-hidden rounded-[22px] border p-3"
                      >
                        <div className="flex items-center gap-3 px-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-auth-elevated)] text-sm font-black text-auth-text shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">{user.displayName || user.email || "User"}</div>
                            <div className="mt-1 truncate text-xs text-auth-text-3">{user.email}</div>
                            <div className="mt-2 inline-flex rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-auth-text-3">
                              {planName}
                            </div>
                          </div>
                        </div>
                        <div className="my-2 h-px bg-white/[0.07]" />
                        <Link
                          href={`/${locale}/settings`}
                          prefetch={false}
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-auth-text-2 transition-colors hover:bg-auth-card-hover hover:text-white"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                            <LineIcon name="gear" className="h-4 w-4 text-auth-text-3" />
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
                    </motion.div>
                  )}
                </AnimatePresence>
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

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-white/[0.08] bg-auth-bg/70 px-4 pb-4 backdrop-blur-2xl lg:hidden overflow-hidden"
            >
              <nav className="mx-auto grid max-w-[1760px] grid-cols-2 gap-2 pt-4" aria-label={locale === "vi" ? "Điều hướng di động" : "Mobile navigation"}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div className="h-[73px] shrink-0" aria-hidden="true" />
    </>
  );
}
