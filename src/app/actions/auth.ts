"use server";

/**
 * Auth Server Actions.
 * Validates form data server-side and calls the Auth API service.
 * Stores tokens in HttpOnly cookies via token-storage.
 * Uses React 19 useActionState pattern.
 *
 * @see /features/api-docs/API_Auth_Docs.md
 *
 * Register flow (updated):
 *  1. POST /register
 *  2. If register response has accessToken → store & redirect (server auto-login)
 *  3. Else if verificationLink in response (dev mode) → verify → login → redirect
 *  4. Else → POST /login directly (server auto-verified email per server logs)
 *  5. If login returns EMAIL_NOT_VERIFIED → try resend → fallback to "check email" screen
 */

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";
import {
  apiLogin,
  apiRegister,
  apiResendVerification,
  apiLogout,
  apiVerifyEmail,
} from "@/lib/auth-api";
import {
  setAuthTokens,
  setUserData,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/token-storage";
import type { AuthErrorCode, LoginResponseData } from "@/types/auth";

// ────────────────────────────────────────────────────────────────
// Known error codes (for type-safe mapping)
// ────────────────────────────────────────────────────────────────

const KNOWN_AUTH_ERRORS: AuthErrorCode[] = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_VERIFIED",
  "ACCOUNT_LOCKED",
  "RATE_LIMITED",
  "TOKEN_MISSING",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "EMAIL_ALREADY_VERIFIED",
  "UNAUTHORIZED",
  "MISSING_REFRESH_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REUSED",
];

function mapErrorCode(code: string): AuthErrorCode {
  if (KNOWN_AUTH_ERRORS.includes(code as AuthErrorCode)) {
    return code as AuthErrorCode;
  }
  return "SERVER_ERROR";
}

// ────────────────────────────────────────────────────────────────
// Shared helper: extract token from verificationLink URL
// ────────────────────────────────────────────────────────────────

