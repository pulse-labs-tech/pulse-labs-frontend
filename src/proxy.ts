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
 * 1. Protected route + no session → redirect /login?returnUrl=...
 * 2. Auth route (login/register) + has session → redirect /dashboard
 * 3. Otherwise → proceed normally
 *
 * @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 * @see /features/api-docs/API_Auth_Docs.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// ────────────────────────────────────────────────────────────────
// Route Definitions
// ────────────────────────────────────────────────────────────────

/** Routes accessible without authentication */
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

/** Auth routes — redirect away if already logged in */
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
];

/** Cookie keys (must match token-storage.ts) */
const ACCESS_TOKEN_COOKIE = "pulse_at";
const REFRESH_TOKEN_COOKIE = "pulse_rt";

// ────────────────────────────────────────────────────────────────
// Proxy (formerly Middleware)
// ────────────────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookies — proxy uses request.cookies (sync) or await cookies()
  const cookieStore = await cookies();
  const hasAccessToken = !!cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasRefreshToken = !!cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasSession = hasAccessToken || hasRefreshToken;

  // Determine route type
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route,
  );

  // ─── Case 1: Protected route, no session → redirect to login ──
  if (!isPublic && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    // Preserve the intended destination for post-login redirect
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // ─── Case 2: Auth route, has session → redirect to dashboard ──
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ─── Case 3: Proceed normally ──
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
    "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.jpg$|.*\\.css$|.*\\.js$).*)",
  ],
};
