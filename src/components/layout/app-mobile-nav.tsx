"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PulseIcon } from "@/components/ui/pulse-icons";
import type { PulseIconName } from "@/components/ui/pulse-icons";
import { useTranslation } from "@/contexts/locale-context";

interface AppMobileNavProps {
  locale: string;
  selectedRoleKbId?: string | null;
}

export function AppMobileNav({ locale, selectedRoleKbId }: AppMobileNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const roleQuery = selectedRoleKbId ? `?roleKbId=${selectedRoleKbId}` : "";

  const tabs: { href: string; label: string; icon: PulseIconName; match: string }[] = [
    {
      href: `/${locale}/dashboard${roleQuery}`,
      label: t("common.dashboard", "Dashboard"),
      icon: "dashboard",
      match: `/${locale}/dashboard`,
    },
    {
      href: `/${locale}/query${roleQuery}`,
      label: t("common.query", "Hỏi đáp"),
      icon: "query",
      match: `/${locale}/query`,
    },
    {
      href: `/${locale}/wiki${roleQuery}`,
      label: t("common.wiki", "Wiki"),
      icon: "wiki",
      match: `/${locale}/wiki`,
    },
    {
      href: `/${locale}/compile/new${roleQuery}`,
      label: t("common.addDoc", "Nạp"),
      icon: "add",
      match: `/${locale}/compile`,
    },
    {
      href: `/${locale}/settings${roleQuery}`,
      label: t("common.settings", "Cài đặt"),
      icon: "settings",
      match: `/${locale}/settings`,
    },
  ];

  return (
    <nav
      className="app-mobile-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.match || pathname.startsWith(tab.match + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`app-mobile-nav__item${isActive ? " app-mobile-nav__item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="app-mobile-nav__icon-wrapper">
              <PulseIcon name={tab.icon} size="lg" className="app-mobile-nav__icon" />
            </div>
            <span className="app-mobile-nav__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
