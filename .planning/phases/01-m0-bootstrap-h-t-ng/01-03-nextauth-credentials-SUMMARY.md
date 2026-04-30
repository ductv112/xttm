---
phase: 01-m0-bootstrap-h-t-ng
plan: 03
subsystem: auth
tags: [nextauth, auth-js-v5, credentials, bcryptjs, jwt, edge-middleware, server-actions, zod, vietnamese-locale]

requires:
  - phase: 01-01-repo-init
    provides: "lib/constants.ts (HARDCODED_USERS + ROLES + ORG_NAMES), lib/permissions.ts (defaultLandingPath), lib/prisma.ts (singleton), types/next-auth.d.ts (Session augmentation), .env.local (AUTH_SECRET + AUTH_TRUST_HOST), bcryptjs + next-auth@beta + zod packages installed"
  - phase: 01-02-prisma-schema-seed
    provides: "User table seeded với 8 hardcoded accounts (bcrypt cost 10), Organization table với 5 orgs (Cục XTTM/Bộ CT/VITAS/LEFASO/VINATEX), prisma/dev.db ready"

provides:
  - "Auth.js v5 split-config: auth.config.ts edge-safe (used by middleware) + lib/auth.ts full Node (Credentials Provider + bcrypt + Prisma)"
  - "JWT session strategy 7d, callbacks inject {id, username, fullName, role, organizationId, organizationName} khớp types/next-auth.d.ts"
  - "Edge middleware (87.2 kB bundle) protect mọi route ngoại trừ /login, /api/auth, /api/*, /_next/*, fonts, mock-files, logo, /test-pdf"
  - "authorized callback: chưa auth → /login (preserve next= param trừ /, /dashboard); đã auth + /login → /dashboard"
  - "loginAction server action với Zod validation Vietnamese error + role-based redirect qua defaultLandingPath"
  - "logoutAction server action: signOut(redirect:false) → redirect('/login')"
  - "scripts/smoke-auth.mts utility — 8/8 hardcoded accounts authenticate đúng role + org name"
  - "User-not-found path runs dummy bcrypt.compare → mitigate timing-based user enumeration (T-03-05)"
  - "Generic Vietnamese error 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại' cho cả case sai username và sai password"
  - "Placeholder pages app/(auth)/login, app/(app)/dashboard, app/(app)/layout — Plan 04 + 05 sẽ overwrite với UI thật"
affects: [01-04-layout-shell, 01-05-login-pages, 02-quan-tri-danh-muc, all-future-phases-needing-auth]

tech-stack:
  added:
    - "next-auth@beta v5.0.0-beta (already installed Plan 01) — wired qua split-config pattern"
    - "Auth.js v5 Credentials Provider (next-auth/providers/credentials)"
    - "AuthError import từ 'next-auth' để catch trong server action"
  patterns:
    - "Split config: auth.config.ts (edge-safe NextAuthConfig — providers: [], callbacks không DB) + lib/auth.ts (Node — spreads authConfig + adds Credentials provider với bcrypt + prisma) — middleware import authConfig only để không pull bcrypt/prisma vào edge bundle"
    - "Server Action wrap signIn: useActionState pattern (prev, formData) → LoginState với error|fieldErrors; redirect role-based qua defaultLandingPath; AuthError.cause.err.message extract vietnamese message"
    - "Constant-time-ish dummy hash (DUMMY_HASH = '$2a$10$' + 'A'.repeat(53)) — nếu user không tồn tại vẫn run bcrypt.compare để mitigate timing attack T-03-05"
    - "Generic auth error message lock — KHÔNG split error 'user not found' vs 'password wrong' (T-03-05 user enumeration)"
    - "Edge middleware export pattern: export const { auth: middleware } = NextAuth(authConfig); export const config = { matcher: [...] };"
    - "Smoke test mts script dùng dynamic import để dodge tsx ESM named-export edge case với .ts files (precedent Plan 06)"

