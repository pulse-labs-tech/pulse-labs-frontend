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
  let nextRoute = returnUrl || "/dashboard";

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

    // 5. Use backend-provided nextRoute (handling possible naming variations)
    const rawData = result.data as unknown as Record<string, string | undefined>;
    nextRoute =
      rawData.nextRoute ||
      rawData["next-route"] ||
      rawData.next_route ||
      returnUrl ||
      "/dashboard";
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
  const { email, password } = validatedFields.data;
  let nextRoute = "";
  let loginData: LoginResponseData | null = null;

  try {
    const result = await apiRegister(validatedFields.data);

    if (result.status === "0") {
      const data = result.data as unknown as { retryAfterSeconds?: number };
      return {
        globalError: mapErrorCode(result.error_code),
        serverMessage: result.msg,
        retryAfterSeconds: data?.retryAfterSeconds,
      };
    }

    // Success — Auto verify if verificationLink is present
    if (result.data.verificationLink) {
      const url = new URL(result.data.verificationLink);
      const token = url.searchParams.get("token");
      if (token) {
        // Verify email
        const verifyResult = await apiVerifyEmail(token);
        if (verifyResult.status === "1" || verifyResult.error_code === "EMAIL_ALREADY_VERIFIED") {
          // Immediately login
          const loginResult = await apiLogin({ email, password });
          if (loginResult.status === "1") {
            loginData = loginResult.data;
            const loginRawData = loginResult.data as unknown as Record<string, string | undefined>;
            nextRoute =
              loginRawData.nextRoute ||
              loginRawData["next-route"] ||
              loginRawData.next_route ||
              "/dashboard";
          } else {
            return {
              globalError: mapErrorCode(loginResult.error_code),
              serverMessage: loginResult.msg,
            };
          }
        } else {
          return {
            globalError: mapErrorCode(verifyResult.error_code),
            serverMessage: verifyResult.msg,
          };
        }
      } else {
        return {
          globalError: "TOKEN_INVALID",
          serverMessage: "Không tìm thấy mã xác thực trong đường dẫn đăng ký.",
        };
      }
    } else {
      // No verification link (silent register policy, email already exists / already verified)
      const loginResult = await apiLogin({ email, password });
      if (loginResult.status === "1") {
        loginData = loginResult.data;
        const loginRawData = loginResult.data as unknown as Record<string, string | undefined>;
        nextRoute =
          loginRawData.nextRoute ||
          loginRawData["next-route"] ||
          loginRawData.next_route ||
          "/dashboard";
      } else {
        if (loginResult.error_code === "INVALID_CREDENTIALS") {
          return {
            globalError: "EMAIL_ALREADY_VERIFIED",
            serverMessage: "Email này đã được sử dụng. Vui lòng đăng nhập bằng tài khoản của bạn.",
          };
        }
        return {
          globalError: mapErrorCode(loginResult.error_code),
          serverMessage: loginResult.msg,
        };
      }
    }
  } catch (err) {
    console.error("Registration/Auto-verification error:", err);
    return { globalError: "NETWORK_ERROR" };
  }

  // 3. Store tokens & redirect outside try-catch
  if (loginData && nextRoute) {
    await setAuthTokens(
      loginData.accessToken,
      loginData.refreshToken,
      loginData.expiresIn,
    );
    await setUserData(loginData.user);
    redirect(nextRoute);
  }

  return { globalError: "SERVER_ERROR", serverMessage: "Đăng ký thành công nhưng không thể đăng nhập tự động." };
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

    // ─── Dev mode: auto-verify if verificationLink is present ──
    if (result.data.verificationLink) {
      try {
        const url = new URL(result.data.verificationLink);
        const token = url.searchParams.get("token");

        if (token) {
          const verifyResult = await apiVerifyEmail(token);

          if (
            verifyResult.status === "1" ||
            verifyResult.error_code === "EMAIL_ALREADY_VERIFIED"
          ) {
            // Auto-login if password was provided
            if (password) {
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
                  "/dashboard";

                return {
                  success: true,
                  autoVerifiedRedirect: nextRoute,
                };
              }
            }

            // No password → just report success, user can go to login
            return {
              success: true,
              autoVerifiedRedirect: "/login",
            };
          }
        }
      } catch {
        // Auto-verify failed silently, fall through to normal response
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
