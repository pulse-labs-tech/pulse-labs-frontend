# Design System — Auth Dark Theme

> **Purpose**: Knowledge cache for AI agents. When generating auth-related code, reference these tokens and patterns.

## Color Tokens (OKLCH)

All auth colors are namespaced with `--color-auth-*` and available as Tailwind classes via `@theme inline`.

### Surfaces (layered depth with blue undertone)

| Token | Class | Value | Usage |
|-------|-------|-------|-------|
| `--color-auth-bg` | `bg-auth-bg` | `oklch(0.12 0.006 260)` | Page background |
| `--color-auth-surface` | `bg-auth-surface` | `oklch(0.16 0.008 260)` | Form panel |
| `--color-auth-elevated` | `bg-auth-elevated` | `oklch(0.20 0.008 260)` | Input fields, cards |
| `--color-auth-card-hover` | `bg-auth-card-hover` | `oklch(0.23 0.008 260)` | Hover state |
| `--color-auth-border` | `border-auth-border` | `oklch(0.28 0.006 260)` | Default borders |
| `--color-auth-border-subtle` | `border-auth-border-subtle` | `oklch(0.22 0.004 260)` | Subtle dividers |

### Text

| Token | Class | Value | Usage |
|-------|-------|-------|-------|
| `--color-auth-text` | `text-auth-text` | `oklch(0.98 0 0)` | Primary text (near-white) |
| `--color-auth-text-2` | `text-auth-text-2` | `oklch(0.70 0.01 260)` | Labels, descriptions |
| `--color-auth-text-3` | `text-auth-text-3` | `oklch(0.48 0.01 260)` | Placeholders, dividers |

### Accents

| Token | Class | Value | Usage |
|-------|-------|-------|-------|
| `--color-auth-accent` | `bg-auth-accent` / `text-auth-accent` | `oklch(0.65 0.22 280)` | Primary CTA, links, focus rings |
| `--color-auth-accent-dim` | `bg-auth-accent-dim` | `oklch(0.65 0.22 280 / 0.12)` | Accent background tint |
| `--color-auth-accent-dark` | `bg-auth-accent-dark` | `oklch(0.55 0.22 280)` | Hover/pressed state |
| `--color-auth-purple` | `text-auth-purple` | `oklch(0.72 0.18 300)` | Secondary accent |
| `--color-auth-orange` | `text-auth-orange` | `oklch(0.72 0.16 55)` | Tertiary accent |
| `--color-auth-cyan` | `text-auth-cyan` | `oklch(0.78 0.15 195)` | Info/data accent |
| `--color-auth-error` | `text-auth-error` | `oklch(0.63 0.24 25)` | Error state |

## Component Patterns

### Landing Page Buttons (rounded-full + glow)
```html
<!-- Primary CTA (neon glow) -->
<button class="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600
  px-8 py-3.5 text-sm font-bold text-white
  shadow-[0_0_20px_rgba(124,111,247,0.3)]
  hover:-translate-y-0.5 hover:scale-105
  hover:shadow-[0_0_40px_rgba(124,111,247,0.5)]
  active:scale-95 transition-all duration-300" />

<!-- Secondary (glassmorphic) -->
<button class="rounded-full border border-auth-border-subtle bg-white/5
  backdrop-blur-md hover:bg-white/10 hover:scale-105
  active:scale-95 transition-all duration-300" />
```

### Auth Layout
- Route group: `src/app/(auth)/layout.tsx`
- Split two-panel grid: `grid min-h-screen lg:grid-cols-2`
- Left panel: brand (hidden on mobile, `hidden lg:flex`)
- Right panel: form (full width on mobile)

### Form Fields
```html
<input class="rounded-lg border bg-auth-elevated px-3.5 py-2.5 
  text-[13px] text-auth-text outline-none placeholder:text-auth-text-3
  border-auth-border focus:border-auth-accent 
  focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]" />
```

### Error Field
```html
<input class="border-auth-error shadow-[0_0_0_3px_var(--color-auth-error-dim)]" />
```

### Auth Primary Button
```html
<button class="bg-auth-accent text-white rounded-lg px-4 py-2.5 text-[13px] font-semibold
  hover:bg-auth-accent-dark hover:shadow-auth-accent hover:-translate-y-px" />
```

## Error States

All auth errors mapped in `src/components/auth/auth-error-alert.tsx`:

| Code | Vietnamese Message | Variant |
|------|-------------------|---------|
| `INVALID_CREDENTIALS` | Email hoặc mật khẩu không đúng. | error |
| `EMAIL_NOT_VERIFIED` | Tài khoản cần xác minh email trước khi sử dụng. | warning |
| `ACCOUNT_LOCKED` | Tài khoản đang bị tạm khoá. Vui lòng thử lại sau hoặc liên hệ hỗ trợ. | error |
| `RATE_LIMITED` | Bạn thử quá nhiều lần. Vui lòng thử lại sau ít phút. | warning |
| `SERVER_ERROR` | Hệ thống đang bận. Vui lòng thử lại. | error |
| `NETWORK_ERROR` | Không kết nối được máy chủ. Kiểm tra mạng và thử lại. | error |

## Accessibility Requirements

- All inputs: `<label htmlFor="id">`, `aria-invalid`, `aria-describedby`
- Error alerts: `role="alert"`, `aria-live="assertive"`
- Loading: `aria-busy={true}` on submit button
- Focus ring: `focus:shadow-[0_0_0_3px_var(--color-auth-accent-dim)]`
- Tab order: email → password → forgot → submit → register

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| < 1024px (mobile/tablet) | Single column, brand panel hidden, mobile logo shown |
| ≥ 1024px (desktop) | Split 50/50 grid |
| ≥ 1920px (3xl) | Larger text, wider max-width |
| ≥ 2560px (4xl) | Further scaled |

**Version**: 1.0.0 | **Created**: 2026-05-17
