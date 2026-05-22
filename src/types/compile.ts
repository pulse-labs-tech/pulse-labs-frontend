/**
 * Compile Pipeline — Type Definitions.
 * Matches backend API contract for Compile-Pipeline-Ingestion.
 *
 * @see /features/final-docs/Compile-Pipeline-Ingestion/api/technical-contract.md
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitive types
// ─────────────────────────────────────────────────────────────────────────────

export type CompileSourceType = "text" | "url" | "file_txt" | "file_md" | "file_pdf";
export type CompileSourceOrigin =
  | "onboarding"
  | "dashboard"
  | "wiki"
  | "domain"
  | "query"
  | "api";
export type CompileJobStatus =
  | "queued"
  | "processing"
  | "wiki_ready"
  | "failed"
  | "cancelled";
export type CompileJobStage =
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
export type CompileRetrievalStatus = "pending" | "indexed" | "degraded" | "failed";

// ─────────────────────────────────────────────────────────────────────────────
// DTO shapes (match API response)
// ─────────────────────────────────────────────────────────────────────────────

export interface CompileSource {
  id: string;
  roleKbId: string;
  sourceType: CompileSourceType;
  origin: CompileSourceOrigin;
  titleHint: string | null;
  inputPreview: string;
  status: string;
  wordCount: number | null;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompileJob {
  id: string;
  sourceId: string;
  roleKbId: string;
  /** Source title hint or generated title */
  title?: string;
  status: CompileJobStatus;
  stage: CompileJobStage;
  progress: number; // 0–100
  message: string;
  attemptCount: number;
  retryable: boolean;
  /** Convenience: true when status is wiki_ready | failed | cancelled */
  isTerminal?: boolean;
  outputKnowledgeItemId: string | null;
  retrievalStatus: CompileRetrievalStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface KnowledgeItemPreview {
  id: string;
  roleKbId: string;
  domainId: string;
  title: string;
  summary: string;
  tags: string[];
  sourceType: string;
  sourceId: string;
  retrievalStatus: CompileRetrievalStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API request shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSourceRequest {
  roleKbId: string;
  sourceType: "text" | "url";
  text?: string;
  url?: string;
  titleHint?: string;
  domainId?: string;
  origin: CompileSourceOrigin;
  idempotencyKey: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response data shapes (inside `data` field of envelope)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSourceResponse {
  source: CompileSource;
  compileJob: CompileJob;
  next: {
    pollUrl: string;
    suggestedPollMs: number;
  };
}

export interface GetCompileJobResponse {
  compileJob: CompileJob;
  source: Partial<CompileSource>;
  knowledgeItem: KnowledgeItemPreview | null;
}

export interface RetryCompileJobResponse {
  compileJob: CompileJob;
}

export interface CancelCompileJobResponse {
  compileJob: Pick<CompileJob, "id" | "status" | "stage" | "progress" | "message" | "outputKnowledgeItemId">;
}
