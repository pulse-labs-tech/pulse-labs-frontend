/**
 * Settings / Plan Gate type definitions.
 * Matches backend API contract for Settings-Plan-Gate-Minimal.
 *
 * @see /features/final-docs/Settings-Plan-Gate-Minimal/api/technical-contract.md
 */

export type PlanCode = "free" | "pro";

export type QuotaKey =
  | "role_kbs"
  | "storage"
  | "compiles"
  | "queries"
  | "domains";

export type QuotaStatus = "ok" | "warning" | "exceeded" | "unlimited" | "unavailable";

export type UpgradeIntentStatus =
  | "none"
  | "recorded"
  | "checkout_pending"
  | "activated"
  | "failed";

export type GateReason =
  | "ROLE_LIMIT_REACHED"
  | "STORAGE_LIMIT_REACHED"
  | "COMPILE_LIMIT_REACHED"
  | "QUERY_LIMIT_REACHED"
  | "DOMAIN_LIMIT_REACHED"
  | "PLAN_REQUIRED";

export interface QuotaCardData {
  key: QuotaKey;
  label: string;
  used: number;
  limit: number | null; // null = unlimited
  percentage: number | null;
  window: "daily" | "monthly" | "none" | null;
  resetsAt: string | null;
  status: QuotaStatus;
  helperCopy?: string | null;
}

export interface PlanFeature {
  label: string;
  free: string | null;
  pro: string;
}

export interface PlanDto {
  code: PlanCode;
  displayName: string;
  features: PlanFeature[];
  upgradeHref?: string | null;
  upgradeCta?: string | null;
}

export interface SettingsUserContext {
  id: string;
  email: string;
  displayName: string | null;
  isEmailVerified: boolean;
  plan: PlanCode;
  selectedPlanIntent: PlanCode | null;
  primaryRoleName: string | null;
  primaryRoleKbId: string | null;
}

export interface SettingsOverviewData {
  user: SettingsUserContext;
  currentPlan: PlanDto;
  plans: PlanDto[];
  quotas: QuotaCardData[];
  upgradeIntent: {
    status: UpgradeIntentStatus;
    recordedAt: string | null;
  };
  sectionErrors: Array<{
    section: string;
    error_code: string;
    msg: string;
  }>;
  serverTime: string;
}

// Plan Gate types
export interface PlanGateEvaluateRequest {
  action: string;
  roleKbId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

export interface PlanGateResult {
  allowed: boolean;
  hardBlock: boolean;
  reason: GateReason | null;
  action: string;
  plan: PlanCode;
  quota?: {
    key: QuotaKey;
    used: number;
    limit: number | null;
    resetsAt: string | null;
  } | null;
  upgradeHref?: string | null;
}

export interface PlanGateEvaluateResponseData {
  gate: PlanGateResult;
}

// Upgrade intent types
export interface UpgradeIntentRequest {
  targetPlan: "pro";
  source: string;
}

export interface UpgradeIntentResponseData {
  intent: {
    id: string;
    status: UpgradeIntentStatus;
    targetPlan: PlanCode;
    recordedAt: string;
    activePlanUnchanged: true;
  };
}

// Action result types for Server Actions
export interface SettingsActionResult<T = unknown> {
  status: "1" | "0";
  error_code: string;
  msg: string;
  data: T;
}

export type SettingsErrorCode =
  | "UNAUTHORIZED"
  | "EMAIL_NOT_VERIFIED"
  | "ONBOARDING_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "ROLE_LIMIT_REACHED"
  | "STORAGE_LIMIT_REACHED"
  | "COMPILE_LIMIT_REACHED"
  | "QUERY_LIMIT_REACHED"
  | "DOMAIN_LIMIT_REACHED"
  | "PLAN_REQUIRED"
  | "QUOTA_UNAVAILABLE"
  | "SETTINGS_SECTION_UNAVAILABLE"
  | "UPGRADE_INTENT_FAILED"
  | "LOGOUT_FAILED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";
