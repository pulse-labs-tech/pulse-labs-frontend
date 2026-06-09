/**
 * Auth-specific type definitions.
 * Matches backend API envelope: { status, error_code, msg, data }
 *
 * @see /features/api-docs/API_Auth_Docs.md
 */

// ────────────────────────────────────────────────────────────────
// Backend Response Envelope
// ────────────────────────────────────────────────────────────────

/**
 * Standard backend response wrapper.
 * `status` is a **string** "1" (success) or "0" (error), NOT a boolean.
 */
export interface AuthApiResponse<T = unknown> {
  status: "1" | "0";
  error_code: string;
  msg: string;
  data: T;
}

// ────────────────────────────────────────────────────────────────
// Error Codes
// ────────────────────────────────────────────────────────────────

/** All known error codes from the Auth API. */
export type AuthErrorCode =
  // Validation
  | "VALIDATION_ERROR"
  // Token (verify-email)
  | "TOKEN_MISSING"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  // Auth
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  // Email
  | "EMAIL_NOT_VERIFIED"
  | "EMAIL_ALREADY_VERIFIED"
  // Account
  | "ACCOUNT_LOCKED"
  // Rate limiting
  | "RATE_LIMITED"
  // Refresh token
  | "MISSING_REFRESH_TOKEN"
  | "INVALID_REFRESH_TOKEN"
  | "REFRESH_TOKEN_EXPIRED"
  | "REFRESH_TOKEN_REUSED"
  // Client-side only (not from backend)
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

// ────────────────────────────────────────────────────────────────
// User
// ────────────────────────────────────────────────────────────────

export type PlanType = "free" | "pro";
export type OnboardingStatus = "pending" | "completed";

/** User object returned from login endpoint. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  emailVerified: boolean;
  plan: PlanType;
  selectedPlanIntent: PlanType;
  onboardingStatus: OnboardingStatus;
  roleKbId?: string;
}

// ────────────────────────────────────────────────────────────────
// Endpoint Response Data Types
// ────────────────────────────────────────────────────────────────

/** POST /api/v1/auth/login — success data */
export interface LoginResponseData {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  nextRoute: string;
  refreshToken: string;
}

/** POST /api/v1/auth/register — success data */
export interface RegisterResponseData {
  userId: string;
  email: string;
  emailVerified: boolean;
  plan: PlanType;
  selectedPlanIntent: PlanType;
  verificationRequired: boolean;
  resendAvailableInSeconds?: number;
  nextRoute?: string;
  /** Only present in dev mode (DEBUG_RETURN_VERIFICATION_LINK=true) */
  verificationLink?: string;
  /** Present when server auto-verifies + auto-logs-in on register */
  accessToken?: string;
  refreshToken?: string;
  tokenType?: "Bearer";
  expiresIn?: number;
  user?: AuthUser;
}

/** GET /api/v1/auth/verify-email — success data */
export interface VerifyEmailResponseData {
  emailVerified: true;
  nextRoute: string;
}

/** POST /api/v1/auth/resend-verification — success data */
export interface ResendVerificationResponseData {
  /** Always `true` — server never reveals if email exists (anti-enumeration). */
  sentIfEligible: true;
  resendAvailableInSeconds: number;
  /** Only present in dev mode (DEBUG_RETURN_VERIFICATION_LINK=true) */
  verificationLink?: string;
}

/** POST /api/v1/auth/refresh — success data */
export interface RefreshTokenResponseData {
  accessToken: string;
  /** NEW refresh token — old one is invalidated (rotation). */
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

/** POST /api/v1/auth/logout — success data (empty) */
export type LogoutResponseData = Record<string, never>;

// ────────────────────────────────────────────────────────────────
// Request Payloads
// ────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  returnUrl?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedPlanIntent?: PlanType;
  acceptedTerms: true;
}

export interface LogoutRequest {
  refreshToken?: string;
  allDevices?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResendVerificationRequest {
  email: string;
}
