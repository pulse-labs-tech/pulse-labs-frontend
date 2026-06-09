/**
 * Research Flow type definitions.
 * Matches backend API contract for Research Flow.
 *
 * @see /features/final-docs/Research-Flow/api/technical-contract.md
 */

export type ResearchStatus =
  | "queued"
  | "planning"
  | "searching"
  | "selecting_sources"
  | "fetching_sources"
  | "extracting_claims"
  | "reflecting"
  | "synthesizing"
  | "completed"
  | "failed"
  | "cancelled";

export type ResearchTrigger =
  | "kb_gap"
  | "low_confidence"
  | "stale_context"
  | "explicit_research"
  | "wiki_upsert_refresh";

export type AnswerSourceMode =
  | "kb_only"
  | "research_only"
  | "kb_plus_research"
  | "general_model_disclaimer";

export type ResearchSourceType =
  | "official_docs"
  | "official_github"
  | "package_registry"
  | "provider_docs"
  | "reputable_blog"
  | "community_discussion"
  | "news_media"
  | "unknown_blog"
  | "snippet_only"
  | "other";

export type ResearchClaimType =
  | "definition"
  | "provider_capability"
  | "pricing_or_availability"
  | "implementation_detail"
  | "best_practice"
  | "limitation"
  | "risk"
  | "comparison"
  | "freshness_update"
  | "community_signal";

export type ResearchMode = "background" | "blocking";
export type ConfidenceLevel = "high" | "medium" | "low";
export type SavedResearchMode = "create_item" | "update_candidate";

export const TERMINAL_RESEARCH_STATUSES: ResearchStatus[] = [
  "completed",
  "failed",
  "cancelled",
];

export const ACTIVE_RESEARCH_STATUSES: ResearchStatus[] = [
  "queued",
  "planning",
  "searching",
  "selecting_sources",
  "fetching_sources",
  "extracting_claims",
  "reflecting",
  "synthesizing",
];

