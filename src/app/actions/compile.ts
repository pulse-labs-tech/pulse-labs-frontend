"use server";

/**
 * Compile Pipeline Server Actions.
 * Centralized compile/source ingestion backend API calls.
 *
 * API prefix: /api/v1/compile
 * All endpoints require authenticated + email-verified user.
 *
 * @see /features/final-docs/Compile-Pipeline-Ingestion/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import type { AuthApiResponse } from "@/types/auth";
import type {
  CreateSourceResponse,
  GetCompileJobResponse,
  RetryCompileJobResponse,
  CancelCompileJobResponse,
} from "@/types/compile";

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/compile/sources — Create source + trigger compile job
// ─────────────────────────────────────────────────────────────────────────────

export async function createSourceAction(data: {
  roleKbId: string;
  roleId?: string;
  role_id?: string;
  sourceType: "text" | "url";
  text?: string;
  url?: string;
  titleHint?: string;
  domainId?: string;
  origin?: string;
  idempotencyKey: string;
}): Promise<AuthApiResponse<CreateSourceResponse>> {
  try {
    const activeRoleId = data.roleKbId ?? data.roleId ?? data.role_id;
    return await authClient.post<CreateSourceResponse>("/v1/compile/sources", {
      ...data,
      roleId: activeRoleId,
      roleKbId: activeRoleId,
      role_id: activeRoleId,
      origin: data.origin ?? "dashboard",
    });
  } catch (error) {
    console.error("createSourceAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể nạp nguồn tài liệu. Vui lòng thử lại.",
      data: {} as CreateSourceResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/compile/jobs/{jobId} — Poll compile job status
// ─────────────────────────────────────────────────────────────────────────────

export async function getCompileJobAction(
  jobId: string,
): Promise<AuthApiResponse<GetCompileJobResponse>> {
  try {
    return await authClient.get<GetCompileJobResponse>(`/v1/compile/jobs/${jobId}`);
  } catch (error) {
    console.error("getCompileJobAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lấy trạng thái xử lý. Vui lòng thử lại.",
      data: {} as GetCompileJobResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/compile/jobs/{jobId}/retry — Retry a retryable failed job
// ─────────────────────────────────────────────────────────────────────────────

export async function retryCompileJobAction(
  jobId: string,
  idempotencyKey: string,
): Promise<AuthApiResponse<RetryCompileJobResponse>> {
  try {
    return await authClient.post<RetryCompileJobResponse>(
      `/v1/compile/jobs/${jobId}/retry`,
      { idempotencyKey },
    );
  } catch (error) {
    console.error("retryCompileJobAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể thử lại. Vui lòng thử lại sau.",
      data: {} as RetryCompileJobResponse,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/compile/jobs/{jobId}/cancel — Cancel a queued/running job
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelCompileJobAction(
  jobId: string,
): Promise<AuthApiResponse<CancelCompileJobResponse>> {
  try {
    return await authClient.post<CancelCompileJobResponse>(
      `/v1/compile/jobs/${jobId}/cancel`,
      { reason: "user_cancelled" },
    );
  } catch (error) {
    console.error("cancelCompileJobAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể huỷ tiến trình. Vui lòng thử lại.",
      data: {} as CancelCompileJobResponse,
    };
  }
}
