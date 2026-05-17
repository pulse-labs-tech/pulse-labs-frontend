/**
 * Centralized site configuration for SEO and metadata.
 * Used by layout.tsx, sitemap.ts, robots.ts, and all page metadata.
 *
 * Product: Pulse Knowledge — AI-powered personal knowledge base.
 */

export const siteConfig = {
  name: "Pulse Knowledge",
  shortName: "Pulse Knowledge",
  description:
    "AI Researcher cá nhân hoá — tích lũy knowledge theo domain. Hỏi gì cũng có câu trả lời có nguồn, dù 10 năm sau vẫn còn đó.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL || "https://pulseknowledge.com",
  ogImage: "/images/og-default.png",
  locale: "vi_VN",
  creator: "Pulse Knowledge Team",
  keywords: [
    "AI knowledge base",
    "personal knowledge base",
    "AI researcher",
    "knowledge management",
    "domain expert AI",
    "query AI",
    "pulse knowledge",
    "tích lũy knowledge",
    "KB cá nhân",
    "nghiên cứu AI",
  ],
  links: {
    twitter: "https://twitter.com/pulseknowledge",
    github: "https://github.com/pulse-labs-tech",
  },
} as const;

export type SiteConfig = typeof siteConfig;
