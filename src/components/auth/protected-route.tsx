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

import { useEffect, useState, type ReactNode } from "react";
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

/** Default full-screen loading spinner */
function DefaultSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-auth-accent" />
        <p className="text-sm text-auth-text-2">Đang tải...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  // Track whether we have initiated redirect — keep spinner visible until done
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsRedirecting(true);
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

  // ─── Loading state — auth is still hydrating ──
  if (isLoading) {
    return fallback ?? <DefaultSpinner />;
  }

  // ─── Not authenticated — show spinner while redirect fires ──
  // Never return null here: null causes a black screen on mobile.
  // The redirect effect has already been queued; show spinner until navigation completes.
  if (!isAuthenticated || !user) {
    return isRedirecting ? (fallback ?? <DefaultSpinner />) : (fallback ?? <DefaultSpinner />);
  }

  // ─── Authenticated — render children ──
  if (typeof children === "function") {
    return <>{children(user)}</>;
  }

  return <>{children}</>;
}
