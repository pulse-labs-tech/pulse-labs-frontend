"use server";

/**
 * Wiki List / Knowledge Detail Server Actions.
 * Centralized wiki backend API calls.
 *
 * API prefix: /api/v1/wiki
 * All endpoints require authenticated + email-verified user.
 *
 * @see /features/final-docs/Wiki-List-Knowledge-Detail/Wiki-List/api/technical-contract.md
 * @see /features/final-docs/Wiki-List-Knowledge-Detail/Knowledge-Detail/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import type { AuthApiResponse } from "@/types/auth";
import type {
  WikiListParams,
  WikiListResponse,
  WikiItemDetailResponse,
  WikiUpdateNoteResponse,
  WikiCitationsResponse,
} from "@/types/wiki";

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/wiki/items — List Wiki item cards
// ─────────────────────────────────────────────────────────────────────────────

export async function getWikiItemsAction(
  params: WikiListParams = {},
): Promise<AuthApiResponse<WikiListResponse>> {
  try {
    const p = new URLSearchParams();
    const activeRoleId = params.roleKbId ?? params.roleId ?? params.role_id;
    if (activeRoleId) {
      p.append("roleKbId", activeRoleId);
      p.append("roleId", activeRoleId);
      p.append("role_id", activeRoleId);
    }
    if (params.domainId && params.domainId !== "all") p.append("domainId", params.domainId);
    if (params.q) p.append("q", params.q);
    if (params.sort) p.append("sort", params.sort);
    if (params.status) p.append("status", params.status);
    if (params.limit) p.append("limit", String(params.limit));
    if (params.cursor) p.append("cursor", params.cursor);
    if (params.page) p.append("page", String(params.page));
    if (params.tag) p.append("tag", params.tag);

    const qs = p.toString();
    return await authClient.get<WikiListResponse>(`/v1/wiki/items${qs ? `?${qs}` : ""}`);
  } catch (error) {
    console.error("getWikiItemsAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải danh sách wiki. Vui lòng thử lại.",
      data: {} as WikiListResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/wiki/items/{itemId} — Load Knowledge Detail
// ─────────────────────────────────────────────────────────────────────────────

export async function getWikiItemAction(
  itemId: string,
  options?: { includeChunks?: boolean; chunkLimit?: number },
): Promise<AuthApiResponse<WikiItemDetailResponse>> {
  try {
    const p = new URLSearchParams();
    if (options?.includeChunks !== undefined) {
      p.append("includeChunks", String(options.includeChunks));
    }
    if (options?.chunkLimit) p.append("chunkLimit", String(options.chunkLimit));
    const qs = p.toString();
    return await authClient.get<WikiItemDetailResponse>(
      `/v1/wiki/items/${itemId}${qs ? `?${qs}` : ""}`,
    );
  } catch (error) {
    console.error("getWikiItemAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải thông tin wiki item. Vui lòng thử lại.",
      data: {} as WikiItemDetailResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /v1/wiki/items/{itemId}/note — Save/clear personal note
// ─────────────────────────────────────────────────────────────────────────────

export async function updateWikiItemNoteAction(
  itemId: string,
  content: string, // empty string = clear note
): Promise<AuthApiResponse<WikiUpdateNoteResponse>> {
  try {
    return await authClient.put<WikiUpdateNoteResponse>(
      `/v1/wiki/items/${itemId}/note`,
      { content },
    );
  } catch (error) {
    console.error("updateWikiItemNoteAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lưu ghi chú. Vui lòng thử lại.",
      data: {} as WikiUpdateNoteResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/wiki/items/{itemId}/citations — Load additional citation chunks
// ─────────────────────────────────────────────────────────────────────────────

export async function getWikiItemCitationsAction(
  itemId: string,
  params?: { limit?: number; cursor?: string },
): Promise<AuthApiResponse<WikiCitationsResponse>> {
  try {
    const p = new URLSearchParams();
    if (params?.limit) p.append("limit", String(params.limit));
    if (params?.cursor) p.append("cursor", params.cursor);
    const qs = p.toString();
    return await authClient.get<WikiCitationsResponse>(
      `/v1/wiki/items/${itemId}/citations${qs ? `?${qs}` : ""}`,
    );
  } catch (error) {
    console.error("getWikiItemCitationsAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải trích dẫn. Vui lòng thử lại.",
      data: {} as WikiCitationsResponse,
    };
  }
}
