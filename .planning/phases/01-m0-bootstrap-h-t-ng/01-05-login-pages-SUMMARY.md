---
phase: 01-m0-bootstrap-h-t-ng
plan: 05
subsystem: auth-ui
tags: [nextjs-15, server-actions, react-hook-form, useActionState, sonner, shadcn, vietnamese-i18n, error-boundary]

requires:
  - phase: 01-m0-bootstrap-h-t-ng-01-repo-init
    provides: HARDCODED_USERS + ROLE_LABELS + ORG_NAMES + Tailwind v4 setup
  - phase: 01-m0-bootstrap-h-t-ng-03-nextauth-credentials
    provides: loginAction + LoginState + auth() + defaultLandingPath + middleware route guards
  - phase: 01-m0-bootstrap-h-t-ng-04-layout-shell
    provides: 18 shadcn primitives + AppShell + AppProviders + AppTopbar logout flow

provides:
  - Login page split 60/40 brand panel + form panel theo UI-SPEC pixel-perfect
  - LoginForm wire useActionState + useFormStatus + RHF-style inline errors + show/hide password
  - SsoPlaceholderButton click → Sonner info toast (M2 deferred)
  - QuocHuySvg simplified outline component (placeholder, no copyright)
  - Dashboard placeholder role-aware greeting + ROLE_LABELS lookup + empty state Card
  - 404 page (app/not-found.tsx) navy hero + tiếng Việt + CTA — không stack trace
  - 500 page (app/error.tsx) red hero + tiếng Việt + 2 CTA reset/home — không stack trace
  - 500 fallback root (app/global-error.tsx) inline-style cho catastrophic root layout crash
  - UAT manual checklist 8 tài khoản với coverage AUTH-01 → AUTH-08

affects: [phase 02-m1-danh-muc-quan-tri, all M2-M7 phases (consumer của layout shell + auth flow)]

tech-stack:
  added: []  # No new dependencies — only consumed Plan 03/04 primitives + shadcn
  patterns:
    - "Server Action form: <form action={formAction}> + useActionState(action, initial) + useFormStatus() trong submit button — Next.js 15 idiom thay react-dom.useFormState (deprecated)"
    - "Defense-in-depth auth redirect: page.tsx await auth() + redirect(defaultLandingPath) song song với middleware — handle race khi cookie expire"
    - "Error boundary safe rendering: error.tsx + global-error.tsx KHÔNG render error.message/stack lên JSX, chỉ console.error trong useEffect khi NODE_ENV==='development'"
    - "global-error.tsx inline-style fallback: render <html>+<body> riêng + inline CSS vì root layout có thể đã crash (Tailwind chưa load)"

key-files:
  created:
    - "public/logo-quoc-huy.svg"
    - "components/auth/QuocHuySvg.tsx"
    - "components/auth/SsoPlaceholderButton.tsx"
    - "components/auth/LoginForm.tsx"
    - "app/(auth)/layout.tsx"
    - "app/not-found.tsx"
    - "app/error.tsx"
    - "app/global-error.tsx"
    - "scripts/uat-checklist.md"
  modified:
    - "app/(auth)/login/page.tsx (overwrite Plan 03 placeholder)"
    - "app/(app)/dashboard/page.tsx (overwrite Plan 03 placeholder)"

key-decisions:
  - "Quốc huy SVG simplified outline (vòng tròn + ngôi sao 5 cánh, navy currentColor) thay raster image của Bộ CT — tránh copyright; UI-SPEC §Brand Element confirm placeholder acceptable cho POC"
  - "useActionState (React 19 / Next 15) thay useFormState (deprecated) — wrap loginAction từ Plan 03 không qua thêm wrapper; useFormStatus separate cho pending state trong child SubmitButton"
  - "global-error.tsx render <html><body> với inline style — KHÔNG dùng Tailwind/shadcn vì root layout có thể đã crash khiến CSS chưa load; bảo đảm fallback render được trong worst case"
  - "Login page server-side check await auth() + redirect defaultLandingPath defense-in-depth song song middleware — tránh race condition khi cookie vừa expire"
  - "Show/hide password aria-label động: 'Hiển thị mật khẩu' / 'Ẩn mật khẩu' theo state — UI-SPEC §Copywriting Contract"
  - "Brand panel chỉ render desktop ≥1024px (lg:flex), mobile fallback mini header (lg:hidden block) — đảm bảo content first khi screen nhỏ"

