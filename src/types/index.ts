/**
 * Shared TypeScript type definitions.
 */

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/** API error response */
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/** Pagination params */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/** SEO metadata for pages */
export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
  noIndex?: boolean;
}

/** Base entity with common fields */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Responsive breakpoint type */
export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

/** Theme mode */
export type ThemeMode = "light" | "dark" | "system";