export interface ResearchRunDto {
  id: string;
  roleKbId: string | null;
  querySessionId: string | null;
  queryMessageId: string | null;
  trigger: ResearchTrigger;
  sourceMode: AnswerSourceMode;
  status: ResearchStatus;
  query: string;
  normalizedQuery: string | null;
  missingAspects: string[];
  freshnessRequired: boolean;
  overallConfidence: number | null;
  coverageScore: number | null;
  sourceQualityScore: number | null;
  freshnessScore: number | null;
  contradictionPenalty: number | null;
  sourceCount: number;
  claimCount: number;
  error?: { code: string; message: string } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ResearchPlanDto {
  researchRunId: string;
  normalizedQuery: string;
  questions: string[];
  sourcePriority: ResearchSourceType[];
  freshnessTtlDays: number | null;
  minSources: number;
  plannedQueries: Array<{ query: string; purpose: string }>;
  createdAt: string;
}

export interface ResearchSourceDto {
  id: string;
  researchRunId: string;
  url: string | null;
  canonicalUrl: string | null;
  title: string;
  domain: string | null;
  sourceType: ResearchSourceType;
  score: number;
  scoringReasons: string[];
  fetchedOk: boolean;
  fetchedAt: string | null;
  snapshotStorageKey: string | null;
  excerpt: string | null;
  createdAt: string;
}

export interface ResearchClaimDto {
  id: string;
  researchRunId: string;
  sourceId: string;
  claimType: ResearchClaimType;
  text: string;
  evidenceQuote: string | null;
  confidence: number;
  isSnippetOnly?: boolean;
  contradictionGroupId?: string | null;
  createdAt: string;
}

export interface ResearchSynthesisDto {
  researchRunId: string;
  answer: string;
  answerFormat: "markdown";
  confidence: { level: ConfidenceLevel; score: number; reason: string };
  caveats: string[];
  externalCitations: Array<{
    sourceId: string;
    claimIds: string[];
    title: string;
    url: string | null;
    excerpt: string | null;
    score: number;
  }>;
  wikiUpsertCandidateId: string | null;
  createdAt: string;
}

export interface ProgressEventDto {
  event: string;
  researchRunId: string;
  status: ResearchStatus;
  message: string;
  progress: number;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ResearchQuotaDto {
  key: "research_runs";
  plan: "free" | "pro";
  used: number;
  limit: number;
  remaining: number;
  window: "daily";
  resetAt: string;
}

export interface ResearchBudgetDto {
  maxSearchQueries: number;
  maxSourcesToFetch: number;
  maxLoops: number;
  maxClaimsPerSource: number;
  sourceFetchTimeoutSeconds: 12;
  runTimeoutSeconds: number;
  sourceSnapshotCharCap: 20000;
}

// Request types
export interface CreateResearchRunRequest {
  trigger: ResearchTrigger;
  query: string;
  roleKbId?: string | null;
  roleId?: string | null;
  role_id?: string | null;
  querySessionId?: string | null;
  queryMessageId?: string | null;
  missingAspects?: string[];
  freshnessRequired?: boolean;
  mode?: ResearchMode;
  options?: {
    maxSearchQueries?: number;
    maxSourcesToFetch?: number;
    maxLoops?: number;
    saveTrace?: boolean;
  };
}

export interface SaveResearchToWikiRequest {
  title: string;
  domainId: string;
  tags?: string[];
  mode?: SavedResearchMode;
  includeResearchTrace?: boolean;
  includeSources?: boolean;
  includeClaims?: boolean;
  note?: string;
}

// Response data types
export interface CreateResearchRunResponseData {
  researchRun: ResearchRunDto;
  quota: ResearchQuotaDto;
  budget: ResearchBudgetDto;
}

export interface ResearchRunDetailData {
  researchRun: ResearchRunDto;
  plan: ResearchPlanDto | null;
  synthesis: ResearchSynthesisDto | null;
  savedResearch: {
    id: string;
    researchRunId: string;
    knowledgeItemId: string;
    createdAt: string;
  } | null;
}

export interface ResearchListData {
  items: ResearchRunDto[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
}

export interface ResearchSourcesData {
  items: ResearchSourceDto[];
}

export interface ResearchClaimsData {
  items: ResearchClaimDto[];
}

export interface SaveResearchToWikiResponseData {
  savedResearch: {
    id: string;
    researchRunId: string;
    knowledgeItemId: string;
    createdAt: string;
  };
  knowledgeItem: {
    id: string;
    title: string;
    domainId: string;
    sourceType: string;
    origin: string;
    retrievalStatus: string;
    createdAt: string;
  };
  originTrace: {
    researchRunId: string;
    sourceCount: number;
    claimCount: number;
  };
  links: {
    detailUrl: string;
    researchTraceUrl: string;
  };
}

export type ResearchErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "EMAIL_NOT_VERIFIED"
  | "ROLE_NOT_FOUND"
  | "ROLE_NOT_OWNED"
  | "MESSAGE_NOT_FOUND"
  | "MESSAGE_NOT_OWNED"
  | "DOMAIN_NOT_OWNED"
  | "RESEARCH_QUOTA_REACHED"
  | "RESEARCH_RATE_LIMITED"
  | "TOO_MANY_ACTIVE_RESEARCH_RUNS"
  | "RESEARCH_NOT_ENABLED"
  | "RESEARCH_RUN_NOT_FOUND"
  | "RESEARCH_RUN_NOT_OWNED"
  | "RESEARCH_RUN_NOT_ACTIVE"
  | "RESEARCH_NOT_COMPLETED"
  | "RESEARCH_ALREADY_SAVED"
  | "PLAN_LIMIT_REACHED"
  | "WEB_SEARCH_ERROR"
  | "WEB_FETCH_ERROR"
  | "RESEARCH_TIMEOUT"
  | "RESEARCH_PLANNING_FAILED"
  | "RESEARCH_SYNTHESIS_FAILED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

// ─────────────────────────────────────────────────────────────────────────────
// Documents & Research Stream Integration Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitDocumentRequest {
  source: string;
  source_type: "web" | "pdf" | "text" | "git";
  domain_hint?: string;
  role_id?: string;
  roleKbId?: string;
  roleId?: string;
}


export interface SubmitDocumentResponseData {
  document_id: string;
  status: "COMPLETE" | "PROCESSING";
}

export interface ResearchStreamProgressEvent {
  type: "PROGRESS";
  message: string;
  document_id: string;
}

export interface ResearchStreamResultEvent {
  type: "RESULT";
  message: string;
  chunk_id: string;
  document_id: string;
  score: number;
  domain_tags: string[];
  chunk_index: number;
}

export interface ResearchStreamAnswerEvent {
  type: "ANSWER";
  message: string;
  document_id: string;
}

export interface ResearchStreamErrorEvent {
  type: "ERROR";
  message: string;
}

export type ResearchStreamEvent =
  | ResearchStreamProgressEvent
  | ResearchStreamResultEvent
  | ResearchStreamAnswerEvent
  | ResearchStreamErrorEvent;

