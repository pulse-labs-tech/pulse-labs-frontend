/**
 * Auth API service — centralized auth endpoint calls.
 *
 * Uses raw fetch (NOT apiClient) because:
 * 1. Server Actions run server-side — no need for client interceptors
 * 2. Auth endpoints require unique headers (X-Platform)
 * 3. Response envelope differs from generic ApiResponse<T>
 *
 * @see /features/api-docs/API_Auth_Docs.md
 */

import type {
  AuthApiResponse,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
  VerifyEmailResponseData,
  ResendVerificationResponseData,
  RefreshTokenResponseData,
  LogoutResponseData,
  LogoutRequest,
} from "@/types/auth";

// ────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";

// ────────────────────────────────────────────────────────────────
// Internal fetch helper
// ────────────────────────────────────────────────────────────────

/**
 * Thin wrapper around `fetch` that:
 * - Prepends the API base URL
 * - Sets default JSON headers
 * - Parses response into `AuthApiResponse<T>`
 * - Never throws on HTTP errors — always returns the envelope
 */
async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<AuthApiResponse<T>> {
  const url = `${AUTH_API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers as Record<string, string>),
      },
    });

    // Try to parse JSON body (even error responses have a body)
    const json: AuthApiResponse<T> = await response.json();
    return json;
  } catch {
    // Network error / JSON parse failure → synthetic error envelope
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.",
      data: {} as T,
    };
  }
}

// ────────────────────────────────────────────────────────────────
// 1. Register
// ────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/auth/register`
 *
 * Silent policy: if email already exists, server still returns 200
 * and sends an "account exists" notification email.
 */
export async function apiRegister(
  data: RegisterRequest,
): Promise<AuthApiResponse<RegisterResponseData>> {
  return authFetch<RegisterResponseData>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────
// 2. Login
// ────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/auth/login`
 *
 * Requires `X-Platform: web` header.
 * V1.1: refreshToken returned in body (no HttpOnly cookie).
 */
export async function apiLogin(
  data: LoginRequest,
): Promise<AuthApiResponse<LoginResponseData>> {
  return authFetch<LoginResponseData>("/v1/auth/login", {
    method: "POST",
    headers: { "X-Platform": "web" },
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────
// 3. Verify Email
// ────────────────────────────────────────────────────────────────

/**
 * `GET /api/v1/auth/verify-email?token=<TOKEN>`
 *
 * Called when user clicks the verification link in their email.
 */
export async function apiVerifyEmail(
  token: string,
): Promise<AuthApiResponse<VerifyEmailResponseData>> {
  return authFetch<VerifyEmailResponseData>(
    `/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
}

// ────────────────────────────────────────────────────────────────
// 4. Resend Verification
// ────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/auth/resend-verification`
 *
 * Silent — always returns 200 regardless of email existence.
 * `sentIfEligible: true` does NOT confirm email was actually sent.
 */
export async function apiResendVerification(
  email: string,
): Promise<AuthApiResponse<ResendVerificationResponseData>> {
  return authFetch<ResendVerificationResponseData>(
    "/v1/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

// ────────────────────────────────────────────────────────────────
// 5. Logout
// ────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/auth/logout`
 *
 * Requires `Authorization: Bearer <accessToken>`.
 * Optionally revoke refreshToken or all devices.
 */
export async function apiLogout(
  accessToken: string,
  data?: LogoutRequest,
): Promise<AuthApiResponse<LogoutResponseData>> {
  return authFetch<LogoutResponseData>("/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data ?? {}),
  });
}

// ────────────────────────────────────────────────────────────────
// 6. Refresh Token
// ────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/auth/refresh`
 *
 * Token rotation — old refreshToken is invalidated after use.
 * FE MUST store the new tokens immediately.
 *
 * If a used token is submitted again → REFRESH_TOKEN_REUSED →
 * entire token family is revoked → forced re-login.
 */
export async function apiRefreshToken(
  refreshToken: string,
): Promise<AuthApiResponse<RefreshTokenResponseData>> {
  return authFetch<RefreshTokenResponseData>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
