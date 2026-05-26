"use server";

/**
 * Settings / Plan Gate Server Actions.
 * Calls Settings and Plan Gate API endpoints.
 *
 * @see /features/final-docs/Settings-Plan-Gate-Minimal/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import type {
  SettingsOverviewData,
  PlanDto,
  QuotaCardData,
  PlanGateEvaluateRequest,
  PlanGateEvaluateResponseData,
  UpgradeIntentRequest,
  UpgradeIntentResponseData,
  SettingsActionResult,
} from "@/types/settings";

/**
 * GET /api/v1/settings/overview
 * Load Settings page initial data: user, plan, quotas, upgrade intent.
 */
export async function getSettingsOverviewAction(): Promise<SettingsActionResult<SettingsOverviewData>> {
  try {
    const res = await authClient.get<SettingsOverviewData>("/v1/settings/overview");
    return {
      status: res.status,
      error_code: res.error_code,
      msg: res.msg,
      data: res.data,
    };
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as SettingsOverviewData,
    };
  }
}

/**
 * GET /api/v1/settings/plan
 * Refresh plan/catalog data independently.
 */
export async function getSettingsPlanAction(): Promise<SettingsActionResult<{ plan: PlanDto; plans: PlanDto[] }>> {
  try {
    const res = await authClient.get<{ plan: PlanDto; plans: PlanDto[] }>("/v1/settings/plan");
    return {
      status: res.status,
      error_code: res.error_code,
      msg: res.msg,
      data: res.data,
    };
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as { plan: PlanDto; plans: PlanDto[] },
    };
  }
}

/**
 * GET /api/v1/settings/quota
 * Refresh quota data independently.
 */
export async function getSettingsQuotaAction(): Promise<SettingsActionResult<{ quotas: QuotaCardData[] }>> {
  try {
    const res = await authClient.get<{ quotas: QuotaCardData[] }>("/v1/settings/quota");
    return {
      status: res.status,
      error_code: res.error_code,
      msg: res.msg,
      data: res.data,
    };
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as { quotas: QuotaCardData[] },
    };
  }
}

/**
 * POST /api/v1/plan-gates/evaluate
 * Evaluate plan gate before a restricted action. Result is advisory — target endpoints still enforce.
 */
export async function evaluatePlanGateAction(
  request: PlanGateEvaluateRequest
): Promise<SettingsActionResult<PlanGateEvaluateResponseData>> {
  try {
    const res = await authClient.post<PlanGateEvaluateResponseData>("/v1/plan-gates/evaluate", request);
    return {
      status: res.status,
      error_code: res.error_code,
      msg: res.msg,
      data: res.data,
    };
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as PlanGateEvaluateResponseData,
    };
  }
}

/**
 * POST /api/v1/settings/upgrade-intents
 * Record upgrade intent. Does NOT activate Pro entitlements.
 */
export async function recordUpgradeIntentAction(
  request: UpgradeIntentRequest
): Promise<SettingsActionResult<UpgradeIntentResponseData>> {
  try {
    const res = await authClient.post<UpgradeIntentResponseData>("/v1/settings/upgrade-intents", request);
    return {
      status: res.status,
      error_code: res.error_code,
      msg: res.msg,
      data: res.data,
    };
  } catch {
    return {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Không kết nối được máy chủ.",
      data: {} as UpgradeIntentResponseData,
    };
  }
}
