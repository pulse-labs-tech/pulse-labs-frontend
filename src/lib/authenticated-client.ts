/**
 * Authenticated API Client — Fetch wrapper with auto token management.
 *
 * Features:
 * - Auto-attaches Bearer token from cookies
 * - Auto-refreshes on 401 (token rotation)
 * - Request queue: if N requests hit 401 simultaneously,
 *   only 1 refresh call is made, then all N are retried
 * - Falls back to redirect /login if refresh fails
 *
 * Usage (Server Actions / Server Components):
 *   const data = await authFetch<UserProfile>("/v1/user/profile");
 *
 * @see /features/api-docs/API_Auth_Docs.md
 */

import { redirect } from "next/navigation";
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "@/lib/token-storage";
import { apiRefreshToken } from "@/lib/auth-api";
import type { AuthApiResponse } from "@/types/auth";

// ────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";

// ────────────────────────────────────────────────────────────────
// Refresh Lock (prevents parallel refresh calls)
// ────────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token.
 * Uses a lock to prevent multiple simultaneous refresh calls.
 * Returns the new access token, or null if refresh failed.
 */
async function tryRefresh(): Promise<string | null> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const result = await apiRefreshToken(refreshToken);

      if (result.status === "0") {
        // Refresh failed — clear all tokens
        await clearAuthTokens();
        return null;
      }

      // Store NEW tokens (rotation — old ones are now invalid)
      await setAuthTokens(
        result.data.accessToken,
        result.data.refreshToken,
        result.data.expiresIn,
      );

      return result.data.accessToken;
    } catch {
      await clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ────────────────────────────────────────────────────────────────
// Authenticated Fetch
// ────────────────────────────────────────────────────────────────

interface AuthFetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  /** If true, skip auto-redirect on auth failure. Default: false */
  noRedirect?: boolean;
}

/**
 * Make an authenticated API request.
 *
 * Flow:
 * 1. Read accessToken from cookie
 * 2. If no token → try refresh → if fail → redirect /login
 * 3. Make request with Bearer token
 * 4. If 401 → try refresh → retry request once
 * 5. If retry fails → redirect /login
 */
export async function authFetch<T>(
  path: string,
  options: AuthFetchOptions = {},
): Promise<AuthApiResponse<T>> {
  const { noRedirect = false, headers: customHeaders, ...fetchOptions } = options;

  // 1. Get access token
  let accessToken = await getAccessToken();

  // 2. If no access token, try refresh
  if (!accessToken) {
    accessToken = (await tryRefresh()) ?? undefined;
    if (!accessToken) {
      if (!noRedirect) redirect("/login");
      return {
        status: "0",
        error_code: "UNAUTHORIZED",
        msg: "No valid session",
        data: {} as T,
      };
    }
  }

  // 3. Make request
  const url = `${API_BASE}${path}`;
  const response = await makeRequest<T>(url, accessToken, {
    ...fetchOptions,
    headers: {
      "X-Platform": "web",
      ...customHeaders,
    },
  });

  // 4. If 401, try refresh and retry once
  if (response.status === "0" && isUnauthorized(response.error_code)) {
    const newToken = await tryRefresh();
    if (!newToken) {
      if (!noRedirect) redirect("/login");
      return response;
    }

    // Retry with new token
    return makeRequest<T>(url, newToken, {
      ...fetchOptions,
      headers: {
        "X-Platform": "web",
        ...customHeaders,
      },
    });
  }

  return response;
}

// ────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────

async function makeRequest<T>(
  url: string,
  accessToken: string,
  options: AuthFetchOptions = {},
): Promise<AuthApiResponse<T>> {
  const { headers: customHeaders, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...customHeaders,
      },
    });

    return await response.json();
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as T,
    };
  }
}

function isUnauthorized(errorCode: string): boolean {
  return [
    "UNAUTHORIZED",
    "INVALID_REFRESH_TOKEN",
    "REFRESH_TOKEN_EXPIRED",
    "REFRESH_TOKEN_REUSED",
  ].includes(errorCode);
}

// ────────────────────────────────────────────────────────────────
// Convenience Methods
// ────────────────────────────────────────────────────────────────

export const authClient = {
  get: <T>(path: string, options?: AuthFetchOptions) =>
    authFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, data?: unknown, options?: AuthFetchOptions) =>
    authFetch<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown, options?: AuthFetchOptions) =>
    authFetch<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown, options?: AuthFetchOptions) =>
    authFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string, options?: AuthFetchOptions) =>
    authFetch<T>(path, { ...options, method: "DELETE" }),
};
