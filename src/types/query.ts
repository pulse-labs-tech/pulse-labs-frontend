/**
 * Query AI — Type Definitions.
 * Matches backend API contract for Query-AI (session-based).
 *
 * @see /features/final-docs/Query-AI/api/technical-contract.md
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitive types
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low";
export type FreshnessStatus = "fresh" | "stale" | "updating" | "verified" | "unknown";
export type KnowledgeGapReason =
  | "NO_INDEXED_ITEMS"
  | "NO_RELEVANT_CHUNKS"
  | "LOW_CONFIDENCE"
  | "STALE_CONTEXT"
  | "OUT_OF_DOMAIN";
export type QueryFeedbackRating = "up" | "down";
export type AssistantMessageStatus = "completed" | "streaming" | "cancelled" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Core DTOs (match API response shapes exactly)
// ─────────────────────────────────────────────────────────────────────────────

export interface QueryScope {
  roleKbId: string;
  domainId: string | null;
  knowledgeItemId: string | null;
}

export interface QueryConfidence {
  level: ConfidenceLevel;
  score: number;
  reason: string;
}

export interface QueryFreshness {
  status: FreshnessStatus;
  oldestRelevantSourceAgeDays: number | null;
  ttlDays: number;
  message: string | null;
}

export interface QueryKnowledgeGap {
  hasGap: boolean;
  reason: KnowledgeGapReason | null;
  message: string | null;
  missingAspects: string[];
  recommendedActions: string[];
}

export interface QueryCitationSourcePointer {
  url: string | null;
  pageNumber: number | null;
  headingPath: string | null;
}

export interface QueryCitation {
  id: string;
  knowledgeItemId: string;
  knowledgeItemTitle: string;
  sourceId: string;
  sourceType: string;
  chunkId: string;
  excerpt: string;
  domain: { id: string; name: string };
  score: number;
  sourcePointer: QueryCitationSourcePointer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface QuerySession {
  id: string;
  title: string;
  scope: QueryScope;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryUserMessage {
  id: string;
  role: "user";
  content: string;
  createdAt: string;
}

export interface QueryAssistantMessage {
  messageId: string;
  role: "assistant";
  status: AssistantMessageStatus;
  answer: string;
  answerFormat: "markdown" | "text";
  confidence: QueryConfidence;
  freshness: QueryFreshness;
  knowledgeGap: QueryKnowledgeGap;
  citations: QueryCitation[];
  followUps: string[];
  createdAt: string;
}

/** Local chat message representation (includes both user and assistant) */
export interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  /** For user messages */
  content?: string;
  /** For assistant messages (full response) */
  assistantData?: QueryAssistantMessage;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response data shapes (inside `data` field of envelope)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSessionResponse {
  session: QuerySession;
}

export interface ListSessionsResponse {
  items: QuerySession[];
  pageInfo: { nextCursor: string | null };
}

export interface GetSessionResponse {
  session: QuerySession;
  messages: QueryAssistantMessage[];
}

export interface SubmitMessageResponse {
  sessionId: string;
  userMessage: QueryUserMessage;
  assistantMessage: QueryAssistantMessage;
}

export interface SaveToWikiResponse {
  savedInsight: {
    id: string;
    messageId: string;
    mode: string;
    knowledgeItemId: string;
    createdAt: string;
  };
  knowledgeItem: {
    id: string;
    title: string;
    domainId: string;
    sourceType: string;
    retrievalStatus: string;
    createdAt: string;
  };
  links: { detailUrl: string };
}

export interface FeedbackResponse {
  feedback: {
    messageId: string;
    rating: QueryFeedbackRating;
    createdAt: string;
  };
}