key-files:
  created:
    - "auth.config.ts (root-level edge-safe NextAuthConfig — 67 lines)"
    - "lib/auth.ts (Node Credentials provider + bcrypt + prisma — 84 lines, exports handlers/signIn/signOut/auth)"
    - "app/api/auth/[...nextauth]/route.ts (3 lines — re-export GET/POST từ handlers)"
    - "middleware.ts (root-level Edge middleware với matcher — 20 lines)"
    - "app/(auth)/login/page.tsx (placeholder, Plan 05 sẽ overwrite)"
    - "app/(app)/dashboard/page.tsx (placeholder, Plan 05 sẽ overwrite)"
    - "app/(app)/layout.tsx (placeholder, Plan 04 sẽ overwrite)"
    - "app/(auth)/_actions/login.ts (66 lines — loginAction server action)"
    - "app/(auth)/_actions/logout.ts (8 lines — logoutAction server action)"
    - "scripts/smoke-auth.mts (74 lines — 8 hardcoded account smoke test utility)"
  modified:
    - "lib/constants.ts (Rule 1 fix — ORG_NAMES.LEFASO em-dash → hyphen để khớp seed DB)"

key-decisions:
  - "Split config Auth.js v5 pattern: auth.config.ts edge-safe + lib/auth.ts Node — middleware Edge runtime KHÔNG load bcrypt/prisma"
  - "JWT session strategy 7d (maxAge 60*60*24*7) — POC scope đủ, không cần refresh rotation"
  - "Generic auth error 'Tên đăng nhập hoặc mật khẩu chưa đúng' lock cho cả user-not-found và password-mismatch (T-03-05 mitigate user enumeration)"
  - "Dummy bcrypt.compare khi user không tồn tại — duy trì constant-time-ish để mitigate timing attack"
  - "Server action loginAction lookup role TRƯỚC signIn để compute landingPath qua defaultLandingPath, signIn(redirect:false) để control flow tự manual"
  - "Matcher exclude /test-pdf để giữ Plan 06 dev-only PDF spike runnable post-auth"
  - "AuthError.cause.err.message extract — Auth.js v5 wraps Credentials authorize() errors trong AuthError.cause.err"
  - "ORG_NAMES.LEFASO align hyphen với seed DB value (Rule 1 bug — em-dash trong constants không khớp seeded reality)"

patterns-established:
  - "Future protected routes chỉ cần đặt trong app/(app)/* — middleware authorized callback tự handle redirect"
  - "Server action mutation pattern: 'use server' → Zod validate → prisma query với RBAC check → AuthError catch → redirect role-based"
  - "Session access trong RSC: import { auth } from '@/lib/auth' rồi const session = await auth(); session.user typed với types/next-auth.d.ts"
  - "Smoke utility scripts/* — utility regression check, dynamic import dodge ESM edge case"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04

duration: 4m
completed: 2026-04-30
---

# Phase 01 Plan 03: NextAuth Credentials Summary

**Auth.js v5 Credentials Provider với split-config pattern (edge-safe + Node) — 8 hardcoded accounts authenticate đúng bcrypt + role + org, JWT session 7d inject role + organizationId vào session.user, edge middleware 87.2 kB protect mọi route ngoại trừ /login, server actions loginAction + logoutAction với Vietnamese error messages.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-30T17:06:23Z
- **Completed:** 2026-04-30T17:10:23Z
- **Tasks:** 3 (all `type="auto"`, no checkpoints)
- **Files created:** 10 (1 auth.config + 1 lib/auth + 1 route handler + 1 middleware + 3 placeholders + 2 server actions + 1 smoke test)
- **Files modified:** 1 (lib/constants.ts — Rule 1 fix)

## Accomplishments

