/**
 * Next.js 16 Proxy — Server-side route protection.
 *
 * ⚠️ BREAKING CHANGE (Next.js 16):
 *   middleware.ts → proxy.ts
 *   export function middleware() → export default async function proxy()
 *   Runtime: Node.js (not Edge)
 *
 * Runs BEFORE every matched request. Checks auth cookies
 * and redirects accordingly:
 *
 * 1. Missing locale segment → redirect to /:locale/...
 * 2. Protected route + no session → redirect /:locale/login?returnUrl=...
 * 3. Auth route + has session + not onboarded → redirect /:locale/onboarding
 * 4. Auth route + has session + onboarded → redirect /:locale/dashboard
 * 5. Onboarding route + onboarded → redirect /:locale/dashboard
 * 6. Protected route + not onboarded → redirect /:locale/onboarding
 * 7. Otherwise → proceed normally
 *
 * @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 * @see /features/api-docs/API_Auth_Docs.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// ────────────────────────────────────────────────────────────────
// Localization and Route Definitions
// ────────────────────────────────────────────────────────────────

const LOCALES = ["vi", "en"];
const DEFAULT_LOCALE = "vi";

/** Routes accessible without authentication (subpath check) */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/verify-email-pending",
  "/terms",
  "/privacy",
  "/contact",
  "/about",
  "/features",
  "/pricing",
];

/** Auth routes — redirect away if already logged in (subpath check) */
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
];

/** Cookie keys (must match token-storage.ts) */
const ACCESS_TOKEN_COOKIE = "pulse_at";
const REFRESH_TOKEN_COOKIE = "pulse_rt";
const USER_DATA_COOKIE = "pulse_user";
const LOCALE_COOKIE = "pulse_locale";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Read onboardingStatus from the pulse_user cookie. */
function getOnboardingStatus(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): "completed" | "pending" | null {
  const raw = cookieStore.get(USER_DATA_COOKIE)?.value;
  if (!raw) return null;

  const tryParse = (str: string): "completed" | "pending" | null => {
    try {
      const parsed = JSON.parse(str) as { onboardingStatus?: string };
      return parsed.onboardingStatus === "completed" ? "completed" : "pending";
    } catch {
      return null;
    }
  };

  // Attempt 1: raw is plain JSON
  const direct = tryParse(raw);
  if (direct) return direct;

  // Attempt 2: URL-decode once
  try {
    const decoded = decodeURIComponent(raw);
    const once = tryParse(decoded);
    if (once) return once;

    // Attempt 3: URL-decode twice (double-encoded edge case)
    const decodedTwice = decodeURIComponent(decoded);
    const twice = tryParse(decodedTwice);
    if (twice) return twice;
  } catch {
    // ignore decode errors
  }

  return null;
}

/** Check if pathname is the /onboarding wizard route. */
function isOnboardingRoute(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

/**
 * Check if pathname is the post-register welcome page.
 * /welcome is a special transitional page between register and onboarding.
 * It should NEVER be redirected away automatically (even for onboarded users).
 */
function isWelcomeRoute(pathname: string): boolean {
  return pathname === "/welcome";
}

/** Extract locale and subpath from pathname */
function getLocaleAndSubpath(pathname: string): { locale: string | null; subpath: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && LOCALES.includes(segments[0])) {
    const locale = segments[0];
    const subpath = "/" + segments.slice(1).join("/");
    return { locale, subpath };
  }
  return { locale: null, subpath: pathname };
}

