import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Robots.txt configuration.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
