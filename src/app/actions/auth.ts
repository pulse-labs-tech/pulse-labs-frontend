"use server";

/**
 * Auth Server Actions.
 * Validates form data server-side and calls the API.
 * Uses React 19 useActionState pattern.
 */

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validations/auth";
import type { AuthErrorCode } from "@/components/auth/auth-error-alert";

export interface LoginActionState {
  errors?: {
    email?: string[];
    password?: string[];
  };
  globalError?: AuthErrorCode;
  message?: string;
}

export async function loginAction(
  prevState: LoginActionState | undefined,
  formData: FormData
): Promise<LoginActionState> {
  // 1. Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Call auth API
  const { email, password } = validatedFields.data;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorCode = errorData?.code as AuthErrorCode | undefined;

      // Map known error codes
      if (
        errorCode &&
        [
          "INVALID_CREDENTIALS",
          "EMAIL_NOT_VERIFIED",
          "ACCOUNT_LOCKED",
          "RATE_LIMITED",
          "SERVER_ERROR",
        ].includes(errorCode)
      ) {
        return { globalError: errorCode };
      }

      // Default to invalid credentials for 401
      if (response.status === 401) {
        return { globalError: "INVALID_CREDENTIALS" };
      }

      // Default to server error
      return { globalError: "SERVER_ERROR" };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _data = await response.json();

    // TODO: Set session cookie here
    // await createSession(data.user.id);
  } catch {
    return { globalError: "NETWORK_ERROR" };
  }

  // 3. Redirect on success
  redirect("/dashboard");
}