- Auth.js v5 split-config setup chuẩn: `auth.config.ts` (edge-safe NextAuthConfig — providers: [], jwt + session + authorized callbacks) + `lib/auth.ts` (full Node với Credentials Provider + bcrypt + prisma + dummy hash chống timing attack)
- Middleware Edge bundle 87.2 kB compile thành công — KHÔNG pull bcrypt/prisma vào edge runtime
- 8/8 hardcoded accounts smoke test PASS (admin/banql/chuyenvien/hoidong/donvi1/donvi2/taichinh/lanhdao) — bcrypt verify + role match + organization name match
- JWT session strategy 7d, callbacks inject `{id, username, fullName, role, organizationId, organizationName}` khớp `types/next-auth.d.ts` Plan 01
- `loginAction` server action với Zod validation Vietnamese errors + role-based redirect qua `defaultLandingPath` (admin/banql/lanhdao→/dashboard, chuyenvien→/tiep-nhan, hoidong→/tham-dinh, donvi→/de-an, taichinh→/tai-chinh)
- `logoutAction` server action: `signOut(redirect:false)` → `redirect('/login')`
- Threat mitigations: T-03-01 (bcrypt.compare not plaintext), T-03-02 (AUTH_SECRET env-only), T-03-04 (defaultLandingPath whitelist), T-03-05 (generic error + dummy hash), T-03-06 (jwt callback initial-only role inject), T-03-08 (no passwordHash in JWT), T-03-09 (matcher proper exclusion), T-03-10 (catch + log + generic message)
- Phase verification: `npx tsc --noEmit` exit 0, `npm run build` exit 0 với 7 routes + Middleware bundle 87.2 kB

## Smoke Test Output

```
✓ admin        role=ADMIN       org=(no org)
✓ banql        role=BANQL       org=Cục Xúc tiến Thương mại
✓ chuyenvien   role=CHUYENVIEN  org=Cục Xúc tiến Thương mại
✓ hoidong      role=HOIDONG     org=Cục Xúc tiến Thương mại
✓ donvi1       role=DONVI       org=Hiệp hội Da giày - Túi xách Việt Nam
✓ donvi2       role=DONVI       org=Hiệp hội Dệt may Việt Nam
✓ taichinh     role=TAICHINH    org=Cục Xúc tiến Thương mại
✓ lanhdao      role=LANHDAO     org=Bộ Công Thương
```

Exit code: 0 (8/8 PASS)

## Task Commits

1. **Task 1: Auth.js v5 split config (auth.config.ts + lib/auth.ts + route handler)** — `1f24a09` (feat)
2. **Task 2: Edge middleware + placeholder pages** — `1eac427` (feat)
3. **Task 3: Server actions loginAction + logoutAction + smoke test 8 accounts** — `781b8b5` (feat)

**Deviation commits:**
- `5cf28e3` (fix) — Rule 1 align ORG_NAMES.LEFASO hyphen với seed DB
- `925951c` (fix) — Rule 3 exclude /test-pdf khỏi middleware matcher

## Files Created

### Auth core (Task 1)
- `auth.config.ts` (root) — edge-safe NextAuthConfig: pages.signIn '/login', JWT 7d, callbacks (authorized + jwt + session) inject role + orgId + orgName
- `lib/auth.ts` — Credentials Provider full: Zod validate username/password → prisma.user.findUnique + organization include → check isActive → bcrypt.compare → return session shape; dummy hash khi user không tồn tại; generic error 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'
- `app/api/auth/[...nextauth]/route.ts` — re-export GET/POST từ lib/auth handlers

### Middleware + placeholders (Task 2)
- `middleware.ts` (root) — `export const { auth: middleware } = NextAuth(authConfig); matcher exclude api/auth, api, _next, favicon, fonts, mock-files, logo-, test-pdf`
- `app/(auth)/login/page.tsx` — placeholder (Plan 05 overwrite)
- `app/(app)/dashboard/page.tsx` — placeholder (Plan 05 overwrite)
- `app/(app)/layout.tsx` — passthrough placeholder (Plan 04 overwrite với AppShell)

