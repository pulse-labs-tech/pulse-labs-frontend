/**
 * Client-Side API Helper.
 * Instead of invoking Next.js Server Actions directly (which returns obfuscated Next.js RSC streams),
 * this helper performs standard HTTP fetches to the `/api` proxy route handler.
 * DevTools (F12) can intercept and display the clean, unencoded JSON responses.
 */

import type { AuthApiResponse } from "@/types/auth";
import type {
  WikiListParams,
  WikiListResponse,
  WikiItemDetailResponse,
  WikiUpdateNoteResponse,
  WikiCitationsResponse,
} from "@/types/wiki";
import type {
  CreateSourceResponse,
  GetCompileJobResponse,
  RetryCompileJobResponse,
  CancelCompileJobResponse,
} from "@/types/compile";
import type {
  CreateSessionResponse,
  ListSessionsResponse,
  GetSessionResponse,
  SubmitMessageResponse,
  SaveToWikiResponse,
  FeedbackResponse,
} from "@/types/query";
import type {
  ResearchRunDto,
  ResearchRunDetailData,
  ResearchSourceDto,
  ResearchClaimDto,
  SubmitDocumentRequest,
  CreateResearchRunRequest,
  CreateResearchRunResponseData,
} from "@/types/research";
import type { RoleKbDto, OnboardingStateResponse, RoleOption, RoleOptionsResponse } from "@/types/onboarding";
import type { SettingsOverviewData, UpgradeIntentStatus } from "@/types/settings";
import type { DashboardSummaryData, ActiveJobsResponseData } from "@/types/dashboard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";

const RESEARCH_API_BASE =
  process.env.NEXT_PUBLIC_RESEARCH_API_URL || "https://cardboard-desolate-zoologist.ngrok-free.dev";

export async function getClientAccessToken(forceRefresh = false): Promise<string | null> {
  if (typeof document === "undefined") return null;

  if (!forceRefresh) {
    // 1. Try to read from client cookie
    const match = document.cookie.match(/(?:^|;\s*)pulse_at=([^;]*)/);
    if (match && match[1]) {
      return match[1];
    }
  } else {
    // Clear client-side cookie to ensure a fresh fetch
    document.cookie = "pulse_at=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  // 2. Fallback: Ask Next.js Server Action for the token
  try {
    const { getAccessTokenAction } = await import("@/app/actions/auth");
    const token = await getAccessTokenAction(forceRefresh);
    if (token) {
      // Set local cookie so subsequent calls don't hit the server action
      document.cookie = `pulse_at=${token}; path=/; secure; samesite=lax`;
      return token;
    }
  } catch (err) {
    console.error("getClientAccessToken server fallback error:", err);
  }

  return null;
}

export function getFallbackRoleKbId(): string {
  if (typeof document === "undefined") return "";
  try {
    const match = document.cookie.match(/(?:^|;\s*)pulse_user=([^;]*)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const parsed = JSON.parse(decoded);
      return parsed?.roleKbId || "";
    }
  } catch {}
  return "";
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<AuthApiResponse<T>> {
  let token = await getClientAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Platform": "web",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      console.warn(`Unauthorized (401) on ${path}. Attempting token refresh...`);
      token = await getClientAccessToken(true);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: "0",
        error_code: errorData.error_code || "HTTP_ERROR",
        msg: errorData.msg || `Lỗi HTTP ${response.status}`,
        data: {} as T,
      };
    }
    return await response.json();
  } catch (error) {
    console.error(`Client API error on ${options.method || "GET"} ${path}:`, error);
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as T,
    };
  }
}

// ────────────────────────────────────────────────────────────────
// Wiki Actions
// ────────────────────────────────────────────────────────────────

