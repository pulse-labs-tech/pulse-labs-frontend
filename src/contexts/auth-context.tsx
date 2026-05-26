/**
 * Auth Context — Client-side auth state management.
 *
 * Architecture:
 * - AuthProvider wraps the app in root layout
 * - Reads initial user from `pulse_user` cookie (set by server action)
 * - Provides auth state + login/logout methods to all client components
 * - No extra API call on mount — hydrates from cookie data
 *
 * State Machine:
 *   loading → authenticated (has user)
 *           → unauthenticated (no user)
 *           → authenticated → unauthenticated (logout)
 */

"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types/auth";

// ────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

// ────────────────────────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: "SET_USER"; user: AuthUser }
  | { type: "CLEAR" }
  | { type: "SET_LOADING" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { status: "authenticated", user: action.user };
    case "CLEAR":
      return { status: "unauthenticated", user: null };
    case "SET_LOADING":
      return { status: "loading", user: null };
    default:
      return state;
  }
}

// ────────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────────

export interface AuthContextValue extends AuthState {
  /** Set user as authenticated (called after login server action completes). */
  setUser: (user: AuthUser) => void;
  /** Clear auth state (called before logout redirect). */
  clearAuth: () => void;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Whether auth state is still loading. */
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Initial user data from server.
   * Read from `pulse_user` cookie in root layout (server component)
   * and passed down to avoid an extra API call.
   */
  initialUser?: AuthUser | null;
}

/**
 * Read user data from the `pulse_user` cookie (client-side).
 * This cookie is non-HttpOnly, set by the login server action.
 */
function readUserCookie(): AuthUser | null {
  if (typeof document === "undefined") return null;

  try {
    // Cookies can be stored with or without URL-encoding.
    // Next.js cookies().set() may double-encode; document.cookie gives raw value.
    const match = document.cookie.match(/(?:^|;\s*)pulse_user=([^;]*)/);
    if (!match || !match[1]) return null;

    const raw = match[1];

    // Helper: try to parse a string as AuthUser JSON
    const tryParse = (str: string): AuthUser | null => {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === "object" && parsed.email) {
          return parsed as AuthUser;
        }
      } catch {
        // ignore
      }
      return null;
    };

    // Attempt 1: raw value is already valid JSON
    const direct = tryParse(raw);
    if (direct) return direct;

    // Attempt 2: URL-decode once then parse
    try {
      const decoded = decodeURIComponent(raw);
      const once = tryParse(decoded);
      if (once) return once;

      // Attempt 3: URL-decode twice (double-encoded edge case)
      const decodedTwice = decodeURIComponent(decoded);
      const twice = tryParse(decodedTwice);
      if (twice) return twice;
    } catch {
      // ignore decode errors
    }

    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    status: initialUser ? "authenticated" : "loading",
    user: initialUser,
  });

  // On mount (client-side): if no initialUser from server, try cookie
  useEffect(() => {
    if (initialUser) return; // Already hydrated from server

    const cookieUser = readUserCookie();
    if (cookieUser) {
      dispatch({ type: "SET_USER", user: cookieUser });
    } else {
      dispatch({ type: "CLEAR" });
    }
  }, [initialUser]);

  const setUser = useCallback((user: AuthUser) => {
    dispatch({ type: "SET_USER", user });
  }, []);

  const clearAuth = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setUser,
      clearAuth,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
    }),
    [state, setUser, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