### Server actions + smoke (Task 3)
- `app/(auth)/_actions/login.ts` — `loginAction(prev, formData) → LoginState`: Zod validate → user lookup → signIn(redirect:false) → AuthError catch trả message → redirect(defaultLandingPath(role))
- `app/(auth)/_actions/logout.ts` — `logoutAction()`: signOut(redirect:false) → redirect('/login')
- `scripts/smoke-auth.mts` — utility test 8 hardcoded accounts với dynamic import dodge tsx ESM edge case

## Files Modified

- `lib/constants.ts` (Rule 1 fix) — `ORG_NAMES.LEFASO` em-dash `—` → hyphen `-` để khớp seed DB value (`Hiệp hội Da giày - Túi xách Việt Nam`)

## Decisions Made

- **Auth.js v5 split-config pattern** — `auth.config.ts` edge-safe (chỉ providers: [] + callbacks không DB) + `lib/auth.ts` Node (spreads authConfig + adds Credentials với bcrypt + prisma). Middleware import authConfig only để Edge bundle KHÔNG pull bcrypt/prisma. Đây là pattern chính thức Auth.js v5 docs.
- **JWT session strategy 7 days** — `maxAge: 60*60*24*7` per plan; POC scope đủ, không cần refresh token rotation phức tạp.
- **Generic auth error lock** — `'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'` cho cả case user-not-found và password-mismatch (T-03-05 mitigate user enumeration). KHÔNG split thành 2 messages khác nhau.
- **Dummy bcrypt.compare** — `DUMMY_HASH = '$2a$10$' + 'A'.repeat(53)` để run khi user không tồn tại, duy trì constant-time-ish response không cho attacker phân biệt 'user không tồn tại' vs 'password sai' qua timing.
- **AuthError.cause.err.message extract** — Auth.js v5 wraps Credentials `authorize()` thrown errors trong `error.cause.err`; server action cast `(error.cause as { err?: Error }).err` để lấy Vietnamese message gốc.
- **Matcher exclude /test-pdf** — Plan 06 đã tạo /test-pdf dev-only smoke page; matcher exclude để page accessible without auth, giữ PDF spike workflow runnable.
- **Server action loginAction lookup role TRƯỚC signIn** — `prisma.user.findUnique({where: {username}, select: {role, isActive}})` xong mới `signIn('credentials', {redirect: false})`. Cách này cho phép tính `defaultLandingPath(role)` trước khi `redirect()` (signIn redirect false không tự redirect).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ORG_NAMES.LEFASO em-dash trong lib/constants.ts không khớp seed DB hyphen**

- **Found during:** Task 3 (smoke-auth.mts run)
- **Issue:** `lib/constants.ts` (Plan 01) ORG_NAMES.LEFASO = `'Hiệp hội Da giày — Túi xách Việt Nam'` (em-dash `—` U+2014). `prisma/seed/organizations.ts` (Plan 02) name = `'Hiệp hội Da giày - Túi xách Việt Nam'` (hyphen `-`). Auth.js session.user.organizationName lấy runtime từ `prisma.user.findUnique → user.organization.name` = hyphen value. Plan 03 must_haves.truths quy định hyphen value. Smoke test compare ORG_NAMES vs DB → donvi1 fail "org mismatch".
- **Fix:** Update `lib/constants.ts` ORG_NAMES.LEFASO em-dash → hyphen để align với seed DB và plan truth.
- **Files modified:** `lib/constants.ts`
- **Verification:** Re-run `npx tsx scripts/smoke-auth.mts` → 8/8 ✓ PASS exit 0.
- **Committed in:** `5cf28e3` (deviation commit)

**2. [Rule 3 - Blocking] Middleware matcher chặn /test-pdf — Plan 06 PDF spike workflow break**

