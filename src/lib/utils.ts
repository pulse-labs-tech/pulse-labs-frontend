/**
 * General utility functions.
 */

/**
 * Merge CSS class names, filtering falsy values.
 * Lightweight alternative to clsx/classnames for simple cases.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date string for display.
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

/**
 * Create an absolute URL from a relative path.
 */
export function absoluteUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pulselabs.ai";
  return `${baseUrl}${path}`;
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Sleep helper for animations / delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely localizes a path/URL with the current locale, avoiding double-prefixing.
 * e.g., "/en/onboarding" with locale "en" -> "/en/onboarding"
 * e.g., "/onboarding" with locale "en" -> "/en/onboarding"
 * e.g., "onboarding" with locale "en" -> "/en/onboarding"
 * e.g., "https://example.com/foo" with locale "en" -> "https://example.com/foo" (external link remains untouched)
 */
export function getLocalizedPath(path: string, locale: string): string {
  if (!path) return `/${locale}`;

  // If path is external URL (starts with http://, https://, or //), return as-is
  if (/^(https?:)?\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : "/" + path;
  
  if (cleanPath === "/") {
    return `/${locale}`;
  }

  const segments = cleanPath.split("/").filter(Boolean);
  
  // If first segment matches a known locale (en or vi), return as-is
  if (segments.length > 0 && (segments[0] === "en" || segments[0] === "vi")) {
    return cleanPath;
  }

  return `/${locale}${cleanPath}`;
}

