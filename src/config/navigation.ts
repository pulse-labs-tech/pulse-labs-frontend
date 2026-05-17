/**
 * Navigation configuration.
 * Single source of truth for all navigation items across header, footer, mobile menu.
 */

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  external?: boolean;
  disabled?: boolean;
  children?: NavItem[];
}

export const mainNavigation: NavItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Features",
    href: "/features",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

export const footerNavigation = {
  product: [
    { title: "Features", href: "/features" },
    { title: "Pricing", href: "/pricing" },
    { title: "Integrations", href: "/integrations" },
    { title: "Changelog", href: "/changelog" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Blog", href: "/blog" },
    { title: "Careers", href: "/careers" },
    { title: "Contact", href: "/contact" },
  ],
  legal: [
    { title: "Privacy", href: "/privacy" },
    { title: "Terms", href: "/terms" },
  ],
} as const;