- **Found during:** Task 2 verification (post-build review)
- **Issue:** Plan 06 (PDF spike) đã tạo `/test-pdf` dev-only smoke page (chạy được mà không cần auth). Plan 03 plan-defined matcher exclude `api/auth|api|_next/static|_next/image|favicon|fonts|mock-files|logo-` nhưng KHÔNG có `test-pdf`. Sau Plan 03, GET `/test-pdf` chưa auth → middleware redirect về `/login` → break Plan 06 spike workflow. Execution context yêu cầu exclude `/test-pdf`.
- **Fix:** Update `middleware.ts` matcher thêm `test-pdf` vào negative lookahead group: `(?!api/auth|api|...|logo-|test-pdf)`.
- **Files modified:** `middleware.ts`
- **Verification:** `npm run build` pass với Middleware bundle 87.2 kB.
- **Committed in:** `925951c` (deviation commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)

**Impact on plan:** Cả 2 deviations cần thiết. Rule 1 fix align constants với reality (DB), Rule 3 giữ cross-plan workflow intact. Không có scope creep — kết quả cuối cùng tương đương 100% plan goal.

## Issues Encountered

- **tsx ESM named-export edge case với .ts files** — `scripts/smoke-auth.mts` initially import `{ HARDCODED_USERS, ORG_NAMES }` từ `'../lib/constants'` fail với `SyntaxError: does not provide an export named 'HARDCODED_USERS'`. Đã có precedent từ Plan 06 (`scripts/pdf-smoke-test.mts` dùng dynamic `await import()` để dodge). Apply cùng pattern: `const constantsModule = await import('../lib/constants'); const HARDCODED_USERS = constantsModule.HARDCODED_USERS;`.
- **Git LF→CRLF warnings** — Windows default line ending; không ảnh hưởng functionality.

## User Setup Required

None — không cần external services. AUTH_SECRET đã có trong `.env.local` (Plan 01 sinh ngẫu nhiên 32-byte base64). Database `prisma/dev.db` (Plan 02 seeded) đã có 8 users sẵn sàng authenticate.

