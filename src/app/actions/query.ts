"use server";

/**
 * Query AI Server Actions.
 * Session-based: create session → submit message → actions on messages.
 *
 * API prefix: /api/v1/query
 * All endpoints require authenticated + email-verified user.
 *
 * @see /features/final-docs/Query-AI/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import type { AuthApiResponse } from "@/types/auth";
import type {
  CreateSessionResponse,
  ListSessionsResponse,
  GetSessionResponse,
  SubmitMessageResponse,
  SaveToWikiResponse,
  FeedbackResponse,
} from "@/types/query";

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/query/sessions — Create a new query session
// ─────────────────────────────────────────────────────────────────────────────

export async function createQuerySessionAction(data: {
  roleKbId: string;
  domainId?: string | null;
  knowledgeItemId?: string | null;
  title?: string | null;
}): Promise<AuthApiResponse<CreateSessionResponse>> {
  try {
    return await authClient.post<CreateSessionResponse>("/v1/query/sessions", data);
  } catch (error) {
    console.error("createQuerySessionAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tạo phiên hỏi đáp. Vui lòng thử lại.",
      data: {} as CreateSessionResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/query/sessions — List recent sessions
// ─────────────────────────────────────────────────────────────────────────────

export async function listQuerySessionsAction(params?: {
  roleKbId?: string;
  limit?: number;
  cursor?: string;
}): Promise<AuthApiResponse<ListSessionsResponse>> {
  try {
    const p = new URLSearchParams();
    if (params?.roleKbId) p.append("roleKbId", params.roleKbId);
    if (params?.limit) p.append("limit", String(params.limit));
    if (params?.cursor) p.append("cursor", params.cursor);
    const qs = p.toString();
    return await authClient.get<ListSessionsResponse>(`/v1/query/sessions${qs ? `?${qs}` : ""}`);
  } catch (error) {
    console.error("listQuerySessionsAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải lịch sử hỏi đáp.",
      data: {} as ListSessionsResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/query/sessions/{sessionId} — Load session + messages
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuerySessionAction(
  sessionId: string,
): Promise<AuthApiResponse<GetSessionResponse>> {
  try {
    return await authClient.get<GetSessionResponse>(`/v1/query/sessions/${sessionId}`);
  } catch (error) {
    console.error("getQuerySessionAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải phiên hỏi đáp.",
      data: {} as GetSessionResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/query/sessions/{sessionId}/messages — Submit question
// ─────────────────────────────────────────────────────────────────────────────

export async function submitQueryMessageAction(
  sessionId: string,
  data: {
    question: string;
    scope: {
      roleKbId: string;
      domainId: string | null;
      knowledgeItemId: string | null;
    };
    options?: {
      stream?: boolean;
      topK?: number;
      allowGeneralAnswerWhenKbMissing?: boolean;
    };
  },
): Promise<AuthApiResponse<SubmitMessageResponse>> {
  try {
    return await authClient.post<SubmitMessageResponse>(
      `/v1/query/sessions/${sessionId}/messages`,
      {
        ...data,
        options: {
          stream: false,
          topK: 8,
          allowGeneralAnswerWhenKbMissing: false,
          ...data.options,
        },
      },
    );
  } catch (error) {
    console.error("submitQueryMessageAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể xử lý câu hỏi. Vui lòng thử lại.",
      data: {} as SubmitMessageResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/query/messages/{messageId}/feedback — Save feedback
// ─────────────────────────────────────────────────────────────────────────────

export async function submitQueryFeedbackAction(
  messageId: string,
  rating: "up" | "down",
  reason?: string,
): Promise<AuthApiResponse<FeedbackResponse>> {
  try {
    return await authClient.post<FeedbackResponse>(
      `/v1/query/messages/${messageId}/feedback`,
      { rating, reason },
    );
  } catch (error) {
    console.error("submitQueryFeedbackAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lưu phản hồi.",
      data: {} as FeedbackResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/query/messages/{messageId}/save-to-wiki — Save answer to Wiki
// ─────────────────────────────────────────────────────────────────────────────

export async function saveQueryToWikiAction(
  messageId: string,
  data: {
    mode: "full_answer" | "selected_insight";
    title: string;
    domainId?: string | null;
    selectedText?: string | null;
    tags?: string[];
    note?: string;
  },
): Promise<AuthApiResponse<SaveToWikiResponse>> {
  try {
    return await authClient.post<SaveToWikiResponse>(
      `/v1/query/messages/${messageId}/save-to-wiki`,
      data,
    );
  } catch (error) {
    console.error("saveQueryToWikiAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lưu câu trả lời vào Wiki.",
      data: {} as SaveToWikiResponse,
    };
  }
}
