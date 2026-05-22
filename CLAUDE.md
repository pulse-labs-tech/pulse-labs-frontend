# Pulse Labs — Frontend AI Instructions

This is the **Pulse Knowledge** Next.js 16 frontend. Always follow the design system rules in `.cursor/rules/design-system.mdc`.

## Quick Reference

- **Theme**: Dark-only. All pages use `bg-auth-bg` (`oklch(0.12 0.006 260)`).
- **Primary color**: Softer Jade-emerald green `oklch(0.68 0.15 160)` → `text-auth-accent`, `bg-auth-accent`.
- **CTA button pattern**: `bg-[var(--color-auth-accent)] text-white hover:bg-[var(--color-auth-accent-dark)] shadow-[0_0_15px_var(--color-auth-accent-glow)] active:scale-[0.98]`
- **Language**: All UI text must be in **Vietnamese**.
- **CSS framework**: TailwindCSS v4 — tokens in `src/app/globals.css` `@theme inline {}` block, NO `tailwind.config.ts`.
- **Component pattern**: Server Actions (`src/app/actions/*.ts`) + React 19 `useActionState`.
- **Auth**: `authClient.get/post()` for protected endpoints. Always handle `status === "0"` errors gracefully.

## Never
- Use light backgrounds (`bg-white`, `bg-gray-50`)
- Hardcode hex/rgb colors (unless absolutely necessary in charts/SVG)
- Use English for user-facing text
- Use excessive multi-colored icon highlights or sparkles (keep UI minimalist)