export async function getWikiItemsAction(
  params: WikiListParams = {}
): Promise<AuthApiResponse<WikiListResponse>> {
  const p = new URLSearchParams();
  const activeRoleId = params.roleKbId ?? params.roleId ?? params.role_id ?? getFallbackRoleKbId();
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
  return apiFetch<WikiListResponse>(`/v1/wiki/items${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export async function getWikiItemAction(
  itemId: string,
  options?: { includeChunks?: boolean; chunkLimit?: number }
): Promise<AuthApiResponse<WikiItemDetailResponse>> {
  const p = new URLSearchParams();
  if (options?.includeChunks !== undefined) {
    p.append("includeChunks", String(options.includeChunks));
  }
  if (options?.chunkLimit) p.append("chunkLimit", String(options.chunkLimit));
  const qs = p.toString();

  return apiFetch<WikiItemDetailResponse>(`/v1/wiki/items/${itemId}${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export async function updateWikiItemNoteAction(
  itemId: string,
  content: string
): Promise<AuthApiResponse<WikiUpdateNoteResponse>> {
  return apiFetch<WikiUpdateNoteResponse>(`/v1/wiki/items/${itemId}/note`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function getWikiItemCitationsAction(
  itemId: string
): Promise<AuthApiResponse<WikiCitationsResponse>> {
  return apiFetch<WikiCitationsResponse>(`/v1/wiki/items/${itemId}/citations`, {
    method: "GET",
  });
}

// ────────────────────────────────────────────────────────────────
// Compile Actions
// ────────────────────────────────────────────────────────────────

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
  const activeRoleId = data.roleKbId ?? data.roleId ?? data.role_id ?? getFallbackRoleKbId();
  return apiFetch<CreateSourceResponse>("/v1/compile/sources", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      roleId: activeRoleId,
      roleKbId: activeRoleId,
      role_id: activeRoleId,
      origin: data.origin ?? "dashboard",
    }),
  });
}

export async function getCompileJobAction(
  jobId: string
): Promise<AuthApiResponse<any>> {
  const res = await apiFetch<any>(`/v1/compile/jobs/${jobId}`, {
    method: "GET",
  });
  if (res.status === "1" && res.data?.compileJob) {
    return res;
  }
  return apiFetch<any>(`/v1/onboarding/compile-jobs/${jobId}`, {
    method: "GET",
  });
}

export async function retryCompileJobAction(
  jobId: string,
  idempotencyKey: string
): Promise<AuthApiResponse<RetryCompileJobResponse>> {
  return apiFetch<RetryCompileJobResponse>(`/v1/compile/jobs/${jobId}/retry`, {
    method: "POST",
    body: JSON.stringify({ idempotencyKey }),
  });
}

export async function cancelCompileJobAction(
  jobId: string
): Promise<AuthApiResponse<CancelCompileJobResponse>> {
  return apiFetch<CancelCompileJobResponse>(`/v1/compile/jobs/${jobId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "user_cancelled" }),
  });
}

// ────────────────────────────────────────────────────────────────
// Query Actions
// ────────────────────────────────────────────────────────────────

export async function createQuerySessionAction(data: {
  roleKbId: string;
  roleId?: string;
  role_id?: string;
  domainId?: string | null;
  knowledgeItemId?: string | null;
  title?: string | null;
}): Promise<AuthApiResponse<CreateSessionResponse>> {
  const activeRoleId = data.roleKbId ?? data.roleId ?? data.role_id ?? getFallbackRoleKbId();
  return apiFetch<CreateSessionResponse>("/v1/query/sessions", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      roleId: activeRoleId,
      roleKbId: activeRoleId,
      role_id: activeRoleId,
    }),
  });
}

export async function listQuerySessionsAction(params?: {
  roleKbId?: string;
  roleId?: string;
  role_id?: string;
  limit?: number;
  cursor?: string;
}): Promise<AuthApiResponse<ListSessionsResponse>> {
  const p = new URLSearchParams();
  const activeRoleId = params?.roleKbId ?? params?.roleId ?? params?.role_id ?? getFallbackRoleKbId();
  if (activeRoleId) {
    p.append("roleKbId", activeRoleId);
    p.append("roleId", activeRoleId);
    p.append("role_id", activeRoleId);
  }
  if (params?.limit) p.append("limit", String(params.limit));
  if (params?.cursor) p.append("cursor", params.cursor);
  const qs = p.toString();

  return apiFetch<ListSessionsResponse>(`/v1/query/sessions${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export async function getQuerySessionAction(
  sessionId: string
): Promise<AuthApiResponse<GetSessionResponse>> {
  return apiFetch<GetSessionResponse>(`/v1/query/sessions/${sessionId}`, {
    method: "GET",
  });
}

export async function submitQueryMessageAction(
  sessionId: string,
  data: {
    question: string;
    scope: { roleKbId: string; roleId?: string; role_id?: string; domainId?: string | null; knowledgeItemId?: string | null };
  }
): Promise<AuthApiResponse<SubmitMessageResponse>> {
  const activeRoleId = data.scope.roleKbId ?? data.scope.roleId ?? data.scope.role_id ?? getFallbackRoleKbId();
  const scope = {
    ...data.scope,
    roleId: activeRoleId,
    roleKbId: activeRoleId,
    role_id: activeRoleId,
  };
  return apiFetch<SubmitMessageResponse>(`/v1/query/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      scope,
    }),
  });
}

export async function submitQueryFeedbackAction(
  messageId: string,
  rating: "up" | "down"
): Promise<AuthApiResponse<FeedbackResponse>> {
  return apiFetch<FeedbackResponse>(`/v1/query/feedback`, {
    method: "POST",
    body: JSON.stringify({ messageId, rating }),
  });
}

export async function saveQueryToWikiAction(
  messageId: string,
  data: {
    mode: "full_answer" | "citation_only";
    title: string;
    domainId?: string | null;
  }
): Promise<AuthApiResponse<SaveToWikiResponse>> {
  return apiFetch<SaveToWikiResponse>(`/v1/query/save-to-wiki`, {
    method: "POST",
    body: JSON.stringify({ messageId, ...data }),
  });
}

export async function deleteQuerySessionAction(
  sessionId: string
): Promise<AuthApiResponse<any>> {
  return apiFetch<any>(`/v1/query/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

// ────────────────────────────────────────────────────────────────
// Research Actions
// ────────────────────────────────────────────────────────────────

export async function listResearchRunsAction(params?: {
  roleKbId?: string;
  roleId?: string;
  role_id?: string;
  status?: string;
  trigger?: string;
  limit?: number;
  cursor?: string;
}): Promise<AuthApiResponse<any>> {
  const p = new URLSearchParams();
  const activeRoleId = params?.roleKbId ?? params?.roleId ?? params?.role_id ?? getFallbackRoleKbId();
  if (activeRoleId) {
    p.append("roleKbId", activeRoleId);
    p.append("roleId", activeRoleId);
    p.append("role_id", activeRoleId);
  }
  if (params?.status) p.append("status", params.status);
  if (params?.trigger) p.append("trigger", params.trigger);
  if (params?.limit) p.append("limit", String(params.limit));
  if (params?.cursor) p.append("cursor", params.cursor);
  const qs = p.toString();

  return apiFetch<any>(`/v1/research/runs${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export async function createResearchRunAction(
  data: CreateResearchRunRequest
): Promise<AuthApiResponse<CreateResearchRunResponseData>> {
  const activeRoleId = data.roleKbId ?? data.roleId ?? (data as any).role_id ?? getFallbackRoleKbId();
  const payload = {
    ...data,
    roleId: activeRoleId,
    roleKbId: activeRoleId,
    role_id: activeRoleId,
  };
  return apiFetch<CreateResearchRunResponseData>("/v1/research/runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitDocumentAction(
  data: SubmitDocumentRequest
): Promise<AuthApiResponse<any>> {
  let token = await getClientAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const activeRoleId = data.roleId ?? data.roleKbId ?? data.role_id ?? getFallbackRoleKbId();
  const payload = {
    ...data,
    roleId: activeRoleId,
    roleKbId: activeRoleId,
    role_id: activeRoleId,
  };

  try {
    let response = await fetch(`${RESEARCH_API_BASE}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      console.warn("Unauthorized (401) on /documents. Attempting token refresh...");
      token = await getClientAccessToken(true);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        response = await fetch(`${RESEARCH_API_BASE}/documents`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: "0",
        error_code: errorData.error_code || "INGESTION_ERROR",
        msg: errorData.msg || `Lỗi HTTP ${response.status}`,
        data: null,
      };
    }
    return await response.json();
  } catch (error) {
    console.error("Client API error on POST /documents:", error);
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: null,
    };
  }
}

export async function getResearchRunAction(
  runId: string
): Promise<AuthApiResponse<ResearchRunDetailData>> {
  return apiFetch<ResearchRunDetailData>(`/v1/research/runs/${runId}`, {
    method: "GET",
  });
}

export async function getResearchRunSourcesAction(
  runId: string
): Promise<AuthApiResponse<{ items: ResearchSourceDto[] }>> {
  return apiFetch<{ items: ResearchSourceDto[] }>(`/v1/research/runs/${runId}/sources`, {
    method: "GET",
  });
}

export async function getResearchRunClaimsAction(
  runId: string
): Promise<AuthApiResponse<{ items: ResearchClaimDto[] }>> {
  return apiFetch<{ items: ResearchClaimDto[] }>(`/v1/research/runs/${runId}/claims`, {
    method: "GET",
  });
}

export async function cancelResearchRunAction(
  runId: string
): Promise<AuthApiResponse<any>> {
  return apiFetch<any>(`/v1/research/runs/${runId}/cancel`, {
    method: "POST",
  });
}

export async function saveResearchToWikiAction(
  runId: string,
  data: {
    title: string;
    domainId: string;
    tags?: string[];
    mode?: string;
    includeResearchTrace?: boolean;
    includeSources?: boolean;
    includeClaims?: boolean;
    note?: string;
  }
): Promise<AuthApiResponse<{ links: { detailUrl: string } }>> {
  return apiFetch<{ links: { detailUrl: string } }>(`/v1/research/runs/${runId}/save-to-wiki`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────
// Onboarding Actions
// ────────────────────────────────────────────────────────────────

export async function getOnboardingStateAction(): Promise<AuthApiResponse<OnboardingStateResponse>> {
  return apiFetch<OnboardingStateResponse>("/v1/onboarding/state", {
    method: "GET",
  });
}

export async function getRoleOptionsAction(): Promise<AuthApiResponse<RoleOptionsResponse>> {
  return apiFetch<RoleOptionsResponse>("/v1/onboarding/role-options", {
    method: "GET",
  });
}

export async function saveRolesAction(
  roles: any[]
): Promise<AuthApiResponse<any>> {
  return apiFetch<any>("/v1/onboarding/roles", {
    method: "POST",
    body: JSON.stringify({ roles }),
  });
}

export async function submitSeedAction(
  data: any
): Promise<AuthApiResponse<any>> {
  const activeRoleId = data.roleId ?? data.roleKbId ?? data.role_id ?? getFallbackRoleKbId();
  const payload = {
    ...data,
    roleId: activeRoleId,
    roleKbId: activeRoleId,
    role_id: activeRoleId,
  };
  return apiFetch<any>("/v1/onboarding/seed", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeOnboardingAction(
  data: any
): Promise<AuthApiResponse<any>> {
  return apiFetch<any>("/v1/onboarding/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────
// Settings Actions
// ────────────────────────────────────────────────────────────────

export async function getSettingsOverviewAction(): Promise<AuthApiResponse<SettingsOverviewData>> {
  return apiFetch<SettingsOverviewData>("/v1/settings/overview", {
    method: "GET",
  });
}

export async function recordUpgradeIntentAction(data: {
  targetPlan: string;
  source?: string;
}): Promise<AuthApiResponse<{ intent: any }>> {
  return apiFetch<{ intent: any }>("/v1/settings/upgrade-intent", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────
// Dashboard Actions
// ────────────────────────────────────────────────────────────────

export async function getDashboardSummaryAction(
  roleKbId?: string
): Promise<AuthApiResponse<DashboardSummaryData>> {
  const p = new URLSearchParams();
  const activeRoleId = roleKbId || getFallbackRoleKbId();
  if (activeRoleId) {
    p.append("roleKbId", activeRoleId);
    p.append("roleId", activeRoleId);
    p.append("role_id", activeRoleId);
  }
  const qs = p.toString();
  return apiFetch<DashboardSummaryData>(`/v1/dashboard/summary${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export async function getActiveJobsAction(
  roleKbId?: string
): Promise<AuthApiResponse<ActiveJobsResponseData>> {
  const p = new URLSearchParams();
  const activeRoleId = roleKbId || getFallbackRoleKbId();
  if (activeRoleId) {
    p.append("roleKbId", activeRoleId);
    p.append("roleId", activeRoleId);
    p.append("role_id", activeRoleId);
  }
  const qs = p.toString();
  return apiFetch<ActiveJobsResponseData>(`/v1/dashboard/jobs/active${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}