patterns-established:
  - "Auth route group layout: minimal Pass-through `<>{children}</>` — no shell, no provider; root layout đã handle <html>/<body>"
  - "Client form với Server Action: useActionState + useFormStatus combo + AlertDescription cho general error + inline text-red-600 cho field error"
  - "Vietnamese error message contract: 'Vui lòng nhập X' (validation), 'X chưa đúng. Vui lòng thử lại' (auth) — tone formal, chủ động"
  - "404/500 hero pattern: text-4xl bold (navy cho 404, red cho 500) + heading text-2xl + body text-base + CTA Button group, centered min-h-screen"
  - "Always-auth redirect pattern: server component check session + redirect defaultLandingPath — apply cho login + future auth-only pages"

requirements-completed: [AUTH-01, AUTH-05, AUTH-06, AUTH-08]

duration: 5min
completed: 2026-04-30
---

# Phase 01 Plan 05: Login Pages Summary

**Hoàn thiện UI Phase 1 với login split 60/40 brand-aware + LoginForm wire Server Action + dashboard placeholder role-aware + 404/500 hero pages tiếng Việt no-stack-trace + UAT checklist 8 tài khoản — đóng phase 1 với end-to-end verifiable flow.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-30T17:25:48Z
- **Completed:** 2026-04-30T17:30:14Z
- **Tasks:** 3/3 completed
- **Files modified:** 11 (9 created + 2 overwrite)

## Accomplishments

- Login page pixel-perfect theo UI-SPEC §Login Page: split 60/40 desktop ≥1024px (brand panel left với Quốc huy SVG + Quốc hiệu Times italic + wordmark XTTMQG + tagline + Bộ CT footer; form panel right với title + subtitle + 2 inputs eye-toggle + primary blue button + divider Hoặc + SSO outline button + version footer); mobile stack vertical với mini header
- LoginForm wire useActionState với loginAction (Plan 03), useFormStatus pending state spinner + "Đang đăng nhập...", show/hide password toggle với aria-label động, autoFocus username, autoComplete đúng (username / current-password), Vietnamese error messages inline + Alert destructive cho general error
- Dashboard placeholder role-aware: greeting "Xin chào, {fullName}" + role line "Bạn đang đăng nhập với vai trò {ROLE_LABELS[role]} · {organizationName}" + empty state Card LayoutDashboard icon
- 404/500 hero pages tiếng Việt theo UI-SPEC: 404 navy `text-blue-700`, 500 red `text-red-600`, 36px bold, no-stack-trace contract (verified bằng grep ! `error.message` / `error.stack` trong JSX)
- global-error.tsx fallback inline-style cho catastrophic root layout crash — defense-in-depth khi Tailwind chưa load
- UAT checklist 8 tài khoản với 67 checkboxes covering AUTH-01..08, mapping requirement → section

## Task Commits

Each task was committed atomically:

1. **Task 1: Login page split 60/40 + LoginForm + SSO + Quốc huy** — `fd0f1a8` (feat)
2. **Task 2: Dashboard placeholder + 404/500 hero pages** — `f560293` (feat)
3. **Task 3: UAT manual checklist 8 tài khoản** — `5baa03a` (docs)

**Plan metadata:** _will be hashed in final commit_

## Files Created/Modified

