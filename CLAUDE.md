# Pulse Labs — Frontend AI Instructions

This is the **Pulse Knowledge** Next.js 16 frontend. Always follow the design system rules in `.cursor/rules/design-system.mdc`.

## Quick Reference

- **Theme**: Dark-only. All pages use `bg-auth-bg` (`oklch(0.12 0.006 260)`).
- **Primary color**: Jade-emerald green `oklch(0.75 0.19 160)` → `text-auth-accent`, `bg-auth-accent`.
- **CTA button pattern**: `bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-[0.98]`
- **Language**: All UI text must be in **Vietnamese**.
- **CSS framework**: TailwindCSS v4 — tokens in `src/app/globals.css` `@theme inline {}` block, NO `tailwind.config.ts`.
- **Component pattern**: Server Actions (`src/app/actions/*.ts`) + React 19 `useActionState`.
- **Auth**: `authClient.get/post()` for protected endpoints. Always handle `status === "0"` errors gracefully.

## Never
- Use light backgrounds (`bg-white`, `bg-gray-50`)
- Use blue/indigo colors for UI chrome
- Hardcode hex/rgb colors
- Use English for user-facing text