## Threat Model Mitigations Applied

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-03-01 (S - Spoofing Credentials) | ✅ MITIGATED — `bcrypt.compare(password, user.passwordHash)`, KHÔNG plaintext compare. Generic error cho cả 2 case. |
| T-03-02 (T - JWT secret) | ✅ MITIGATED — AUTH_SECRET đọc `process.env.AUTH_SECRET` (Plan 01 .env.local). Grep lib/, auth.config.ts không có literal AUTH_SECRET. |
| T-03-03 (I - Cookie security) | ✅ MITIGATED — Trust NextAuth v5 default (httpOnly + sameSite=lax + secure trong production). KHÔNG override cookie config. |
| T-03-04 (I - Open redirect) | ✅ MITIGATED — loginAction redirect chỉ qua `defaultLandingPath(role)` whitelist (/dashboard, /de-an, /tham-dinh, /tiep-nhan, /tai-chinh). KHÔNG dùng raw callbackUrl từ searchParams. |
| T-03-05 (I - Account enumeration) | ✅ MITIGATED — Generic error 'Tên đăng nhập hoặc mật khẩu chưa đúng' lock; user-not-found path run dummy `bcrypt.compare(password, DUMMY_HASH)` để duy trì constant-time-ish. |
| T-03-06 (E - Role injection JWT) | ✅ MITIGATED — `jwt({token, user})` chỉ set token.role lần đầu khi `user` truthy (initial sign-in từ authorize). Subsequent calls chỉ return token (không cho client modify). |
| T-03-07 (D - Bcrypt timing) | ⚠️ ACCEPTED — Cost 10 ~80ms/compare. POC scope không cần rate limiting; Plan 05 form sẽ disable button khi pending. |
| T-03-08 (I - Session JWT exposure) | ✅ MITIGATED — JWT chỉ chứa {id, username, fullName, role, organizationId, organizationName} từ session callback. KHÔNG có passwordHash. Verify khớp types/next-auth.d.ts. |
| T-03-09 (T - Edge bypass) | ✅ MITIGATED — Matcher exclude api/auth + api + _next + assets, include /(app)/* protected routes. authorized callback redirect /login khi !isLoggedIn. |
| T-03-10 (I - Stack trace) | ✅ MITIGATED — `lib/auth.ts authorize()` catch block: known errors (GENERIC, INACTIVE) re-throw clean message; unknown errors `console.error` server-side, throw GENERIC client-side. KHÔNG bao gồm error.stack trong response. |

## Next Phase Readiness

**Plan 04 (Layout shell) ready:**
- `import { auth } from '@/lib/auth'` ready — Plan 04 `(app)/layout.tsx` có thể `const session = await auth();` để get session với typed user shape
- `session.user.role` typed Role — render menu động qua `getMenuItems(role)` (Plan 01 lib/permissions.ts)
- `session.user.organizationName` có data thật (5 orgs Vietnamese names) — Topbar render org badge

**Plan 05 (Login UI) ready:**
- `import { loginAction } from '@/app/(auth)/_actions/login'` — wire qua `useActionState(loginAction, initialState)` trong React 19 form
- `import { logoutAction } from '@/app/(auth)/_actions/logout'` — wire qua AlertDialog confirm flow trong topbar dropdown
- LoginState typed: `{error?: string, fieldErrors?: {username?: string[], password?: string[]}}` — form hiển thị error theo shape
- Vietnamese errors lock: 'Vui lòng nhập tên đăng nhập', 'Vui lòng nhập mật khẩu', 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại', 'Tài khoản này hiện đang bị khóa. Vui lòng liên hệ quản trị viên'

**No blockers.** Phase 1 có thể tiếp tục Plan 04.

## Self-Check

Verifying claims before completion:

**Files created:**
- FOUND: `auth.config.ts`
- FOUND: `lib/auth.ts`
- FOUND: `app/api/auth/[...nextauth]/route.ts`
- FOUND: `middleware.ts`
- FOUND: `app/(auth)/login/page.tsx`
- FOUND: `app/(app)/dashboard/page.tsx`
- FOUND: `app/(app)/layout.tsx`
- FOUND: `app/(auth)/_actions/login.ts`
- FOUND: `app/(auth)/_actions/logout.ts`
- FOUND: `scripts/smoke-auth.mts`

**Commits:**
- FOUND: `1f24a09` (Task 1: split-config)
- FOUND: `1eac427` (Task 2: middleware + placeholders)
- FOUND: `781b8b5` (Task 3: server actions + smoke)
- FOUND: `5cf28e3` (Rule 1 fix)
- FOUND: `925951c` (Rule 3 fix)

**Behavioral verification:**
- `npx tsc --noEmit` exit 0 ✓
- `npm run build` exit 0 — Middleware bundle 87.2 kB ✓
- `npx tsx scripts/smoke-auth.mts` exit 0 — 8/8 ✓ PASS ✓
- Session shape khớp types/next-auth.d.ts (id + username + fullName + role + organizationId + organizationName) ✓
- auth.config.ts KHÔNG import bcryptjs hay @/lib/prisma ✓
- middleware.ts KHÔNG import bcryptjs hay @/lib/prisma ✓
- lib/auth.ts throw 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại' ✓
- AUTH-01 (đăng nhập + role-based redirect via defaultLandingPath) ✓
- AUTH-02 (8 hardcoded accounts bcrypt verify smoke 8/8) ✓
- AUTH-03 (logoutAction + signOut + redirect /login) ✓
- AUTH-04 (JWT 7d session persist) ✓

## Self-Check: PASSED

---

*Phase: 01-m0-bootstrap-h-t-ng*
*Completed: 2026-04-30*