- `public/logo-quoc-huy.svg` — Simplified Quốc huy outline 80×80 (circle + 5-point star + curl ribbon decoration), navy currentColor stroke
- `components/auth/QuocHuySvg.tsx` — React component wrap SVG markup, accept className
- `components/auth/SsoPlaceholderButton.tsx` — Outline button + Building2 icon + onClick toast.info "Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án"
- `components/auth/LoginForm.tsx` — useActionState wrap loginAction; show/hide password Eye/EyeOff toggle; Alert destructive khi state.error; inline text-red-600 cho fieldErrors; SubmitButton với useFormStatus → Loader2 + "Đang đăng nhập..."
- `app/(auth)/layout.tsx` — Minimal pass-through `<>{children}</>` (no shell, no provider)
- `app/(auth)/login/page.tsx` — Server Component, await auth() + redirect defaultLandingPath nếu đã auth; split 60/40 (`lg:w-3/5` brand + `lg:w-2/5` form); Quốc hiệu Times New Roman italic; wordmark XTTMQG `text-4xl font-bold text-blue-700`; mobile fallback mini header
- `app/(app)/dashboard/page.tsx` — Async RSC, await auth(), greeting + ROLE_LABELS lookup + organization concat; empty state Card với LayoutDashboard 48px icon + heading + body
- `app/not-found.tsx` — Centered hero "404" navy `text-4xl font-bold text-blue-700` + heading "Không tìm thấy trang" + body + CTA "Quay về trang chủ" với Home icon
- `app/error.tsx` — `'use client'`, "500" red `text-4xl font-bold text-red-600` + heading "Đã xảy ra lỗi" + body + 2 CTA "Thử lại" (reset()) + "Quay về trang chủ" (outline); useEffect console.error chỉ trong dev
- `app/global-error.tsx` — `'use client'`, render `<html lang="vi">` + `<body>` với inline style; "500" red + heading "Đã xảy ra lỗi nghiêm trọng" + button Thử lại; KHÔNG dùng Tailwind (root crash safety)
- `scripts/uat-checklist.md` — Manual UAT checklist 8 tài khoản với pre-checks, login flow per account table, negative cases, SSO/logout/session/route-guards/404-500/i18n/a11y sections, coverage mapping AUTH-01..08

## Decisions Made

- **Quốc huy SVG simplified outline:** Placeholder chỉ render circle + 5-point star + ribbon curl với navy currentColor stroke, không đính raster image chính thức của Bộ CT. UI-SPEC §Brand Element Treatment confirm placeholder acceptable cho POC tránh copyright issue.
- **React 19 hooks adoption:** `useActionState` (React 19) thay `useFormState` (deprecated); `useFormStatus` từ react-dom cho pending state — pattern mới của Next.js 15 / React 19, sẽ áp dụng cho mọi form submit qua Server Action ở phase sau.
- **global-error.tsx inline-style:** Không dùng Tailwind/shadcn vì khi root layout crash, CSS có thể chưa load. Inline style đảm bảo fallback render được trong worst case (catastrophic root error).
- **Defense-in-depth auth redirect:** LoginPage RSC check await auth() + redirect defaultLandingPath song song với middleware — handle race khi cookie expire ngay khi user navigate.
- **Mobile fallback mini header:** Brand panel collapse hoàn toàn ở < 1024px; thay bằng compact `lg:hidden` block trong form panel hiện QuocHuySvg + wordmark — đảm bảo brand presence khi screen nhỏ mà không stuff layout.

## Deviations from Plan

None - plan executed exactly as written.

Lưu ý nhỏ: ESLint warning pre-existing trong `prisma/seed.ts` + `prisma/seed/helpers.ts` (no-console) — out of scope per scope boundary, không phải do Plan 05 thay đổi gì. Build vẫn pass exit 0.

## Patterns Established

- **Server Action form pattern:** `<form action={formAction}>` + `useActionState(action, initial)` ngoài + `useFormStatus()` trong child SubmitButton để separate state. Mọi form CRUD ở phase sau follow pattern này (Phase 02 danh-muc, Phase 03 đề án...).
- **Vietnamese error message contract:** "Vui lòng + verb" cho validation, "X chưa đúng. Vui lòng thử lại" cho auth — tone formal, chủ động, không cộc lộc kiểu "X sai".
- **Centered hero pattern:** `min-h-screen flex items-center justify-center bg-slate-50` + nested `flex flex-col items-center text-center gap-6 max-w-md py-24` — dùng cho 404/500 + có thể tái dùng cho empty page state ở phase sau.
- **Auth route group minimal layout:** `(auth)/layout.tsx` chỉ pass-through, không AppShell/Provider — vì root layout đã handle html/body và auth pages không cần TanStack Query / sidebar.
- **Already-auth redirect:** Server component pattern `const session = await auth(); if (session?.user) redirect(defaultLandingPath(session.user.role))` — apply cho mọi auth-only page hoặc landing tương lai.

## Verification

**Automated checks (all pass):**
- `npx tsc --noEmit` exit 0 (TypeScript strict mode)
- `npm run build` exit 0 — "✓ Compiled successfully in 8.4s", 7 static pages generated
- All grep verifies in plan PASS (24 patterns checked across 6 files for Task 1, 14 patterns for Task 2, 9 for Task 3)
- 0 occurrences of `error.message` / `error.stack` trong JSX của error.tsx, global-error.tsx, not-found.tsx (T-05-01 mitigation verified)

