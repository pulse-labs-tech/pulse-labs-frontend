/**
 * Onboarding-specific type definitions.
 * Matches backend API contract for Onboarding.
 *
 * @see /features/final-docs/Onboarding/api/technical-contract.md
 */

export type OnboardingStatus = "not_started" | "in_progress" | "completed";
export type OnboardingStep = "welcome" | "pick_role" | "seed_kb" | "done";
export type Plan = "free" | "pro" | "team";
export type RoleGroup = "engineering" | "business" | "design" | "data" | "other";
export type SourceType = "text" | "url" | "file_pdf" | "file_txt" | "file_md";

export type CompileJobStatus =
  | "queued"
  | "uploading"
  | "parsing"
  | "scanning"
  | "compiling"
  | "wiki_ready"
  | "failed"
  | "cancelled";

export interface RoleKbDto {
  id: string;
  roleName: string;
  roleGroup: RoleGroup;
  roleOptionId: string;
  isCustom: boolean;
  isPrimary: boolean;
  status: string;
  createdAt: string;
}

export interface SourceDto {
  id: string;
  roleKbId: string;
  sourceType: SourceType;
  title: string;
  inputPreview: string;
  status: string;
  createdAt: string;
}

export interface CompileJobDto {
  id: string;
  sourceId: string;
  roleKbId: string;
  status: CompileJobStatus;
  progress: number;
  stage: string;
  message: string;
  outputKnowledgeItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────
// API Payloads and Response Data Shapes
// ────────────────────────────────────────────────────────────────

/** GET /api/v1/onboarding/state */
export interface OnboardingStateResponse {
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  plan: Plan;
  limits: {
    roleLimit: number;
    canSelectMultipleRoles: boolean;
    storageLimitMb: number;
    fileUploadLimitMb: number;
    writeRateLimit: {
      limit: number;
      windowSeconds: number;
    };
    compilePoll: {
      initialIntervalSeconds: number;
      steadyIntervalSeconds: number;
      timeoutSeconds: number;
    };
  };
  roles: RoleKbDto[];
  seed: {
    source: SourceDto | null;
    compileJob: CompileJobDto | null;
    skipped: boolean;
  } | null;
  next: {
    route: string;
    reason: string;
  };
}

/** GET /api/v1/onboarding/role-options */
export interface RoleOption {
  id: string;
  label: string;
  description: string;
}

export interface RoleGroupOption {
  /** Normalized group identifier — set after normalization from either `id` or `group` field */
  id: RoleGroup;
  /** Raw field from API: some endpoints return `group` instead of `id` */
  group?: string;
  label: string;
  icon: string;
  roles: RoleOption[];
}

/** Raw API response shape — group identifier may be in `group` field instead of `id` */
export interface RawRoleGroupOption {
  id?: string;
  group?: string;
  label?: string;
  icon?: string;
  roles?: {
    id?: string;
    roleOptionId?: string;
    label?: string;
    description?: string;
    desc?: string;
  }[];
}

export interface RoleOptionsResponse {
  groups: RawRoleGroupOption[];
  allowCustomRole: boolean;
}

/** POST /api/v1/onboarding/roles */
export interface SaveRoleInput {
  /** ID option from /role-options. null/empty if isCustom: true */
  roleOptionId: string | null;
  roleName: string;
  roleGroup: RoleGroup;
  isCustom: boolean;
  isPrimary: boolean;
}

export interface SaveRolesRequest {
  roles: SaveRoleInput[];
}

/** API returns {} on success — no data payload */
export type SaveRolesResponseData = Record<string, never>;

/** POST /api/v1/onboarding/seed */
export interface SeedRequest {
  roleKbId: string;
  sourceType: "text" | "url";
  /** Content field: URL string when sourceType=url, plain text when sourceType=text */
  content: string;
}

export interface SeedResponseData {
  source: SourceDto;
  compileJob: CompileJobDto;
  onboarding: {
    status: OnboardingStatus;
    currentStep: OnboardingStep;
  };
}

/** GET /api/v1/onboarding/compile-jobs/{jobId} */
export interface CompileJobResponseData {
  compileJob: CompileJobDto;
}

/** POST /api/v1/onboarding/complete — no request body required */
export interface CompleteOnboardingRequest {
  /** Optional: for tracking purposes only, not required by API */
  seedSkipped?: boolean;
  compileJobId?: string | null;
  idempotencyKey?: string;
}

/** API returns { nextRoute: "/dashboard" } */
export interface CompleteOnboardingResponseData {
  nextRoute: string;
}
