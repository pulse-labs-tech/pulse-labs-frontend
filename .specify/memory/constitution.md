# Pulse Labs Frontend Constitution

## Core Principles

### I. Next.js App Router First
- All pages use the Next.js App Router (`src/app/` directory) with React Server Components by default
- Client Components (`"use client"`) are used only when necessary (interactivity, hooks, browser APIs)
- Data fetching happens in Server Components using `async`/`await` — no `useEffect` for initial data
- Use the Metadata API (`export const metadata` or `generateMetadata`) for every page — never `<Head>`
- Route Groups `(groupName)` organize related routes without affecting URLs
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` at appropriate route levels

### II. SEO & Performance Excellence
- Every page MUST have proper metadata: title, description, OG tags, canonical URL
- Use `sitemap.ts` and `robots.ts` for crawler guidance — keep them updated
- Inject JSON-LD structured data for rich search results on key pages
- Target Lighthouse scores: Performance ≥ 90, SEO = 100, Accessibility ≥ 95
- Images always use `next/image` with proper `alt`, `width`, `height`, and `priority` for LCP
- Fonts use `next/font` — never load from CDN in `<head>`
- Third-party scripts use `next/script` with `afterInteractive` or `lazyOnload` strategy

### III. TailwindCSS v4 Design System
- All design tokens defined in `globals.css` using `@theme inline {}` block
- Colors use OKLCH color space for perceptual uniformity and wide gamut support
- Typography uses fluid sizing with `clamp()` for mobile → 4K adaptation
- Custom breakpoints: `3xl` (1920px), `4xl` (2560px), `5xl` (3840px) for 2K/4K displays
- Component styling uses Tailwind utility classes — avoid inline styles and CSS modules
- Dark mode uses `prefers-color-scheme` media query with CSS variable overrides
- Reusable patterns extracted to CSS utility classes in `globals.css` (e.g., `.glass`, `.text-gradient`, `.hover-lift`)

### IV. Multi-Resolution Responsive Design
- Mobile-first approach: base styles → `sm:` → `md:` → `lg:` → `xl:` → `2xl:` → `3xl:` → `4xl:` → `5xl:`
- All layouts MUST work correctly across: mobile (320px), tablet (768px), desktop (1280px), 2K (1920px), 4K (3840px)
- Use `.container-responsive` for main content areas — it scales padding and max-width per breakpoint
- Use fluid units (`clamp()`, `vw`, `vh`) where appropriate instead of fixed pixel values
- Touch targets minimum 44×44px on mobile, appropriately scaled on larger displays

### V. TypeScript Strict Mode
- `strict: true` is NON-NEGOTIABLE in `tsconfig.json`
- All function parameters and return types must be explicitly typed
- Use `interface` for object shapes, `type` for unions and intersections
- Shared types live in `src/types/` — page-specific types can be colocated
- No `any` type — use `unknown` and narrow with type guards when type is uncertain
- Import types with `import type { }` syntax for tree-shaking

### VI. Component Architecture
- UI primitives in `src/components/ui/` — atomic, reusable, no business logic
- Layout components in `src/components/layout/` — Header, Footer, Sidebar, Navigation
- Shared composite components in `src/components/shared/` — combine UI primitives
- Feature-specific components colocated in route directories
- All components are Server Components by default — add `"use client"` only when needed
- Custom hooks in `src/hooks/` — each hook in its own file with barrel export

### VII. Code Quality & Consistency
- ESLint with `eslint-config-next` for linting — no warnings allowed in CI
- Consistent file naming: `kebab-case.ts` for files, `PascalCase` for components
- Configuration centralized in `src/config/` — site config, navigation, feature flags
- API calls through `src/lib/api.ts` client — never raw `fetch` in components
- Utilities in `src/lib/utils.ts` — shared helper functions
- Constants in `src/lib/constants.ts` — breakpoints, animation timings, revalidation

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI Library | React | 19.x |
| Styling | TailwindCSS | 4.x |
| Linting | ESLint | 9.x |
| Package Manager | npm | 10.x |
| Node.js | Node.js LTS | 22.x |
| AI Workflow | Spec-Kit | 0.8.x |

## Development Workflow

1. **Spec First** — Use `/speckit.specify` to define what before how
2. **Plan** — Use `/speckit.plan` to create implementation plan with tech choices
3. **Tasks** — Use `/speckit.tasks` to break plan into actionable items
4. **Implement** — Use `/speckit.implement` to execute tasks systematically
5. **Verify** — Run `npm run build` + `npm run lint` before any PR

## Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.2s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Interaction to Next Paint (INP) | < 200ms |
| Total Bundle Size (initial JS) | < 100KB gzipped |

## Governance

- This constitution supersedes all other coding practices for this project
- All AI-generated code must comply with these principles
- Amendments require documentation and team review
- When in conflict, prioritize: SEO > Performance > DX > Feature completeness

**Version**: 1.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17
