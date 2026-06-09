"use server";

/**
 * Dashboard Server Actions.
 * Centralized dashboard backend API calls.
 *
 * Runs server-side. Utilizes authClient for automatic token rotation and Bearer propagation.
 *
 * @see /features/final-docs/Dashboard-Basic/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import { getUserData, setUserData } from "@/lib/token-storage";
import type { AuthApiResponse } from "@/types/auth";
import type {
  DashboardSummaryData,
  ActiveJobsResponseData,
  DashboardQuota,
} from "@/types/dashboard";

/**
 * Fetch the dashboard summary.
 * GET /api/v1/dashboard/summary
 */
export async function getDashboardSummaryAction(
  roleKbId?: string,
  recentLimit = 5,
  activityLimit = 5,
  domainLimit = 6,
): Promise<AuthApiResponse<DashboardSummaryData>> {
  try {
    const params = new URLSearchParams();
    if (roleKbId) {
      params.append("roleKbId", roleKbId);
      params.append("roleId", roleKbId);
      params.append("role_id", roleKbId);
    }
    params.append("recentLimit", String(recentLimit));
    params.append("activityLimit", String(activityLimit));
    params.append("domainLimit", String(domainLimit));

    const queryString = params.toString();
    const path = `/v1/dashboard/summary${queryString ? `?${queryString}` : ""}`;
    return await authClient.get<DashboardSummaryData>(path);
  } catch (error) {
    console.error("getDashboardSummaryAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lấy thông tin tổng quan.",
      data: {} as DashboardSummaryData,
    };
  }
}

/**
 * Fetch active jobs for polling.
 * GET /api/v1/dashboard/jobs/active
 */
export async function getActiveJobsAction(
  roleKbId?: string,
  limit = 5,
): Promise<AuthApiResponse<ActiveJobsResponseData>> {
  try {
    const params = new URLSearchParams();
    if (roleKbId) {
      params.append("roleKbId", roleKbId);
      params.append("roleId", roleKbId);
      params.append("role_id", roleKbId);
    }
    params.append("limit", String(limit));

    const queryString = params.toString();
    const path = `/v1/dashboard/jobs/active${queryString ? `?${queryString}` : ""}`;
    return await authClient.get<ActiveJobsResponseData>(path);
  } catch (error) {
    console.error("getActiveJobsAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lấy danh sách tiến trình đang chạy.",
      data: {} as ActiveJobsResponseData,
    };
  }
}

/**
 * Fetch quota details separately.
 * GET /api/v1/dashboard/quota
 */
export async function getQuotaAction(): Promise<AuthApiResponse<{ quota: DashboardQuota }>> {
  try {
    return await authClient.get<{ quota: DashboardQuota }>("/v1/dashboard/quota");
  } catch (error) {
    console.error("getQuotaAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể tải thông tin giới hạn tài khoản.",
      data: {} as { quota: DashboardQuota },
    };
  }
}

/**
 * Synchronize the user's completed onboarding status in local cookies.
 */
export async function syncCompletedOnboardingAction(roleKbId?: string): Promise<void> {
  try {
    const user = await getUserData();
    if (user) {
      await setUserData({
        ...user,
        onboardingStatus: "completed",
        roleKbId: roleKbId || user.roleKbId,
      });
    } else {
      await setUserData({
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        displayName: "",
        emailVerified: true,
        plan: "free",
        selectedPlanIntent: "free",
        onboardingStatus: "completed",
        roleKbId,
      });
    }
  } catch (error) {
    console.error("syncCompletedOnboardingAction error:", error);
  }
}
