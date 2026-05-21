/**
 * Dashboard-specific type definitions.
 * Matches backend API contract for Dashboard Basic.
 *
 * @see /features/final-docs/Dashboard-Basic/api/technical-contract.md
 */

export type PlanCode = "free" | "pro";
export type RetrievalStatus = "pending" | "indexed" | "degraded" | "failed";

export type DashboardSourceType =
  | "text"
  | "url"
  | "file_txt"
  | "file_md"
  | "file_pdf"
  | "query_output"
  | "manual_note";

export type DashboardCompileJobStatus =
  | "queued"
  | "processing"
  | "wiki_ready"
  | "failed"
  | "cancelled";

export type DashboardCompileJobStage =
  | "queued"
  | "validating"
  | "fetching_or_uploading"
  | "extracting"
  | "normalizing"
  | "chunking"
  | "summarizing"
  | "indexing"
  | "wiki_ready"
  | "failed"
  | "cancelled";

export type QuotaStatus = "ok" | "warning" | "exceeded" | "unlimited";
export type DashboardActionId = "compile_source" | "ask_query_ai" | "open_wiki";
export type DashboardActionVariant = "primary" | "secondary" | "ghost";

export type DashboardActivityType =
  | "compile_started"
  | "compile_completed"
  | "compile_failed"
  | "query_asked"
  | "insight_saved"
  | "wiki_item_created";

export interface DashboardUserContext {
  id: string;
  displayName: string;
  email: string;
  isEmailVerified: boolean;
  onboardingStatus: "completed" | "pending";
  plan: PlanCode;
}

export interface DashboardRoleContext {
  roleKbId: string;
  roleName: string;
  roleGroup: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalItems: number;
  activeDomains: number;
  processingJobs: number;
  failedJobs: number;
  indexedItems: number;
  degradedItems: number;
  pendingRetrievalItems: number;
  queriesUsedToday: number;
  queriesLimitToday: number;
  compilesUsedThisMonth: number;
  compilesLimitThisMonth: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

export interface QuickAction {
  id: DashboardActionId;
  label: string;
  description: string;
  href: string;
  variant: DashboardActionVariant;
  enabled: boolean;
  disabledReason: string | null;
}

export interface RecentKnowledgeItem {
  id: string;
  roleKbId: string;
  title: string;
  summarySnippet: string;
  domain: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  sourceType: DashboardSourceType;
  retrievalStatus: RetrievalStatus;
  createdAt: string;
  updatedAt: string;
  compiledAt: string;
  href: string;
}

export interface DashboardCompileJob {
  id: string;
  sourceId: string;
  roleKbId: string;
  title: string;
  sourceType: string;
  origin: string;
  status: DashboardCompileJobStatus;
  stage: DashboardCompileJobStage;
  progress: number;
  message: string;
  isTerminal: boolean;
  retryable: boolean;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface DashboardDomainSnapshot {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  indexedCount: number;
  pendingCount: number;
  degradedCount: number;
  lastUpdatedAt: string;
  href: string;
}

export interface QuotaDetail {
  used: number;
  limit: number;
  window: string;
  resetsAt: string;
  status: QuotaStatus;
}

export interface StorageQuotaDetail {
  usedBytes: number;
  limitBytes: number;
  percentage: number;
  status: QuotaStatus;
}

export interface DashboardQuota {
  plan: PlanCode;
  storage: StorageQuotaDetail;
  queries: QuotaDetail;
  compiles: QuotaDetail;
}

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  href: string;
  createdAt: string;
}

export interface SectionError {
  section: string;
  error_code: string;
  msg: string;
}

// ────────────────────────────────────────────────────────────────
// GET /api/v1/dashboard/summary Response
// ────────────────────────────────────────────────────────────────

export interface DashboardSummaryData {
  user: DashboardUserContext;
  role: DashboardRoleContext;
  stats: DashboardStats;
  quickActions: QuickAction[];
  recentItems: RecentKnowledgeItem[];
  activeJobs: DashboardCompileJob[];
  domainSnapshot: DashboardDomainSnapshot[];
  activity: DashboardActivity[];
  quota: DashboardQuota | null;
  sectionErrors: SectionError[];
  serverTime: string;
}

export interface ActiveJobsResponseData {
  jobs: DashboardCompileJob[];
  hasActiveJobs: boolean;
  recommendedPollSeconds: number;
}
