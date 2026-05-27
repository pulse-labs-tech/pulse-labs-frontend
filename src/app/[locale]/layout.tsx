import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { generateOrganizationJsonLd } from "@/lib/seo";
import { getUserData } from "@/lib/token-storage";
import { AuthProvider } from "@/contexts/auth-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { getDictionary } from "@/dictionaries";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { GlobalSearchPalette } from "@/components/layout";
import "../globals.css";

/* ============================================================
   Fonts — Self-hosted via next/font for zero layout shift
   ============================================================ */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ============================================================
   Viewport — Responsive configuration
   ============================================================ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/* ============================================================
   Metadata — Root-level SEO configuration
   ============================================================ */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@pulseknowledge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

/* ============================================================
   Root Layout
   ============================================================ */

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Read user data from cookie (server-side) for AuthProvider hydration
  const initialUser = await getUserData();
  const organizationJsonLd = generateOrganizationJsonLd();
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://cdn.lineicons.com/5.1/line/lineicons.css" rel="stylesheet" />
        <link href="https://cdn.lineicons.com/5.1/solid/lineicons-solid.css" rel="stylesheet" />
        {/* JSON-LD Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Skip navigation link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        {/* Auth state provider — reads initial user from cookie */}
        <AuthProvider initialUser={initialUser}>
          {/* Translation provider for client/server components context */}
          <LocaleProvider locale={locale} dictionary={dictionary}>
            {/* Navigation progress bar — shown on every route transition */}
            <NavigationProgress />
            {/* Global search palette command menu */}
            <GlobalSearchPalette />
            {/* Content — pages handle their own layout structure */}
            <div className="flex-1">
              {children}
            </div>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
