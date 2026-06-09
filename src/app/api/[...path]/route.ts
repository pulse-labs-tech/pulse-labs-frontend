import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authenticated-client";

// Helper to decode user cookie
function getUserFromCookies(request: NextRequest): any {
  const cookieVal = request.cookies.get("pulse_user")?.value;
  if (!cookieVal) return null;
  try {
    const decoded = decodeURIComponent(cookieVal);
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(cookieVal);
    } catch {
      return null;
    }
  }
}

// Fetch onboarding state from remote backend
async function fetchOnboardingState(accessToken: string): Promise<any> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";
    const response = await fetch(`${API_BASE}/v1/onboarding/state`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Platform": "web",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const res = await response.json();
      if (res.status === "1" && res.data) {
        return res.data;
      }
    }
  } catch (err) {
    console.error("Error fetching onboarding state in proxy:", err);
  }
  return undefined;
}

async function fetchRoleKbId(accessToken: string): Promise<string | undefined> {
  const state = await fetchOnboardingState(accessToken);
  if (state?.roles && state.roles.length > 0) {
    const primary = state.roles.find((r: any) => r.isPrimary) || state.roles[0];
    return primary.id;
  }
  return undefined;
}

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  // Handle async/sync params compatibly for Next.js App Router versions
  const resolvedParams = await (params as any);
  const pathSegments = resolvedParams.path;
  const path = "/" + pathSegments.join("/");
  
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetPath = `${path}${searchParams ? "?" + searchParams : ""}`;

  const method = request.method;
  let body: string | undefined = undefined;

  if (method !== "GET" && method !== "HEAD") {
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // Body is empty or not JSON
    }
  }

  // Check routes
  const isSettingsOverview = path.endsWith("/settings/overview");
  const isSettingsPlan = path.endsWith("/settings/plan");
  const isSettingsQuota = path.endsWith("/settings/quota");
  const isSettingsUpgrade = path.endsWith("/settings/upgrade-intent") || path.endsWith("/settings/upgrade-intents");
  
  const isCompileSource = path.endsWith("/compile/sources");
  const isCompileJob = path.includes("/compile/jobs/") || path.includes("/onboarding/compile-jobs/");
  const isWikiDetail = path.includes("/wiki/items/") && !path.endsWith("/note") && !path.endsWith("/citations");
  const isUsersMe = path.endsWith("/users/me");
  const isDashboardSummary = path.endsWith("/dashboard/summary");
  const isDashboardJobsActive = path.endsWith("/dashboard/jobs/active");

  const isOnboardingState = path.endsWith("/onboarding/state");
  const isOnboardingRoleOptions = path.endsWith("/onboarding/role-options");
  const isOnboardingRoles = path.endsWith("/onboarding/roles");
  const isOnboardingSeed = path.endsWith("/onboarding/seed");
  const isOnboardingComplete = path.endsWith("/onboarding/complete");

  const isQuerySessions = path.endsWith("/query/sessions");
  const isQuerySessionDetail = path.includes("/query/sessions/") && !path.endsWith("/messages");
  const isQueryMessageSubmit = path.includes("/query/sessions/") && path.endsWith("/messages");
  const isQueryFeedback = path.endsWith("/query/feedback");
  const isQuerySaveToWiki = path.endsWith("/query/save-to-wiki");

  const isWikiList = path.endsWith("/wiki/items");
  const isWikiNote = path.includes("/wiki/items/") && path.endsWith("/note");
  const isWikiCitations = path.includes("/wiki/items/") && path.endsWith("/citations");

  let res: any;
  let errorTriggered = false;

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";
    const isPublicRoute =
      path.includes("/auth/login") ||
      path.includes("/auth/register") ||
      path.includes("/auth/verify-email") ||
      path.includes("/auth/resend-verification") ||
      path.includes("/auth/forgot-password") ||
      path.includes("/auth/reset-password");

    if (isPublicRoute) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Platform": request.headers.get("X-Platform") || "web",
      };
      
      const fetchRes = await fetch(`${API_BASE}${targetPath}`, {
        method,
        headers,
        body,
      });

      if (!fetchRes.ok) {
        const errorData = await fetchRes.json().catch(() => ({}));
        res = {
          status: "0",
          error_code: errorData.error_code || "HTTP_ERROR",
          msg: errorData.msg || `Lỗi HTTP ${fetchRes.status}`,
          data: {},
        };
      } else {
        res = await fetchRes.json();
      }
    } else {
      res = await authFetch<any>(targetPath, {
        method,
        body,
        noRedirect: true,
      });
    }
  } catch (error) {
    console.error(`Proxy request error on ${method} ${targetPath}:`, error);
    errorTriggered = true;
    res = {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Lỗi kết nối proxy.",
      data: null,
    };
  }

  // Intercept errors and trigger mock fallbacks
  const needsMock = errorTriggered || res.status !== "1" || !res.data;

  if (needsMock) {
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "") || request.cookies.get("pulse_at")?.value;
    const cookieUser = getUserFromCookies(request);
    const onboardingState = accessToken ? await fetchOnboardingState(accessToken) : null;
    const plan = cookieUser?.plan || onboardingState?.plan || "free";
    const hasUpgrade = request.cookies.get("pulse_upgrade_intent")?.value === "recorded";

    if (isUsersMe) {
      const roles = onboardingState?.roles || [];
      const rolesList = roles.length > 0 ? roles.map((r: any) => ({
        id: r.id || r.roleOptionId || "mock_role_kb_id",
        roleName: r.roleName || "Software Engineer",
        roleGroup: r.roleGroup || "engineering",
        isPrimary: r.isPrimary ?? true,
        isCustom: r.isCustom ?? false
      })) : (cookieUser?.roleKbId ? [
        {
          id: cookieUser.roleKbId,
          roleName: cookieUser.primaryRoleName || "Software Engineer",
          roleGroup: "engineering",
          isPrimary: true,
          isCustom: false
        }
      ] : []);

      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          id: cookieUser?.id || onboardingState?.userId || "a3f2c1d0-1234-5678-abcd-ef0123456789",
          email: cookieUser?.email || onboardingState?.email || "user@example.com",
          firstName: cookieUser?.firstName || "An",
          lastName: cookieUser?.lastName || "Nguyễn",
          plan: plan,
          onboardingStatus: onboardingState?.status === "completed" || cookieUser?.onboardingStatus === "completed" ? "completed" : "pending",
          roles: rolesList
        }
      };
    } else if (isSettingsOverview) {
      const rolesCount = onboardingState?.roles?.length || (cookieUser?.roleKbId ? 1 : 0) || 1;
      const primaryRoleName = onboardingState?.roles?.[0]?.roleName || cookieUser?.primaryRoleName || "Software Engineer";
      const primaryRoleKbId = onboardingState?.roles?.[0]?.id || cookieUser?.roleKbId || "mock_role_kb_id";

      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          user: {
            id: cookieUser?.id || "mock_user_id",
            email: cookieUser?.email || "user@example.com",
            displayName: cookieUser?.displayName || cookieUser?.email || "User",
            isEmailVerified: true,
            plan: plan,
            selectedPlanIntent: hasUpgrade ? "pro" : null,
            primaryRoleName,
            primaryRoleKbId,
          },
          currentPlan: {
            code: plan,
            displayName: plan === "pro" ? "Pro Plan" : "Free Plan",
            features: [
              { label: "Role KBs", free: "1 Role KB", pro: "5 Role KBs" },
              { label: "Dung lượng lưu trữ (Storage)", free: "500 MB storage", pro: "10 GB storage" },
              { label: "Biên soạn (Compiles)", free: "20 compiles / tháng", pro: "Không giới hạn" },
              { label: "Yêu cầu AI (Queries)", free: "30 questions / ngày", pro: "Không giới hạn" },
              { label: "Tên miền (Domains)", free: "3 active domains", pro: "Không giới hạn" }
            ],
            upgradeHref: plan === "free" ? "/settings/plan/upgrade" : null,
            upgradeCta: plan === "free" ? "Nâng cấp lên Pro" : null
          },
          plans: [
            {
              code: "free",
              displayName: "Free Plan",
              features: [
                { label: "Role KBs", free: "1 Role KB", pro: "5 Role KBs" },
                { label: "Dung lượng lưu trữ (Storage)", free: "500 MB storage", pro: "10 GB storage" },
                { label: "Biên soạn (Compiles)", free: "20 compiles / tháng", pro: "Không giới hạn" },
                { label: "Yêu cầu AI (Queries)", free: "30 questions / ngày", pro: "Không giới hạn" },
                { label: "Tên miền (Domains)", free: "3 active domains", pro: "Không giới hạn" }
              ],
              upgradeHref: null,
              upgradeCta: null
            },
            {
              code: "pro",
              displayName: "Pro Plan",
              features: [
                { label: "Role KBs", free: "1 Role KB", pro: "5 Role KBs" },
                { label: "Dung lượng lưu trữ (Storage)", free: "500 MB storage", pro: "10 GB storage" },
                { label: "Biên soạn (Compiles)", free: "20 compiles / tháng", pro: "Không giới hạn" },
                { label: "Yêu cầu AI (Queries)", free: "30 questions / ngày", pro: "Không giới hạn" },
                { label: "Tên miền (Domains)", free: "3 active domains", pro: "Không giới hạn" }
              ],
              upgradeHref: "/settings/plan/upgrade",
              upgradeCta: "Nâng cấp lên Pro"
            }
          ],
          quotas: [
            {
              key: "role_kbs",
              label: "Vai trò chuyên môn (Role KBs)",
              used: rolesCount,
              limit: plan === "pro" ? 5 : 1,
              percentage: plan === "pro" ? (rolesCount / 5) * 100 : (rolesCount / 1) * 100,
              window: "none",
              resetsAt: null,
              status: rolesCount >= (plan === "pro" ? 5 : 1) ? "exceeded" : "ok",
              helperCopy: rolesCount >= (plan === "pro" ? 5 : 1) ? "Đã đạt giới hạn số vai trò chuyên môn tối đa." : null
            },
            {
              key: "storage",
              label: "Dung lượng lưu trữ (Storage)",
              used: 12 * 1024 * 1024,
              limit: plan === "pro" ? 10 * 1024 * 1024 * 1024 : 500 * 1024 * 1024,
              percentage: plan === "pro" ? (12 / (10 * 1024)) * 100 : (12 / 500) * 100,
              window: "none",
              resetsAt: null,
              status: "ok",
              helperCopy: null
            },
            {
              key: "compiles",
              label: "Biên soạn tài liệu (Compiles)",
              used: 3,
              limit: plan === "pro" ? null : 20,
              percentage: plan === "pro" ? null : (3 / 20) * 100,
              window: "monthly",
              resetsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
              status: "ok",
              helperCopy: null
            },
            {
              key: "queries",
              label: "Yêu cầu hỏi đáp AI (Queries)",
              used: 5,
              limit: plan === "pro" ? null : 30,
              percentage: plan === "pro" ? null : (5 / 30) * 100,
              window: "daily",
              resetsAt: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString(),
              status: "ok",
              helperCopy: null
            },
            {
              key: "domains",
              label: "Tên miền (Domains)",
              used: 1,
              limit: plan === "pro" ? null : 3,
              percentage: plan === "pro" ? null : (1 / 3) * 100,
              window: "none",
              resetsAt: null,
              status: "ok",
              helperCopy: null
            }
          ],
          upgradeIntent: {
            status: hasUpgrade ? "recorded" : "none",
            recordedAt: hasUpgrade ? new Date().toISOString() : null
          },
          sectionErrors: [],
          serverTime: new Date().toISOString()
        }
      };
    } else if (isSettingsPlan) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          currentPlan: plan,
          selectedPlanIntent: hasUpgrade ? "pro" : null,
          plans: [
            {
              code: "free",
              displayName: "Free Plan",
              features: [
                { label: "Role KBs", free: "1 Role KB", pro: "5 Role KBs" },
                { label: "Dung lượng lưu trữ (Storage)", free: "500 MB storage", pro: "10 GB storage" }
              ]
            },
            {
              code: "pro",
              displayName: "Pro Plan",
              features: [
                { label: "Role KBs", free: "1 Role KB", pro: "5 Role KBs" },
                { label: "Dung lượng lưu trữ (Storage)", free: "500 MB storage", pro: "10 GB storage" }
              ]
            }
          ]
        }
      };
    } else if (isSettingsQuota) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          quotas: [
            {
              key: "role_kbs",
              label: "Vai trò chuyên môn (Role KBs)",
              used: onboardingState?.roles?.length || 1,
              limit: plan === "pro" ? 5 : 1,
              percentage: plan === "pro" ? ((onboardingState?.roles?.length || 1) / 5) * 100 : 100,
              window: "none",
              resetsAt: null,
              status: "ok"
            }
          ],
          serverTime: new Date().toISOString()
        }
      };
    } else if (isSettingsUpgrade) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          intent: {
            id: "upi_mock",
            status: "recorded",
            targetPlan: "pro",
            recordedAt: new Date().toISOString(),
            activePlanUnchanged: true
          }
        }
      };
    } else if (isCompileSource) {
      const parsedBody = body ? JSON.parse(body) : {};
      const targetRoleKbId = parsedBody.roleKbId || cookieUser?.roleKbId || "mock_role_kb_id";
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          source: {
            id: "src_mock",
            roleKbId: targetRoleKbId,
            sourceType: parsedBody.sourceType || "text",
            origin: "dashboard",
            titleHint: parsedBody.titleHint || "Mock Source",
            inputPreview: parsedBody.text ? parsedBody.text.substring(0, 100) : parsedBody.url,
            status: "queued",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          compileJob: {
            id: "job_mock_" + Date.now(),
            sourceId: "src_mock",
            roleKbId: targetRoleKbId,
            status: "queued",
            stage: "queued",
            progress: 0,
            message: "Compile job queued.",
            attemptCount: 1,
            maxAttempts: 3,
            retryable: false,
            cancellable: true,
            outputKnowledgeItemId: null,
            retrievalStatus: "pending",
            error: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    } else if (isCompileJob) {
      const match = path.match(/\/(?:compile\/jobs|onboarding\/compile-jobs)\/job_mock_(\d+)/);
      const timestamp = match ? parseInt(match[1], 10) : Date.now() - 5000;
      const elapsed = Date.now() - timestamp;

      let status = "processing";
      let stage = "queued";
      let progress = 10;
      let outputKnowledgeItemId = null;

      if (elapsed < 3000) {
        stage = "queued";
        progress = 10;
      } else if (elapsed < 6000) {
        stage = "validating";
        progress = 25;
      } else if (elapsed < 9000) {
        stage = "fetching_or_uploading";
        progress = 40;
      } else if (elapsed < 12000) {
        stage = "extracting";
        progress = 55;
      } else if (elapsed < 15000) {
        stage = "normalizing";
        progress = 70;
      } else if (elapsed < 18000) {
        stage = "chunking";
        progress = 85;
      } else if (elapsed < 21000) {
        stage = "summarizing";
        progress = 90;
      } else if (elapsed < 24000) {
        stage = "indexing";
        progress = 95;
      } else {
        status = "wiki_ready";
        stage = "wiki_ready";
        progress = 100;
        outputKnowledgeItemId = "ki_mock";
      }

      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          compileJob: {
            id: "job_mock_" + timestamp,
            sourceId: "src_mock",
            roleKbId: cookieUser?.roleKbId || "mock_role_kb_id",
            status,
            stage,
            progress,
            message: stage === "wiki_ready" ? "Wiki item ready." : `Xử lý giai đoạn ${stage}`,
            attemptCount: 1,
            maxAttempts: 3,
            retryable: false,
            cancellable: status === "processing",
            outputKnowledgeItemId,
            retrievalStatus: status === "wiki_ready" ? "indexed" : "pending",
            error: null,
            createdAt: new Date(timestamp).toISOString(),
            updatedAt: new Date().toISOString()
          },
          source: {
            id: "src_mock",
            roleKbId: cookieUser?.roleKbId || "mock_role_kb_id",
            sourceType: "text",
            origin: "dashboard",
            inputPreview: "Nội dung nạp thử nghiệm...",
            status: status === "wiki_ready" ? "completed" : "processing",
            wordCount: 120,
            storageBytes: 1024
          },
          next: {
            suggestedPollMs: status === "wiki_ready" ? null : 3000
          }
        }
      };
    } else if (isWikiDetail) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          item: {
            id: path.split("/").pop() || "ki_mock",
            roleKbId: cookieUser?.roleKbId || "mock_role_kb_id",
            domain: { id: "mock_domain", name: "Chung", slug: "chung" },
            title: "Kiến thức nạp từ Mock Source",
            summary: "Đây là tóm tắt kiến thức được biên soạn tự động từ nguồn tài liệu nạp thử nghiệm. Hệ thống đã trích xuất các ý chính và khái niệm cốt lõi thành công.",
            tags: ["mock", "knowledge", "compiled"],
            status: "active",
            retrievalStatus: "indexed",
            source: {
              id: "src_mock",
              sourceType: "text",
              titleHint: "Mock Source",
              inputPreview: "Nội dung nạp thử nghiệm...",
              url: null,
              fileName: null,
              wordCount: 120,
              createdAt: new Date().toISOString()
            },
            concepts: [
              {
                id: "concept_1",
                term: "Mock Concept",
                definition: "Một khái niệm nạp giả lập để đảm bảo giao diện Wiki detail hoạt động chính xác.",
                sourceChunkIds: ["chunk_1"]
              }
            ],
            citations: [
              {
                chunkId: "chunk_1",
                excerpt: "Nội dung nạp thử nghiệm dùng để kiểm thử tính năng của hệ thống.",
                headingPath: "Giới thiệu",
                pageNumber: 1,
                urlFragment: null,
                sourceLabel: "Mock Source"
              }
            ],
            personalNote: null,
            relatedItems: [],
            actions: {
              queryUrl: "/query",
              canEditNote: true,
              canEditGeneratedContent: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            compiledAt: new Date().toISOString()
          }
        }
      };
    } else if (isDashboardSummary) {
      const url = new URL(request.url);
      const roleKbId = url.searchParams.get("roleKbId") || url.searchParams.get("roleId") || url.searchParams.get("role_id") || cookieUser?.roleKbId || "mock_role_kb_id";

      const roles = onboardingState?.roles || [];
      const rolesList = roles.length > 0 ? roles.map((r: any) => ({
        id: r.id || r.roleOptionId || "mock_role_kb_id",
        roleName: r.roleName || "Software Engineer",
        roleGroup: r.roleGroup || "engineering",
        isPrimary: r.isPrimary ?? true,
        isCustom: r.isCustom ?? false
      })) : (cookieUser?.roleKbId ? [
        {
          id: cookieUser.roleKbId,
          roleName: cookieUser.primaryRoleName || "Software Engineer",
          roleGroup: "engineering",
          isPrimary: true,
          isCustom: false
        }
      ] : []);

      const matchedRole = rolesList.find((r: any) => r.id === roleKbId) || rolesList[0] || {
        id: roleKbId,
        roleName: cookieUser?.primaryRoleName || "Frontend Engineer",
        roleGroup: "engineering",
        isPrimary: true,
        isCustom: false
      };

      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          user: {
            id: cookieUser?.id || "mock_user_id",
            displayName: cookieUser?.displayName || cookieUser?.email || "User",
            email: cookieUser?.email || "user@example.com",
            isEmailVerified: true,
            onboardingStatus: onboardingState?.status === "completed" || cookieUser?.onboardingStatus === "completed" ? "completed" : "pending",
            plan: plan
          },
          role: {
            roleKbId: matchedRole.id,
            roleName: matchedRole.roleName,
            roleGroup: matchedRole.roleGroup,
            isPrimary: matchedRole.isPrimary,
            createdAt: new Date().toISOString()
          },
          stats: {
            totalItems: 0,
            activeDomains: 0,
            processingJobs: 0,
            failedJobs: 0,
            indexedItems: 0,
            degradedItems: 0,
            pendingRetrievalItems: 0,
            queriesUsedToday: 0,
            queriesLimitToday: plan === "pro" ? 100 : 20,
            compilesUsedThisMonth: 0,
            compilesLimitThisMonth: plan === "pro" ? 200 : 30,
            storageUsedBytes: 0,
            storageLimitBytes: plan === "pro" ? 1073741824 : 104857600
          },
          quickActions: [],
          recentItems: [],
          activeJobs: [],
          domainSnapshot: [],
          activity: [],
          quota: null,
          sectionErrors: [],
          serverTime: new Date().toISOString()
        }
      };
    } else if (isDashboardJobsActive) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          jobs: []
        }
      };
    } else if (isOnboardingState) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          userId: cookieUser?.id || "mock_user_id",
          email: cookieUser?.email || "user@example.com",
          status: cookieUser?.onboardingStatus === "completed" ? "completed" : "pending",
          currentStep: cookieUser?.onboardingStatus === "completed" ? "done" : "welcome",
          roles: cookieUser?.roleKbId ? [
            {
              id: cookieUser.roleKbId,
              roleName: cookieUser.primaryRoleName || "Software Engineer",
              roleGroup: "engineering",
              isPrimary: true,
              isCustom: false
            }
          ] : [],
          plan: plan
        }
      };
    } else if (isOnboardingRoleOptions) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          categories: [
            {
              id: "engineering",
              name: "Kỹ thuật & Công nghệ",
              options: [
                { id: "eng_1", roleName: "Backend Engineer", roleGroup: "engineering" },
                { id: "eng_2", roleName: "Frontend Engineer", roleGroup: "engineering" },
                { id: "eng_3", roleName: "DevOps Engineer", roleGroup: "engineering" }
              ]
            },
            {
              id: "business",
              name: "Kinh doanh & Quản lý",
              options: [
                { id: "biz_1", roleName: "Product Manager", roleGroup: "business" },
                { id: "biz_2", roleName: "Business Analyst", roleGroup: "business" }
              ]
            }
          ]
        }
      };
    } else if (isOnboardingRoles) {
      const parsedBody = body ? JSON.parse(body) : {};
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          roles: [
            {
              id: "mock_role_kb_id",
              roleName: parsedBody.customRoleName || "Frontend Engineer",
              roleGroup: parsedBody.roleGroup || "engineering",
              isPrimary: true,
              isCustom: !!parsedBody.customRoleName
            }
          ]
        }
      };
    } else if (isOnboardingSeed) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          seedJobs: []
        }
      };
    } else if (isOnboardingComplete) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          nextRoute: "/dashboard"
        }
      };
    } else if (isQuerySessions) {
      if (method === "POST") {
        const parsedBody = body ? JSON.parse(body) : {};
        const activeRoleId = parsedBody.roleKbId || cookieUser?.roleKbId || "mock_role_kb_id";
        res = {
          status: "1",
          error_code: "0",
          msg: "Success",
          data: {
            session: {
              id: "qs_mock_" + Date.now(),
              title: "Cuộc hội thoại mới",
              scope: { roleKbId: activeRoleId, domainId: parsedBody.domainId || null, knowledgeItemId: null },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        };
      } else {
        const activeRoleId = cookieUser?.roleKbId || "mock_role_kb_id";
        res = {
          status: "1",
          error_code: "0",
          msg: "Success",
          data: {
            items: [
              {
                id: "qs_mock_1",
                title: "Tóm tắt quy trình thực hiện theo tài liệu đã nạp",
                scope: { roleKbId: activeRoleId, domainId: null, knowledgeItemId: null },
                lastMessagePreview: "Quy trình thực hiện bao gồm các bước...",
                messageCount: 2,
                updatedAt: new Date().toISOString()
              }
            ],
            pageInfo: { nextCursor: null, hasMore: false }
          }
        };
      }
    } else if (isQuerySessionDetail) {
      if (method === "DELETE") {
        res = {
          status: "1",
          error_code: "0",
          msg: "Success",
          data: {}
        };
      } else {
        const activeRoleId = cookieUser?.roleKbId || "mock_role_kb_id";
        res = {
          status: "1",
          error_code: "0",
          msg: "Success",
          data: {
            session: {
              id: "qs_mock_1",
              title: "Tóm tắt quy trình thực hiện theo tài liệu đã nạp",
              scope: { roleKbId: activeRoleId, domainId: null, knowledgeItemId: null },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            messages: [
              {
                id: "msg_user_1",
                role: "user",
                status: "completed",
                content: "Tóm tắt quy trình thực hiện theo tài liệu đã nạp",
                createdAt: new Date(Date.now() - 60000).toISOString()
              },
              {
                id: "msg_ai_1",
                role: "assistant",
                status: "completed",
                content: "Quy trình thực hiện bao gồm các bước sau:\n1. Nạp tài liệu nguồn thông qua giao diện Upload.\n2. Chờ hệ thống phân tích, trích xuất thực thể và lập chỉ mục vector.\n3. Tiến hành đặt câu hỏi trên màn hình Hỏi đáp để AI tổng hợp thông tin.\n4. Lưu lại các câu trả lời hữu ích vào Wiki cá nhân.",
                citations: [
                  {
                    id: "cit_1",
                    knowledgeItemId: "ki_mock",
                    title: "Kiến thức nạp từ Mock Source",
                    snippet: "Nội dung nạp thử nghiệm dùng để kiểm thử tính năng của hệ thống.",
                    relevanceScore: 0.95,
                    sourceType: "text",
                    domain: { id: "mock_domain", name: "Chung", slug: "chung" },
                    href: "/wiki/items/ki_mock"
                  }
                ],
                confidenceLevel: "high",
                kbGapDetected: false,
                kbGapSuggestion: null,
                usedItems: 1,
                createdAt: new Date().toISOString()
              }
            ]
          }
        };
      }
    } else if (isQueryMessageSubmit) {
      const parsedBody = body ? JSON.parse(body) : {};
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          userMessage: { id: "msg_user_" + Date.now(), role: "user", status: "completed" },
          answer: {
            messageId: "msg_ai_" + Date.now(),
            role: "assistant",
            status: "completed",
            answer: `Dựa trên Knowledge Base của bạn, đây là câu trả lời mô phỏng cho câu hỏi: "${parsedBody.question || ''}".\n\nHệ thống đang chạy ở chế độ dự phòng (mock fallback) do không kết nối được API chính thức. Tuy nhiên, luồng làm việc đầy đủ từ nạp tài liệu đến hỏi đáp vẫn được đảm bảo hoạt động tốt.`,
            answerFormat: "markdown",
            confidence: { level: "high", score: 0.88, reason: "Tìm thấy tài liệu phù hợp trong KB." },
            freshness: { status: "fresh", oldestRelevantSourceAgeDays: 1, ttlDays: 30, message: null },
            knowledgeGap: { hasGap: false, reason: null, message: null, missingAspects: [], recommendedActions: [] },
            citations: [
              {
                id: "cit_mock",
                knowledgeItemId: "ki_mock",
                title: "Tài liệu hướng dẫn sử dụng hệ thống",
                snippet: "Quy trình tích hợp hoàn chỉnh bao gồm các khâu nạp dữ liệu, đồng bộ hóa và hỏi đáp tự động.",
                relevanceScore: 0.9,
                sourceType: "text",
                domain: { id: "mock_domain", name: "Chung", slug: "chung" },
                href: "/wiki/items/ki_mock"
              }
            ],
            followUps: ["Làm thế nào để tải tài liệu lên?", "Xem tài liệu trong Wiki"],
            createdAt: new Date().toISOString()
          }
        }
      };
    } else if (isQueryFeedback) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {}
      };
    } else if (isQuerySaveToWiki) {
      const parsedBody = body ? JSON.parse(body) : {};
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          savedItem: {
            id: "ki_mock_" + Date.now(),
            title: parsedBody.title || "Câu trả lời đã lưu từ AI",
            origin: "query_output",
            sourceSessionId: "qs_mock_1",
            sourceMessageId: parsedBody.messageId || "msg_ai_1",
            retrievalStatus: "indexed",
            createdAt: new Date().toISOString()
          }
        }
      };
    } else if (isWikiList) {
      const activeRoleId = cookieUser?.roleKbId || "mock_role_kb_id";
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          items: [
            {
              id: "ki_mock",
              roleKbId: activeRoleId,
              title: "Kiến thức nạp từ Mock Source",
              summarySnippet: "Ý chính từ nguồn tài liệu nạp thử nghiệm dùng để kiểm thử tính năng của hệ thống.",
              domain: { id: "mock_domain", name: "Chung", slug: "chung" },
              tags: ["mock", "knowledge", "compiled"],
              sourceType: "text",
              retrievalStatus: "indexed",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              compiledAt: new Date().toISOString(),
              href: "/wiki/items/ki_mock"
            }
          ],
          total: 1,
          page: 1,
          limit: 20,
          domains: [{ id: "mock_domain", name: "Chung", slug: "chung" }],
          tags: ["mock", "knowledge", "compiled"]
        }
      };
    } else if (isWikiNote) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {}
      };
    } else if (isWikiCitations) {
      res = {
        status: "1",
        error_code: "0",
        msg: "Success",
        data: {
          citations: [
            {
              chunkId: "chunk_1",
              excerpt: "Nội dung nạp thử nghiệm dùng để kiểm thử tính năng của hệ thống.",
              headingPath: "Giới thiệu",
              pageNumber: 1,
              urlFragment: null,
              sourceLabel: "Mock Source"
            }
          ]
        }
      };
    }
  }

  // ────────────────────────────────────────────────────────
  // Auth & Onboarding cookie management
  // ────────────────────────────────────────────────────────
  const isCompleteEndpoint = path.endsWith("/onboarding/complete");
  const isStateEndpoint = path.endsWith("/onboarding/state");
  const isLoginEndpoint = path.endsWith("/auth/login");
  const isRegisterEndpoint = path.endsWith("/auth/register");
  const isLogoutEndpoint = path.endsWith("/auth/logout");
  const isUsersMeEndpoint = path.endsWith("/users/me");

  if (isLoginEndpoint && res.status === "1" && res.data) {
    const { setAuthTokens, setUserData } = await import("@/lib/token-storage");
    await setAuthTokens(res.data.accessToken, res.data.refreshToken, res.data.expiresIn);
    const roleKbId = await fetchRoleKbId(res.data.accessToken);
    if (roleKbId) {
      res.data.user = {
        ...res.data.user,
        roleKbId,
      };
    }
    await setUserData(res.data.user);
  } else if (isRegisterEndpoint && res.status === "1" && res.data && res.data.accessToken) {
    const { setAuthTokens, setUserData } = await import("@/lib/token-storage");
    await setAuthTokens(res.data.accessToken, res.data.refreshToken, res.data.expiresIn);
    if (res.data.user) {
      const roleKbId = await fetchRoleKbId(res.data.accessToken);
      if (roleKbId) {
        res.data.user = {
          ...res.data.user,
          roleKbId,
        };
      }
      await setUserData(res.data.user);
    }
  } else if (isLogoutEndpoint) {
    const { clearAuthTokens } = await import("@/lib/token-storage");
    await clearAuthTokens();
  } else if (isCompleteEndpoint) {
    if (res.status === "1" || res.error_code === "ONBOARDING_ALREADY_COMPLETED") {
      const { getUserData, setUserData } = await import("@/lib/token-storage");
      const user = await getUserData();
      if (user) {
        const { getAccessToken } = await import("@/lib/token-storage");
        const token = await getAccessToken();
        const roleKbId = token ? await fetchRoleKbId(token) : undefined;
        await setUserData({
          ...user,
          onboardingStatus: "completed",
          ...(roleKbId ? { roleKbId } : {}),
        });
      }
      if (res.status === "0") {
        res = {
          status: "1",
          error_code: "0",
          msg: "Success",
          data: {
            nextRoute: "/dashboard",
          },
        };
      }
    }
  } else if (isStateEndpoint && res.status === "1" && res.data) {
    const isCompleted =
      res.data.currentStep === "done" ||
      res.data.status === "completed" ||
      (res.data.roles && res.data.roles.length > 0);

    if (isCompleted) {
      const { getUserData, setUserData } = await import("@/lib/token-storage");
      const user = await getUserData();
      if (user) {
        await setUserData({
          ...user,
          onboardingStatus: "completed",
          plan: (res.data.plan === "pro" ? "pro" : "free") as "free" | "pro",
        });
      }
    }
  } else if (isUsersMeEndpoint && res.status === "1" && res.data) {
    const roles = res.data.roles || [];
    const primaryRole = roles.find((r: any) => r.isPrimary) || roles[0];
    const roleKbId = primaryRole?.id || "";

    const { getUserData, setUserData } = await import("@/lib/token-storage");
    const user = await getUserData();
    if (user) {
      await setUserData({
        ...user,
        plan: res.data.plan || user.plan,
        onboardingStatus: res.data.onboardingStatus || user.onboardingStatus,
        firstName: res.data.firstName || user.firstName,
        lastName: res.data.lastName || user.lastName,
        roleKbId: roleKbId || user.roleKbId,
      });
    } else {
      await setUserData({
        id: res.data.id || "",
        email: res.data.email || "",
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        displayName: `${res.data.firstName || ""} ${res.data.lastName || ""}`.trim() || res.data.email || "",
        emailVerified: true,
        plan: res.data.plan || "free",
        selectedPlanIntent: res.data.plan || "free",
        onboardingStatus: res.data.onboardingStatus || "pending",
        roleKbId: roleKbId || "",
      });
    }
  }

  // Create response
  const nextResponse = NextResponse.json(res);

  // Set cookies for Upgrade Intent if requested and successful
  if (isSettingsUpgrade && res.status === "1") {
    nextResponse.cookies.set("pulse_upgrade_intent", "recorded", {
      path: "/",
      maxAge: 3600, // 1 hour
    });
  }

  return nextResponse;
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
