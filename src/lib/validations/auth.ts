/**
 * Zod validation schemas for auth forms.
 * Field names and rules match the backend API contract exactly.
 *
 * @see /features/api-docs/API_Auth_Docs.md
 */

import * as z from "zod";

// ────────────────────────────────────────────────────────────────
// Login
// ────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không hợp lệ." }),
  password: z
    .string()
    .min(1, { message: "Vui lòng nhập mật khẩu." })
    .max(1024, { message: "Mật khẩu quá dài." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ────────────────────────────────────────────────────────────────
// Register
// ────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "Vui lòng nhập tên." })
    .max(80, { message: "Tên tối đa 80 ký tự." })
    .trim(),
  lastName: z
    .string()
    .min(1, { message: "Vui lòng nhập họ." })
    .max(80, { message: "Họ tối đa 80 ký tự." })
    .trim(),
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không hợp lệ." }),
  password: z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
    .regex(/[A-Z]/, {
      message: "Mật khẩu phải chứa ít nhất 1 chữ in hoa.",
    })
    .regex(/[0-9]/, {
      message: "Mật khẩu phải chứa ít nhất 1 chữ số.",
    }),
  selectedPlanIntent: z
    .enum(["free", "pro"])
    .default("free"),
  acceptedTerms: z
    .literal(true, {
      message: "Bạn cần đồng ý Điều khoản sử dụng.",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ────────────────────────────────────────────────────────────────
// Forgot Password (request reset)
// ────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không hợp lệ." }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ────────────────────────────────────────────────────────────────
// Reset Password (set new password with token)
// ────────────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "Token không hợp lệ." }),
    newPassword: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
      .regex(/[A-Z]/, {
        message: "Mật khẩu phải chứa ít nhất 1 chữ in hoa.",
      })
      .regex(/[0-9]/, {
        message: "Mật khẩu phải chứa ít nhất 1 chữ số.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
