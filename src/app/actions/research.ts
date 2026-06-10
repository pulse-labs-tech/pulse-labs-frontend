"use server";

/**
 * Research Flow Server Actions.
 * Calls Research API endpoints.
 *
 * @see /features/final-docs/Research-Flow/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import { getAccessToken } from "@/lib/token-storage";
import type {
  CreateResearchRunRequest,
  CreateResearchRunResponseData,
  ResearchListData,
  ResearchRunDetailData,
  ResearchSourcesData,
  ResearchClaimsData,
  SaveResearchToWikiRequest,
  SaveResearchToWikiResponseData,
  ResearchRunDto,
  SubmitDocumentRequest,
  SubmitDocumentResponseData,
} from "@/types/research";

type ResearchResult<T> = {
  status: "1" | "0";
  error_code: string;
  msg: string;
  data: T;
};

function makeError<T>(data: T): ResearchResult<T> {
  return {
    status: "0",
    error_code: "NETWORK_ERROR",
    msg: "Không kết nối được máy chủ.",
    data,
  };
}

/**
 * POST /api/v1/research/runs
 * Create a new research run.
 */
export async function createResearchRunAction(
  request: CreateResearchRunRequest
): Promise<ResearchResult<CreateResearchRunResponseData>> {
  try {
    const activeRoleId = request.roleKbId ?? request.roleId ?? request.role_id;
    const payload = {
      ...request,
      roleId: activeRoleId,
      roleKbId: activeRoleId,
      role_id: activeRoleId,
    };
    const res = await authClient.post<CreateResearchRunResponseData>("/v1/research/runs", payload);
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({} as CreateResearchRunResponseData);
  }
}

/**
 * GET /api/v1/research/runs
 * List research runs for current user.
 */
export async function listResearchRunsAction(params?: {
  roleKbId?: string;
  roleId?: string;
  role_id?: string;
  status?: string;
  trigger?: string;
  limit?: number;
  cursor?: string;
}): Promise<ResearchResult<ResearchListData>> {
  try {
    const searchParams = new URLSearchParams();
    const activeRoleId = params?.roleKbId ?? params?.roleId ?? params?.role_id;
    if (activeRoleId) {
      searchParams.set("roleKbId", activeRoleId);
      searchParams.set("roleId", activeRoleId);
      searchParams.set("role_id", activeRoleId);
    }
    if (params?.status) searchParams.set("status", params.status);
    if (params?.trigger) searchParams.set("trigger", params.trigger);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.cursor) searchParams.set("cursor", params.cursor);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await authClient.get<ResearchListData>(`/v1/research/runs${query}`);
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({ items: [], pageInfo: { nextCursor: null, hasMore: false } });
  }
}

/**
 * GET /api/v1/research/runs/{id}
 * Get research run detail with plan, synthesis, and saved status.
 */
export async function getResearchRunAction(
  id: string
): Promise<ResearchResult<ResearchRunDetailData>> {
  try {
    const res = await authClient.get<ResearchRunDetailData>(`/v1/research/runs/${id}`);
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({} as ResearchRunDetailData);
  }
}

/**
 * GET /api/v1/research/runs/{id}/sources
 * Get sources for a research run.
 */
export async function getResearchRunSourcesAction(
  id: string,
): Promise<ResearchResult<ResearchSourcesData>> {
  try {
    const res = await authClient.get<ResearchSourcesData>(`/v1/research/runs/${id}/sources`);
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({ items: [] });
  }
}

/**
 * GET /api/v1/research/runs/{id}/claims
 * Get claims for a research run.
 */
export async function getResearchRunClaimsAction(
  id: string,
  params?: { sourceId?: string; claimType?: string }
): Promise<ResearchResult<ResearchClaimsData>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.sourceId) searchParams.set("sourceId", params.sourceId);
    if (params?.claimType) searchParams.set("claimType", params.claimType);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await authClient.get<ResearchClaimsData>(`/v1/research/runs/${id}/claims${query}`);
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({ items: [] });
  }
}

/**
 * POST /api/v1/research/runs/{id}/cancel
 * Cancel an active research run.
 */
export async function cancelResearchRunAction(
  id: string
): Promise<ResearchResult<{ researchRun: Pick<ResearchRunDto, "id" | "status" | "updatedAt"> }>> {
  try {
    const res = await authClient.post<{ researchRun: Pick<ResearchRunDto, "id" | "status" | "updatedAt"> }>(
      `/v1/research/runs/${id}/cancel`,
      {}
    );
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({} as { researchRun: Pick<ResearchRunDto, "id" | "status" | "updatedAt"> });
  }
}

/**
 * POST /api/v1/research/runs/{id}/save-to-wiki
 * Save completed research synthesis to Wiki.
 */
export async function saveResearchToWikiAction(
  id: string,
  request: SaveResearchToWikiRequest
): Promise<ResearchResult<SaveResearchToWikiResponseData>> {
  try {
    const res = await authClient.post<SaveResearchToWikiResponseData>(
      `/v1/research/runs/${id}/save-to-wiki`,
      request
    );
    return { status: res.status, error_code: res.error_code, msg: res.msg, data: res.data };
  } catch {
    return makeError({} as SaveResearchToWikiResponseData);
  }
}

/**
 * POST /documents
 * Ingest document into knowledge base.
 */
export async function submitDocumentAction(
  request: SubmitDocumentRequest
): Promise<ResearchResult<SubmitDocumentResponseData>> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {
        status: "0",
        error_code: "UNAUTHORIZED",
        msg: "Chưa đăng nhập hoặc phiên làm việc hết hạn.",
        data: {} as SubmitDocumentResponseData,
      };
    }

    const activeRoleId = request.roleId ?? request.roleKbId ?? request.role_id;
    const payload = {
      ...request,
      roleId: activeRoleId,
      roleKbId: activeRoleId,
      role_id: activeRoleId,
    };

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com";
    const RESEARCH_API_BASE = process.env.NEXT_PUBLIC_RESEARCH_API_URL || (rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl);
    const res = await fetch(`${RESEARCH_API_BASE}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let msg = "Lỗi nạp tài liệu từ hệ thống.";
      let error_code = "INGESTION_ERROR";
      try {
        const parsed = JSON.parse(text);
        if (parsed.msg) msg = parsed.msg;
        if (parsed.error_code) error_code = parsed.error_code;
      } catch {}
      return {
        status: "0",
        error_code,
        msg,
        data: {} as SubmitDocumentResponseData,
      };
    }

    const json = await res.json();
    return {
      status: json.status ?? "1",
      error_code: json.error_code ?? "0",
      msg: json.msg ?? "Success",
      data: json.data ?? json,
    };
  } catch (error) {
    console.error("submitDocumentAction error:", error);
    return makeError({} as SubmitDocumentResponseData);
  }
}