// ────────────────────────────────────────────────────────────────
// Proxy (formerly Middleware)
// ────────────────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Failsafe: Detect and redirect duplicate or multiple locale prefixes in the URL (e.g., /en/en/onboarding)
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length >= 2 &&
    LOCALES.includes(segments[0]) &&
    LOCALES.includes(segments[1])
  ) {
    let firstNonLocaleIndex = 0;
    while (
      firstNonLocaleIndex < segments.length &&
      LOCALES.includes(segments[firstNonLocaleIndex])
    ) {
      firstNonLocaleIndex++;
    }
    const finalLocale = segments[0];
    const restPath = segments.slice(firstNonLocaleIndex).join("/");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${finalLocale}${restPath ? "/" + restPath : ""}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Extract locale and relative subpath (e.g. "/vi/dashboard" -> "vi", "/dashboard")
  const { locale: pathLocale, subpath } = getLocaleAndSubpath(pathname);

  // Read cookies — proxy uses request.cookies (sync) or await cookies()
  const cookieStore = await cookies();

  // Determine preferred locale
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const preferredLocale = cookieLocale && LOCALES.includes(cookieLocale)
    ? cookieLocale
    : DEFAULT_LOCALE;

  // ─── Case 0: Missing locale segment → Redirect to /:locale/... ──
  if (!pathLocale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${preferredLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Session state
  const hasAccessToken = !!cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasRefreshToken = !!cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasUser = !!cookieStore.get(USER_DATA_COOKIE)?.value;
  
  // A valid session requires refresh token (long-lived) and user metadata.
  // We check refreshToken as source of truth because accessToken expires in 15min
  // and gets cleared independently — we don't want that to cause an orphan detection.
  const hasSession = hasRefreshToken && hasUser;

  // Orphaned state: tokens exist but no user metadata (or user exists but no tokens at all)
  // Only treat as orphaned if refreshToken state and user state are mismatched.
  // This avoids false-positives when only the short-lived accessToken has expired.
  const isOrphaned = hasRefreshToken !== hasUser;

  if (isOrphaned) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${pathLocale}/login`;
    
    // Preserve returnUrl unless we are already on onboarding or login
    if (pathname !== `/${pathLocale}` && !pathname.includes("/login") && !pathname.includes("/onboarding")) {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    
    const response = NextResponse.redirect(loginUrl);
    // Must include path, secure, sameSite to correctly clear cookies on all browsers (esp. Chrome)
    const clearOpts = { path: "/", secure: process.env.NODE_ENV === "production", sameSite: "lax" as const };
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...clearOpts, maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...clearOpts, maxAge: 0 });
    response.cookies.set(USER_DATA_COOKIE, "", { ...clearOpts, maxAge: 0 });
    return response;
  }

  // Determine route type
  const isPublic = PUBLIC_ROUTES.some(
    (route) => subpath === route || subpath.startsWith(route + "/"),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => subpath === route,
  );

  // ─── Case 1: Protected route, no session → redirect to login ──
  if (!isPublic && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${pathLocale}/login`;

    // Preserve the intended destination for post-login redirect (retaining locale)
    if (pathname !== `/${pathLocale}`) {
      loginUrl.searchParams.set("returnUrl", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // ─── Case 2+: Has session → route based on onboardingStatus ──
  if (hasSession) {
    const onboardingStatus = getOnboardingStatus(cookieStore);
    const isOnboarded = onboardingStatus === "completed";

    // ── Auth route + session → redirect based on onboarding ──
    // /welcome is the post-register transition page, not a standard auth route
    if (isAuthRoute) {
      return NextResponse.redirect(
        new URL(`/${pathLocale}${isOnboarded ? "/dashboard" : "/onboarding"}`, request.url),
      );
    }

    // ── /welcome: always accessible when authenticated — let through ──
    // Post-register welcome page must never be auto-redirected away.
    // The page itself handles the next step (→ /onboarding or → /dashboard).
    if (isWelcomeRoute(subpath)) {
      return NextResponse.next();
    }

    // ── Onboarding route + already onboarded → redirect to dashboard ──
    if (isOnboardingRoute(subpath) && isOnboarded) {
      const url = new URL(request.url);
      const isForced = url.searchParams.get("force") === "true";
      if (!isForced) {
        return NextResponse.redirect(
          new URL(`/${pathLocale}/dashboard`, request.url),
        );
      }
    }

    // ── Protected route + not onboarded → redirect to onboarding ──
    // Commented out to allow users to view the dashboard directly and choose when to set up their Knowledge Base.
    /*
    if (!isPublic && !isOnboardingRoute(subpath) && !isWelcomeRoute(subpath) && !isOnboarded) {
      return NextResponse.redirect(
        new URL(`/${pathLocale}/onboarding`, request.url),
      );
    }
    */
  }

  // ─── Default: Proceed normally ──
  return NextResponse.next();
}

// ────────────────────────────────────────────────────────────────
// Matcher — Skip static files, API routes, Next.js internals
// ────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/ (API routes)
     * - _next/ (Next.js internals)
     * - Static files with extensions (.ico, .png, .jpg, .svg, .css, .js, etc.)
     */
    "/((?!api|videos/|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.jpg$|.*\\.css$|.*\\.js$|.*\\.m3u8$|.*\\.ts$).*)",
  ],
};

