/**
 * Token Storage Service — Secure auth token management via HttpOnly cookies.
 *
 * Architecture Decision:
 * - accessToken  → HttpOnly cookie (middleware-readable, XSS-safe)
 * - refreshToken → HttpOnly cookie (never exposed to client JS)
 * - userData     → non-HttpOnly cookie (client-readable for hydration)
 *
 * WHY COOKIES (not localStorage):
 * 1. HttpOnly cookies are immune to XSS attacks
 * 2. Next.js middleware can read cookies for route protection
 * 3. Server Actions/Components can read cookies for API calls
 * 4. Automatic transmission on same-origin requests
 *
 * @see /features/api-docs/API_Auth_Docs.md — V1.1 body-only tokens
 */

import { cookies } from "next/headers";
import type { AuthUser } from "@/types/auth";

// ────────────────────────────────────────────────────────────────
// Cookie Keys
// ────────────────────────────────────────────────────────────────

const COOKIE_KEYS = {
  /** JWT access token — HttpOnly, short-lived (15 min) */
  ACCESS_TOKEN: "pulse_at",
  /** Refresh token — HttpOnly, long-lived (30 days) */
  REFRESH_TOKEN: "pulse_rt",
  /** Basic user data — readable by client JS for hydration */
  USER_DATA: "pulse_user",
} as const;

// ────────────────────────────────────────────────────────────────
// Cookie Options
// ────────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const BASE_OPTIONS = {
  secure: IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
};

// ────────────────────────────────────────────────────────────────
// Store Tokens (after login or refresh)
// ────────────────────────────────────────────────────────────────

/**
 * Store auth tokens in HttpOnly cookies.
 * Called from Server Actions (login, refresh).
 *
 * @param accessToken  - JWT access token (15 min TTL)
 * @param refreshToken - Opaque refresh token (rotation — each one is single-use)
 * @param expiresIn    - Access token TTL in seconds (default: 900)
 */
export async function setAuthTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number = 900,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_KEYS.ACCESS_TOKEN, accessToken, {
    ...BASE_OPTIONS,
    httpOnly: true,
    maxAge: expiresIn,
  });

  cookieStore.set(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
    ...BASE_OPTIONS,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

// ────────────────────────────────────────────────────────────────
// Store User Data (client-readable for hydration)
// ────────────────────────────────────────────────────────────────

/**
 * Store basic user info in a non-HttpOnly cookie.
 * Client-side AuthProvider reads this to hydrate user state
 * without an extra API call.
 *
 * ⚠️ Only non-sensitive data. Never store tokens here.
 */
export async function setUserData(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();

  // Only store what the UI needs for hydration
  const safeData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    plan: user.plan,
    onboardingStatus: user.onboardingStatus,
  };

  // URL-encode so the JSON is safe in cookie header (special chars: ", {, }, etc.)
  const encoded = encodeURIComponent(JSON.stringify(safeData));

  cookieStore.set(COOKIE_KEYS.USER_DATA, encoded, {
    ...BASE_OPTIONS,
    httpOnly: false, // Client-readable
    maxAge: 30 * 24 * 60 * 60,
  });
}

// ────────────────────────────────────────────────────────────────
// Read Tokens (for Server Actions / Server Components)
// ────────────────────────────────────────────────────────────────

/** Get the current access token (server-side only). */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
}

/** Get the current refresh token (server-side only). */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
}

/** Get stored user data (server-side). */
export async function getUserData(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_KEYS.USER_DATA)?.value;
  if (!raw) return null;

  try {
    // Try direct parse first (in case value wasn't encoded)
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed && typeof parsed === "object" && parsed.email) return parsed;
    } catch {
      // fall through to decode
    }
    // Decode URL-encoded value then parse
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as AuthUser;
    if (!parsed || typeof parsed !== "object" || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Clear All Auth Data (logout)
// ────────────────────────────────────────────────────────────────

/**
 * Clear all auth cookies.
 * Called from logout Server Action.
 */
export async function clearAuthTokens(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_KEYS.ACCESS_TOKEN);
  cookieStore.delete(COOKIE_KEYS.REFRESH_TOKEN);
  cookieStore.delete(COOKIE_KEYS.USER_DATA);
}

// ────────────────────────────────────────────────────────────────
// Exported Constants (for middleware, which can't use async cookies)
// ────────────────────────────────────────────────────────────────

export { COOKIE_KEYS };
