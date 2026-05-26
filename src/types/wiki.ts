/**
 * Wiki List / Knowledge Detail — Type Definitions.
 * Matches backend API contract for Wiki-List-Knowledge-Detail.
 *
 * @see /features/final-docs/Wiki-List-Knowledge-Detail/Wiki-List/api/technical-contract.md
 * @see /features/final-docs/Wiki-List-Knowledge-Detail/Knowledge-Detail/api/technical-contract.md
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitive types
// ─────────────────────────────────────────────────────────────────────────────

export type WikiItemStatus = "draft" | "active" | "archived" | "deleted";
export type WikiRetrievalStatus = "pending" | "indexed" | "degraded" | "failed";
export type WikiSourceType =
  | "text"
  | "url"
  | "file_pdf"
  | "file_txt"
  | "file_md"
  | "query_output"
  | "manual_note";
export type WikiSort = "updated_desc" | "created_desc" | "title_asc" | "title_desc";
export type WikiDomainFilter = "all" | "uncategorized" | string;

// ─────────────────────────────────────────────────────────────────────────────
// Shared domain DTO
// ─────────────────────────────────────────────────────────────────────────────

export interface WikiDomain {
  id: string;
  name: string;
  slug: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wiki List DTOs — card-level (no raw content)
// ─────────────────────────────────────────────────────────────────────────────

export interface WikiItemCard {
  id: string;
  roleKbId: string;
  domain: WikiDomain;
  title: string;
  summarySnippet: string;
  tags: string[];
  sourceType: WikiSourceType;
  sourceId: string;
  status: WikiItemStatus;
  retrievalStatus: WikiRetrievalStatus;
  createdAt: string;
  updatedAt: string;
  compiledAt: string;
}

export interface WikiListDomainSummary {
  id: string;
  name: string;
  slug?: string;
  count: number;
}

export interface WikiListRoleKb {
  id: string;
  roleName: string;
  isPrimary: boolean;
}

export interface WikiListFilters {
  domainId: string;
  q: string | null;
  sort: WikiSort;
  status: WikiItemStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Detail DTOs — full item detail
// ─────────────────────────────────────────────────────────────────────────────

export interface WikiItemSource {
  id: string;
  sourceType: WikiSourceType;
  titleHint: string | null;
  inputPreview: string;
  url: string | null;
  fileName: string | null;
  wordCount: number | null;
  createdAt: string;
}

export interface WikiItemConcept {
  id: string;
  term: string;
  definition: string;
  sourceChunkIds: string[];
}

export interface WikiChunkCitation {
  chunkId: string;
  excerpt: string;
  headingPath: string | null;
  pageNumber: number | null;
  urlFragment: string | null;
  sourceLabel: string;
  chunkIndex?: number;
  wordCount?: number;
}

export interface WikiPersonalNote {
  id: string;
  content: string;
  updatedAt: string;
}

export interface WikiItemActions {
  queryUrl: string;
  canEditNote: boolean;
  canEditGeneratedContent: boolean;
}

export interface WikiItemDetail {
  id: string;
  roleKbId: string;
  domain: WikiDomain;
  title: string;
  summary: string;
  tags: string[];
  status: WikiItemStatus;
  retrievalStatus: WikiRetrievalStatus;
  source: WikiItemSource;
  concepts: WikiItemConcept[];
  citations: WikiChunkCitation[];
  personalNote: WikiPersonalNote | null;
  relatedItems: WikiItemCard[];
  actions: WikiItemActions;
  createdAt: string;
  updatedAt: string;
  compiledAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response data shapes (inside `data` field of envelope)
// ─────────────────────────────────────────────────────────────────────────────

export interface WikiListResponse {
  roleKb: WikiListRoleKb;
  filters: WikiListFilters;
  items: WikiItemCard[];
  summary: {
    totalItems: number;
    domains: WikiListDomainSummary[];
  };
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface WikiItemDetailResponse {
  item: WikiItemDetail;
}

export interface WikiUpdateNoteResponse {
  personalNote: WikiPersonalNote | null;
}

export interface WikiCitationsResponse {
  items: WikiChunkCitation[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
}

// ─────────────────────────────────────────────────────────────────────────────
// Request param shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface WikiListParams {
  roleKbId?: string;
  domainId?: WikiDomainFilter;
  q?: string;
  sort?: WikiSort;
  status?: WikiItemStatus | WikiRetrievalStatus;
  limit?: number;
  cursor?: string;
  page?: number;
  tag?: string;
}
