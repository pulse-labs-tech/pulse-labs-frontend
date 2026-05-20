/**
 * useAuth — Hook to access auth state and actions.
 *
 * @example
 * const { user, isAuthenticated, isLoading, clearAuth } = useAuth();
 *
 * if (isLoading) return <Skeleton />;
 * if (!isAuthenticated) return <Redirect to="/login" />;
 * return <Dashboard user={user} />;
 */

"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import type { AuthContextValue } from "@/contexts/auth-context";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth() must be used within an <AuthProvider>. " +
        "Wrap your app with <AuthProvider> in the root layout.",
    );
  }

  return context;
}
