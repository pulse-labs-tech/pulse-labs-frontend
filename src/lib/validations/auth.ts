/**
 * Zod validation schemas for auth forms.
 */

import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không hợp lệ." }),
  password: z
    .string()
    .min(1, { message: "Vui lòng nhập mật khẩu." })
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Tên phải có ít nhất 2 ký tự." })
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không hợp lệ." }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