function extractToken(verificationLink: string): string | null {
  try {
    const url = new URL(verificationLink);
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Shared helper: verify token → auto login → store tokens
// Returns nextRoute on success, or throws to caller
// ────────────────────────────────────────────────────────────────

async function verifyAndLogin(
  token: string,
  email: string,
  password: string,
): Promise<{ loginData: LoginResponseData; nextRoute: string } | { error: AuthErrorCode; serverMessage?: string }> {
  const verifyResult = await apiVerifyEmail(token);

  if (
    verifyResult.status !== "1" &&
    verifyResult.error_code !== "EMAIL_ALREADY_VERIFIED"
  ) {
    return {
      error: mapErrorCode(verifyResult.error_code),
      serverMessage: verifyResult.msg,
    };
  }

  const loginResult = await apiLogin({ email, password });

  if (loginResult.status !== "1") {
    return {
      error: mapErrorCode(loginResult.error_code),
      serverMessage: loginResult.msg,
    };
  }

  const rawData = loginResult.data as unknown as Record<string, string | undefined>;
  const nextRoute =
    rawData.nextRoute ||
    rawData["next-route"] ||
    rawData.next_route ||
    "/onboarding";

  return { loginData: loginResult.data, nextRoute };
}

// ────────────────────────────────────────────────────────────────
// 1. Login Action
// ────────────────────────────────────────────────────────────────

export interface LoginActionState {
  errors?: {
    email?: string[];
    password?: string[];
  };
  globalError?: AuthErrorCode;
  serverMessage?: string;
  retryAfterSeconds?: number;
  message?: string;
}

export async function loginAction(
  prevState: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState> {
  // 1. Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnUrl: formData.get("returnUrl"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Call auth API
  const { email, password, returnUrl } = validatedFields.data;
  // returnUrl only used if backend doesn't provide nextRoute
  let nextRoute = "/onboarding";

  try {
    const result = await apiLogin({ email, password, returnUrl });

    if (result.status === "0") {
      const data = result.data as unknown as { retryAfterSeconds?: number };
      return {
        globalError: mapErrorCode(result.error_code),
        serverMessage: result.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    // 3. Store tokens in HttpOnly cookies
    await setAuthTokens(
      result.data.accessToken,
      result.data.refreshToken,
      result.data.expiresIn,
    );

    // 4. Store user data in readable cookie (for client hydration)
    await setUserData(result.data.user);

    // 5. Use backend-provided nextRoute (BE returns /onboarding or /dashboard
    //    based on onboardingStatus — always trust the backend value)
    const rawData = result.data as unknown as Record<string, string | undefined>;
    nextRoute =
      rawData.nextRoute ||
      rawData["next-route"] ||
      rawData.next_route ||
      "/onboarding";
  } catch {
    return { globalError: "NETWORK_ERROR" };
  }

  // 6. Redirect to destination
  redirect(nextRoute);
}

// ────────────────────────────────────────────────────────────────
// 2. Register Action
//
// Updated flow (2026-05-26):
//  Step 1: POST /register
//  Step 2: If register response contains accessToken → store & redirect
//          (server did auto-verify + auto-login in single step)
//  Step 3: If verificationLink in response (dev mode) → verify → login → redirect
//  Step 4: POST /login directly — server auto-verified email per server logs
//          (EMAIL_VERIFIED event fires during register in production)
//  Step 5: If EMAIL_NOT_VERIFIED → try resend (dev fallback) → show "check email" screen
// ────────────────────────────────────────────────────────────────

export interface RegisterActionState {
  errors?: Record<string, string[]>;
  globalError?: AuthErrorCode;
  serverMessage?: string;
  retryAfterSeconds?: number;
  success?: boolean;
  email?: string;
  resendAvailableInSeconds?: number;
}

export async function registerAction(
  prevState: RegisterActionState | undefined,
  formData: FormData,
): Promise<RegisterActionState> {
  // 1. Validate
  const validatedFields = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    selectedPlanIntent: formData.get("selectedPlanIntent") || "free",
    acceptedTerms: formData.get("acceptedTerms") === "true",
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  try {
    // ─── Step 1: POST /register ─────────────────────────────────
    const registerResult = await apiRegister(validatedFields.data);

    if (registerResult.status === "0") {
      const data = registerResult.data as unknown as { retryAfterSeconds?: number };
      return {
        globalError: mapErrorCode(registerResult.error_code),
        serverMessage: registerResult.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    const regData = registerResult.data;

    // ─── Step 2: Register response contains tokens (server auto-login) ──
    // Some server configs auto-verify + auto-login and return tokens directly
    if (regData.accessToken && regData.refreshToken) {
      await setAuthTokens(
        regData.accessToken,
        regData.refreshToken,
        regData.expiresIn ?? 900,
      );
      if (regData.user) {
        await setUserData(regData.user);
      }
      const nextRoute = regData.nextRoute || "/onboarding";
      redirect(nextRoute.startsWith("/") ? nextRoute : "/" + nextRoute);
    }

    // ─── Step 3: Dev-mode verificationLink (DEBUG_RETURN_VERIFICATION_LINK) ──
    if (regData.verificationLink) {
      const token = extractToken(regData.verificationLink);
      if (token) {
        const result = await verifyAndLogin(token, email, password);
        if (!("error" in result)) {
          await setAuthTokens(
            result.loginData.accessToken,
            result.loginData.refreshToken,
            result.loginData.expiresIn,
          );
          await setUserData(result.loginData.user);
          redirect(result.nextRoute);
        }
        // If verifyAndLogin failed, fall through to direct login
      }
    }

    // ─── Step 4: Direct login ───────────────────────────────────
    // Server logs confirm: EMAIL_VERIFIED fires during /register in production.
    // So the account is verified immediately — login should succeed without
    // going through the email verification flow.
    const loginResult = await apiLogin({ email, password });

    if (loginResult.status === "1") {
      await setAuthTokens(
        loginResult.data.accessToken,
        loginResult.data.refreshToken,
        loginResult.data.expiresIn,
      );
      await setUserData(loginResult.data.user);

      const rawData = loginResult.data as unknown as Record<string, string | undefined>;
      const nextRoute =
        rawData.nextRoute ||
        rawData["next-route"] ||
        rawData.next_route ||
        "/onboarding";
      redirect(nextRoute);
    }

    // ─── Step 5: Handle EMAIL_NOT_VERIFIED ──────────────────────
    // Server requires manual email verification (not auto-verify mode)
    if (loginResult.error_code === "EMAIL_NOT_VERIFIED") {
      // Try resend to get verificationLink (dev mode only)
      try {
        const resendResult = await apiResendVerification(email);
        if (resendResult.status === "1" && resendResult.data.verificationLink) {
          const token = extractToken(resendResult.data.verificationLink);
          if (token) {
            const result = await verifyAndLogin(token, email, password);
            if (!("error" in result)) {
              await setAuthTokens(
                result.loginData.accessToken,
                result.loginData.refreshToken,
                result.loginData.expiresIn,
              );
              await setUserData(result.loginData.user);
              redirect(result.nextRoute);
            }
          }
        }
      } catch (innerErr) {
        // Re-throw redirect errors — must not be swallowed here
        if (isRedirectError(innerErr)) throw innerErr;
        // Resend failed — continue to "check email" screen
      }

      // True fallback: show "check your email" verification screen
      return {
        success: true,
        email,
        resendAvailableInSeconds: regData.resendAvailableInSeconds ?? 60,
      };
    }

    // ─── Any other login error ───────────────────────────────────
    if (loginResult.status === "0") {
      const data = loginResult.data as unknown as { retryAfterSeconds?: number };
      return {
        globalError: mapErrorCode(loginResult.error_code),
        serverMessage: loginResult.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    // ─── Unexpected fallback ─────────────────────────────────────
    return {
      success: true,
      email,
      resendAvailableInSeconds: regData.resendAvailableInSeconds ?? 60,
    };
  } catch (err) {
    // Re-throw Next.js redirect errors — they must not be caught here
    if (isRedirectError(err)) throw err;
    console.error("[registerAction] error:", err);
    return { globalError: "NETWORK_ERROR" };
  }
}

// ────────────────────────────────────────────────────────────────
// 3. Forgot Password Action
// ────────────────────────────────────────────────────────────────

export interface ForgotPasswordActionState {
  errors?: {
    email?: string[];
  };
  globalError?: AuthErrorCode;
  success?: boolean;
}

export async function forgotPasswordAction(
  prevState: ForgotPasswordActionState | undefined,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  // 1. Validate
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Call API
  // TODO: Replace with dedicated forgot-password API when available
  try {
    return { success: true };
  } catch {
    return { globalError: "NETWORK_ERROR" };
  }
}

// ────────────────────────────────────────────────────────────────
// 4. Resend Verification Action
// ────────────────────────────────────────────────────────────────

export interface ResendVerificationResult {
  success?: boolean;
  resendAvailableInSeconds?: number;
  error?: AuthErrorCode;
  serverMessage?: string;
  retryAfterSeconds?: number;
  /** If auto-verify succeeded, redirect to this route */
  autoVerifiedRedirect?: string;
}

export async function resendVerificationAction(
  email: string,
  password?: string,
): Promise<ResendVerificationResult> {
  try {
    const result = await apiResendVerification(email);

    if (result.status === "0") {
      const data = result.data as unknown as { retryAfterSeconds?: number };
      return {
        error: mapErrorCode(result.error_code),
        serverMessage: result.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    // Auto-verify if verificationLink is present and password provided
    if (result.data.verificationLink) {
      const token = extractToken(result.data.verificationLink);

      if (token && password) {
        try {
          const verifyLoginResult = await verifyAndLogin(token, email, password);

          if (!("error" in verifyLoginResult)) {
            await setAuthTokens(
              verifyLoginResult.loginData.accessToken,
              verifyLoginResult.loginData.refreshToken,
              verifyLoginResult.loginData.expiresIn,
            );
            await setUserData(verifyLoginResult.loginData.user);

            return {
              success: true,
              autoVerifiedRedirect: verifyLoginResult.nextRoute,
            };
          }
        } catch {
          // Auto-verify failed silently, fall through
        }
      } else if (token) {
        // No password but have token → verify only, redirect to login
        try {
          const verifyResult = await apiVerifyEmail(token);
          if (
            verifyResult.status === "1" ||
            verifyResult.error_code === "EMAIL_ALREADY_VERIFIED"
          ) {
            return { success: true, autoVerifiedRedirect: "/login" };
          }
        } catch {
          // fall through
        }
      }
    }

    // If no verificationLink: server auto-verified (per logs) → try direct login
    if (password) {
      try {
        const loginResult = await apiLogin({ email, password });
        if (loginResult.status === "1") {
          await setAuthTokens(
            loginResult.data.accessToken,
            loginResult.data.refreshToken,
            loginResult.data.expiresIn,
          );
          await setUserData(loginResult.data.user);

          const rawData = loginResult.data as unknown as Record<string, string | undefined>;
          const nextRoute =
            rawData.nextRoute ||
            rawData["next-route"] ||
            rawData.next_route ||
            "/onboarding";

          return { success: true, autoVerifiedRedirect: nextRoute };
        }
      } catch {
        // Login failed silently, fall through to countdown reset
      }
    }

    return {
      success: true,
      resendAvailableInSeconds: result.data.resendAvailableInSeconds,
    };
  } catch {
    return { error: "NETWORK_ERROR" };
  }
}

// ────────────────────────────────────────────────────────────────
// 5. Logout Action
// ────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (accessToken) {
      await apiLogout(accessToken, {
        refreshToken: refreshToken || undefined,
      });
    }
  } catch {
    // Even if API call fails, we still clear local tokens
  }

  await clearAuthTokens();
  redirect("/login");
}

// ────────────────────────────────────────────────────────────────
// 6. Verify Email Action
// ────────────────────────────────────────────────────────────────

export interface VerifyEmailResult {
  success?: boolean;
  error?: AuthErrorCode;
  serverMessage?: string;
  nextRoute?: string;
}

export async function verifyEmailAction(
  token: string,
): Promise<VerifyEmailResult> {
  try {
    const result = await apiVerifyEmail(token);

    if (result.status === "0") {
      return {
        error: mapErrorCode(result.error_code),
        serverMessage: result.msg,
      };
    }

    return {
      success: true,
      nextRoute: result.data.nextRoute || "/login",
    };
  } catch {
    return { error: "NETWORK_ERROR" };
  }
}
