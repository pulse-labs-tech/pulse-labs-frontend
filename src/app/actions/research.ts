"use server";

/**
 * Research Flow Server Actions.
 * Calls Research API endpoints.
 *
 * @see /features/final-docs/Research-Flow/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
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
    const res = await authClient.post<CreateResearchRunResponseData>("/v1/research/runs", request);
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
  status?: string;
  trigger?: string;
  limit?: number;
  cursor?: string;
}): Promise<ResearchResult<ResearchListData>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.roleKbId) searchParams.set("roleKbId", params.roleKbId);
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
