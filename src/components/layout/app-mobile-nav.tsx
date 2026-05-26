"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Plus,
} from "lucide-react";
import { useTranslation } from "@/contexts/locale-context";

interface AppMobileNavProps {
  locale: string;
}

export function AppMobileNav({ locale }: AppMobileNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    {
      href: `/${locale}/dashboard`,
      label: t("common.dashboard", "Dashboard"),
      icon: LayoutDashboard,
      match: `/${locale}/dashboard`,
    },
    {
      href: `/${locale}/query`,
      label: t("common.query", "Hỏi đáp"),
      icon: MessageSquare,
      match: `/${locale}/query`,
    },
    {
      href: `/${locale}/wiki`,
      label: t("common.wiki", "Wiki"),
      icon: BookOpen,
      match: `/${locale}/wiki`,
    },
    {
      href: `/${locale}/compile/new`,
      label: t("common.addDoc", "Nạp tài liệu"),
      icon: Plus,
      match: `/${locale}/compile`,
    },
  ];

  return (
    <nav
      className="app-mobile-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.match || pathname.startsWith(tab.match + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`app-mobile-nav__item${isActive ? " app-mobile-nav__item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="app-mobile-nav__icon" aria-hidden="true" />
            <span className="app-mobile-nav__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
