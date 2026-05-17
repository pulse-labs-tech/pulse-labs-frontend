import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ============================================================
     Rendering & Performance
     ============================================================ */

  /** React strict mode for catching bugs early */
  reactStrictMode: true,

  /** Enable experimental features */
  experimental: {
    /** Optimize package imports for smaller bundles */
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "lodash-es",
    ],
  },

  /* ============================================================
     Image Optimization
     ============================================================ */
  images: {
    /** Modern image formats */
    formats: ["image/avif", "image/webp"],

    /** Remote image patterns (add your CDN/API domains) */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.pulselabs.ai",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],

    /** Device widths for responsive images (mobile → 4K) */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],

    /** Image widths for `sizes` attribute */
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  /* ============================================================
     Security Headers
     ============================================================ */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        /** Cache static assets aggressively */
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  /* ============================================================
     Redirects (add as needed)
     ============================================================ */
  async redirects() {
    return [];
  },
};

export default nextConfig;
