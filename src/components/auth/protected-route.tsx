/**
 * ProtectedRoute — Client-side auth guard component.
 *
 * Use this as a wrapper inside protected pages/layouts for:
 * 1. Loading skeleton while auth state hydrates
 * 2. Graceful redirect if not authenticated (belt + suspenders with middleware)
 * 3. Passing authenticated user to children
 *
 * @example
 * <ProtectedRoute>
 *   {(user) => <Dashboard user={user} />}
 * </ProtectedRoute>
 *
 * @example
 * <ProtectedRoute fallback={<CustomSkeleton />}>
 *   {(user) => <Settings user={user} />}
 * </ProtectedRoute>
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { AuthUser } from "@/types/auth";

interface ProtectedRouteProps {
  /** Render function receiving the authenticated user. */
  children: ((user: AuthUser) => ReactNode) | ReactNode;
  /** Custom loading fallback. Defaults to a centered spinner. */
  fallback?: ReactNode;
  /** URL to redirect to if not authenticated. Default: /login */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      let finalRedirectUrl = redirectTo;
      if (typeof window !== "undefined" && redirectTo.startsWith("/login")) {
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath && currentPath !== "/" && currentPath !== "/login") {
          finalRedirectUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`;
        }
      }
      router.replace(finalRedirectUrl);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // ─── Loading state ──
  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-auth-bg">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-auth-accent" />
            <p className="text-sm text-auth-text-2">Đang tải...</p>
          </div>
        </div>
      )
    );
  }

  // ─── Not authenticated — will redirect via useEffect ──
  if (!isAuthenticated || !user) {
    return null;
  }

  // ─── Authenticated — render children ──
  if (typeof children === "function") {
    return <>{children(user)}</>;
  }

  return <>{children}</>;
}