**Build output route list:**
```
Route (app)                                Size  First Load JS
┌ ○ /                                     138 B    102 kB
├ ○ /_not-found                           138 B    102 kB
├ ƒ /api/auth/[...nextauth]               138 B    102 kB
├ ƒ /api/pdf/spike                        138 B    102 kB
├ ƒ /dashboard                            138 B    102 kB
├ ƒ /login                              4.57 kB    123 kB
└ ○ /test-pdf                             308 B    176 kB
ƒ Middleware                            87.2 kB
```

**Manual UAT (deferred to user):** UAT checklist `scripts/uat-checklist.md` documented đầy đủ 8 accounts; user chạy `npm run start` và check 67 checkboxes để sign-off Phase 1.

## Threat Mitigations Applied (per `<threat_model>`)

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-05-01 (stack trace leak) | error.tsx + global-error.tsx + not-found.tsx KHÔNG render `{error.message}` / `{error.stack}` trong JSX. Chỉ console.error trong useEffect khi `process.env.NODE_ENV === 'development'`. Verified bằng `grep -! '{error.message}'` trong cả 3 file. |
| T-05-02 (user enumeration) | LoginForm hiện error từ `state.error` — chỉ chứa generic message từ Plan 03 `loginAction` (`'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'`). KHÔNG split client-side. |
| T-05-03 (open redirect) | LoginPage KHÔNG đọc / honor `searchParams.next` — dùng `defaultLandingPath(role)` từ loginAction redirect Plan 03. Plan 05 simplicity: bỏ qua next param entirely. |
| T-05-04 (CSRF form) | `<form action={formAction}>` qua Next.js Server Action — built-in action ID hash + Origin header check, không cần manual CSRF token. |
| T-05-06 (already-auth /login access) | LoginPage RSC `await auth() + redirect(defaultLandingPath(role))` defense-in-depth song song middleware. |
| T-05-07 (Quốc huy SVG XSS) | `<QuocHuySvg />` React component — JSX tự escape; SVG markup hardcoded, không user content embedded; KHÔNG dùng dangerouslySetInnerHTML. |

T-05-05 (autocomplete leak) + T-05-08 (rate limit brute force) accept per plan threat model — POC scope.

## Coverage Mapping (Requirements)

| Req ID | Coverage |
|--------|----------|
| AUTH-01 | LoginForm + loginAction redirect role-based (Plan 03 + 05); UAT login flow per account 8 rows |
| AUTH-05 | SsoPlaceholderButton + Sonner info toast Vietnamese |
| AUTH-06 | Layout shell consumed (Plan 04) + Dashboard placeholder render với role-aware greeting |
| AUTH-08 | not-found.tsx + error.tsx + global-error.tsx no-stack-trace + UAT 404/500 section |

(AUTH-02/03/04/07 đã hoàn thành ở Plan 03/04; Plan 05 không reopen.)

## Phase 1 End-to-End Status

Plan 05 là **plan cuối cùng của Phase 1**. Sau Plan 05, tất cả 6 plans (01..06) đã complete. Phase 1 ready cho user UAT signing-off:

- Plan 01: Repo init + shadcn config + Be Vietnam Pro fonts
- Plan 02: Prisma schema 14 models + seed 8 users
- Plan 03: NextAuth Credentials + middleware + auth() helpers
- Plan 04: 18 shadcn primitives + AppShell layout + role-aware sidebar
- **Plan 05 (THIS): Login + Dashboard + 404/500 + UAT checklist**
- Plan 06: PDF spike (independent thread, đã complete)

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: public/logo-quoc-huy.svg (424 bytes)
- FOUND: components/auth/QuocHuySvg.tsx
- FOUND: components/auth/SsoPlaceholderButton.tsx
- FOUND: components/auth/LoginForm.tsx
- FOUND: app/(auth)/layout.tsx
- FOUND: app/(auth)/login/page.tsx
- FOUND: app/(app)/dashboard/page.tsx
- FOUND: app/not-found.tsx
- FOUND: app/error.tsx
- FOUND: app/global-error.tsx
- FOUND: scripts/uat-checklist.md

**Commits verified:**
- FOUND: fd0f1a8 (Task 1)
- FOUND: f560293 (Task 2)
- FOUND: 5baa03a (Task 3)
