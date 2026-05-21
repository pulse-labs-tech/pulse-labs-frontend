"use server";

/**
 * Auth Server Actions.
 * Validates form data server-side and calls the Auth API service.
 * Stores tokens in HttpOnly cookies via token-storage.
 * Uses React 19 useActionState pattern.
 *
 * @see /features/api-docs/API_Auth_Docs.md
 */

import { redirect } from "next/navigation";
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
} from "@/lib/auth-api";
import {
  setAuthTokens,
  setUserData,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/token-storage";
import type { AuthErrorCode } from "@/types/auth";

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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Call auth API
  const { email, password } = validatedFields.data;
  let nextRoute = "/dashboard";

  try {
    const result = await apiLogin({ email, password });

    if (result.status === "0") {
      const data = result.data as any;
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

    // 5. Use backend-provided nextRoute
    nextRoute = result.data.nextRoute || "/dashboard";
  } catch {
    return { globalError: "NETWORK_ERROR" };
  }

  // 6. Redirect to destination
  redirect(nextRoute);
}

// ────────────────────────────────────────────────────────────────
// 2. Register Action
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
  // 1. Validate form fields
  const validatedFields = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    selectedPlanIntent: formData.get("selectedPlanIntent") || "free",
    acceptedTerms: formData.get("acceptedTerms") === "true",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Call auth API
  try {
    const result = await apiRegister(validatedFields.data);

    if (result.status === "0") {
      const data = result.data as any;
      return {
        globalError: mapErrorCode(result.error_code),
        serverMessage: result.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    // Success — return data for "check your email" UI state
    return {
      success: true,
      email: result.data.email,
      resendAvailableInSeconds: result.data.resendAvailableInSeconds,
    };
  } catch {
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
}

export async function resendVerificationAction(
  email: string,
): Promise<ResendVerificationResult> {
  try {
    const result = await apiResendVerification(email);

    if (result.status === "0") {
      const data = result.data as any;
      return {
        error: mapErrorCode(result.error_code),
        serverMessage: result.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
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

    // Call backend to invalidate tokens
    if (accessToken) {
      await apiLogout(accessToken, {
        refreshToken: refreshToken || undefined,
      });
    }
  } catch {
    // Even if API call fails, we still clear local tokens
  }

  // Clear all auth cookies
  await clearAuthTokens();

  // Redirect to login
  redirect("/login");
}
