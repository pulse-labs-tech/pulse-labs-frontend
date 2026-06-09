import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authenticated-client";

async function fetchRoleKbId(accessToken: string): Promise<string | undefined> {
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
      if (res.status === "1" && res.data?.roles && res.data.roles.length > 0) {
        const primary = res.data.roles.find((r: any) => r.isPrimary) || res.data.roles[0];
        return primary.id;
      }
    }
  } catch (err) {
    console.error("Error fetching onboarding state in proxy:", err);
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

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kbapi.pulsemarketspt.com/api";
    const isPublicRoute =
      path.includes("/auth/login") ||
      path.includes("/auth/register") ||
      path.includes("/auth/verify-email") ||
      path.includes("/auth/resend-verification") ||
      path.includes("/auth/forgot-password") ||
      path.includes("/auth/reset-password");

    let res: any;
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

    // ────────────────────────────────────────────────────────
    // Auth & Onboarding cookie management
    // ────────────────────────────────────────────────────────
    const isCompleteEndpoint = path.endsWith("/onboarding/complete");
    const isStateEndpoint = path.endsWith("/onboarding/state");
    const isLoginEndpoint = path.endsWith("/auth/login");
    const isRegisterEndpoint = path.endsWith("/auth/register");
    const isLogoutEndpoint = path.endsWith("/auth/logout");

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
    }

    return NextResponse.json(res);
  } catch (error) {
    console.error(`Proxy error on ${method} ${targetPath}:`, error);
    return NextResponse.json({
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Lỗi kết nối proxy.",
      data: null,
    }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
