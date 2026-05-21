"use server";

/**
 * Onboarding Server Actions.
 * Centralized onboarding backend API calls.
 *
 * Runs server-side. Utilizes authClient for automatic token rotation and Bearer propagation.
 * Updates user metadata cookies when onboarding transitions are finalized.
 *
 * @see /features/final-docs/Onboarding/api/technical-contract.md
 */

import { authClient } from "@/lib/authenticated-client";
import { getUserData, setUserData } from "@/lib/token-storage";
import type { AuthApiResponse } from "@/types/auth";
import type {
  OnboardingStateResponse,
  RoleOptionsResponse,
  SaveRoleInput,
  SaveRolesResponseData,
  SeedRequest,
  SeedResponseData,
  CompileJobResponseData,
  CompleteOnboardingRequest,
  CompleteOnboardingResponseData,
} from "@/types/onboarding";

/**
 * Fetch the current onboarding state of the user.
 * GET /api/v1/onboarding/state
 */
export async function getOnboardingStateAction(): Promise<
  AuthApiResponse<OnboardingStateResponse>
> {
  try {
    return await authClient.get<OnboardingStateResponse>("/v1/onboarding/state");
  } catch (error) {
    console.error("getOnboardingStateAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lấy trạng thái thiết lập ban đầu.",
      data: {} as OnboardingStateResponse,
    };
  }
}

/**
 * Fetch predefined role options categorized by domains.
 * GET /api/v1/onboarding/role-options
 */
export async function getRoleOptionsAction(): Promise<
  AuthApiResponse<RoleOptionsResponse>
> {
  try {
    return await authClient.get<RoleOptionsResponse>("/v1/onboarding/role-options");
  } catch (error) {
    console.error("getRoleOptionsAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lấy danh sách vị trí công việc.",
      data: {} as RoleOptionsResponse,
    };
  }
}

/**
 * Save selected roles (primary and/or secondary roles).
 * PUT /api/v1/onboarding/roles
 */
export async function saveRolesAction(
  roles: SaveRoleInput[],
  idempotencyKey: string,
): Promise<AuthApiResponse<SaveRolesResponseData>> {
  try {
    return await authClient.put<SaveRolesResponseData>("/v1/onboarding/roles", {
      roles,
      idempotencyKey,
    });
  } catch (error) {
    console.error("saveRolesAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể lưu thông tin vai trò.",
      data: {} as SaveRolesResponseData,
    };
  }
}

/**
 * Submit text or URL seed to begin async knowledge base compilation.
 * POST /api/v1/onboarding/seed
 */
export async function submitSeedAction(
  payload: Omit<SeedRequest, "idempotencyKey"> & { idempotencyKey: string },
): Promise<AuthApiResponse<SeedResponseData>> {
  try {
    return await authClient.post<SeedResponseData>("/v1/onboarding/seed", payload);
  } catch (error) {
    console.error("submitSeedAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể gửi dữ liệu phân tích.",
      data: {} as SeedResponseData,
    };
  }
}

/**
 * Poll progress for a specific compile job.
 * GET /api/v1/onboarding/compile-jobs/{jobId}
 */
export async function getCompileJobAction(
  jobId: string,
): Promise<AuthApiResponse<CompileJobResponseData>> {
  try {
    return await authClient.get<CompileJobResponseData>(
      `/v1/onboarding/compile-jobs/${encodeURIComponent(jobId)}`,
    );
  } catch (error) {
    console.error("getCompileJobAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể kiểm tra tiến độ phân tích tài liệu.",
      data: {} as CompileJobResponseData,
    };
  }
}

/**
 * Finalize onboarding.
 * POST /api/v1/onboarding/complete
 *
 * If success, updates local cookie so the client hydrates with onboardingStatus = 'completed'.
 */
export async function completeOnboardingAction(
  payload: CompleteOnboardingRequest,
): Promise<AuthApiResponse<CompleteOnboardingResponseData>> {
  try {
    const result = await authClient.post<CompleteOnboardingResponseData>(
      "/v1/onboarding/complete",
      payload,
    );

    if (result.status === "1") {
      // Hydrate local user cookie to 'completed'
      const user = await getUserData();
      if (user) {
        await setUserData({
          ...user,
          onboardingStatus: "completed",
        });
      }
    }

    return result;
  } catch (error) {
    console.error("completeOnboardingAction error:", error);
    return {
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Không thể hoàn tất thiết lập ban đầu.",
      data: {} as CompleteOnboardingResponseData,
    };
  }
}
