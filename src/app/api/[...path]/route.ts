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
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com";
    const API_BASE = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;
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

  let res: any;

  try {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com";
    const API_BASE = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;
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
    res = {
      status: "0",
      error_code: "NETWORK_ERROR",
      msg: "Lỗi kết nối proxy.",
      data: null,
    };
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
  const isSettingsUpgrade = path.endsWith("/settings/upgrade-intent") || path.endsWith("/settings/upgrade-intents");
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
