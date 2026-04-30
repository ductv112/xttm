---
status: human_needed
phase: 01-m0-bootstrap-h-t-ng
verified_at: 2026-04-30
must_haves_passed: 32/32
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: 0/0
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Mở PDF mẫu trong Chrome / Edge / Adobe Reader để xác nhận dấu tiếng Việt render đúng (không bị □ hay ?)"
    expected: "Tất cả ký tự có dấu (á à ả ã ạ — ắ ằ ẳ ẵ ặ — ấ ầ ẩ ẫ ậ — đ Đ — ê ô ơ ư) hiển thị đúng; watermark BẢN MẪU đỏ chéo; layout 2 cột header (BỘ CT trái + Quốc hiệu phải); signature block KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG"
    why_human: "Visual font rendering trong PDF viewer chỉ verify được bằng mắt; programmatic test (smoke) đã PASS (size 36KB + magic %PDF- + font BeVietnamPro embedded), nhưng không thay thế được manual visual UAT"
  - test: "UAT login flow 8 tài khoản theo scripts/uat-checklist.md (admin/banql/chuyenvien/hoidong/donvi1/donvi2/taichinh/lanhdao)"
    expected: "Mỗi tài khoản đăng nhập thành công → redirect đúng path role-based → sidebar render đúng menu set của role → topbar hiện đúng greeting + role · org → click logout → AlertDialog xuất hiện → confirm → toast 'Đã đăng xuất' → quay về /login"
    why_human: "End-to-end browser flow (cookie set, redirect, sidebar render, dropdown click, AlertDialog interaction, toast hiển thị) yêu cầu human tương tác qua trình duyệt thật; programmatic checks đã verify backend (smoke 8/8 PASS) nhưng UI flow cần mắt người"
  - test: "GET /this-route-does-not-exist trong browser → kiểm tra trang 404 render đúng"
    expected: "Hero '404' navy text-blue-700 + heading 'Không tìm thấy trang' + body Vietnamese + CTA 'Quay về trang chủ'; KHÔNG render error.message hay error.stack"
    why_human: "Visual rendering của trang 404 cần human verify (browser viewport + style)"
  - test: "Kích hoạt 500 error (vd throw trong page server component tạm) → kiểm tra trang error.tsx"
    expected: "Hero '500' red text-red-600 + 'Đã xảy ra lỗi' + 2 CTA (Thử lại + Quay về trang chủ); KHÔNG hiển thị error.message hay error.stack trong DOM"
    why_human: "Cần inject error điều kiện thật để verify error boundary; trong DevTools kiểm tra DOM không lộ stack"
---

# Phase 1: M0 Bootstrap Hạ tầng — Verification Report

**Phase Goal:** Người dùng đăng nhập được vào layout shell tiếng Việt với 8 tài khoản hardcoded; foundation kỹ thuật (Prisma schema, Next.js 15, shadcn/ui, PDF spike) đủ vững để mọi phase sau xây trên đó.

**Verified:** 2026-04-30
**Status:** human_needed (automated layer 32/32 PASSED; visual UAT pending)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Truths được tổng hợp từ 6 plan must_haves frontmatter + 8 AUTH requirements + ROADMAP success criteria.

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | Schema Prisma có đầy đủ 14 models cho M0 + scaffolding cho phase 2-9 | ✓ VERIFIED | `prisma/schema.prisma` 323 lines, 14 `model ` declarations: User, Role, Permission, RolePermission, Organization, OrganizationProfile, ProgramCycle, Project (với parentProjectId + ProjectYearLink), EvaluationCouncil, ScoreSheet, Contract, Report, Attachment, AuditLog |
| 2 | Database SQLite có 8 users + 5 organizations với tên Vietnamese thật | ✓ VERIFIED | Prisma query: `USERS_COUNT: 8`, `ORGS_COUNT: 5`. Orgs: BO_CT (Bộ Công Thương), CUC_XTTM (Cục Xúc tiến Thương mại), VITAS (Hiệp hội Dệt may Việt Nam), LEFASO (Hiệp hội Da giày - Túi xách Việt Nam), VINATEX (Tập đoàn Dệt May Việt Nam) |
| 3 | 8 hardcoded accounts authenticate được với bcrypt cost 10 (AUTH-02) | ✓ VERIFIED | `scripts/smoke-auth.mts` exit 0, 8/8 PASS với role + org map đúng (admin→null, banql/chuyenvien/hoidong/taichinh→CUC_XTTM, donvi1→LEFASO, donvi2→VITAS, lanhdao→BO_CT) |
| 4 | NextAuth v5 split-config: edge-safe `auth.config.ts` + Node `lib/auth.ts` với Credentials Provider | ✓ VERIFIED | `auth.config.ts` không import bcryptjs/prisma; `lib/auth.ts` import Credentials + bcrypt + prisma; `Object.keys(handlers)` exports GET/POST |
| 5 | Login với username + password redirect role-based (AUTH-01) | ✓ VERIFIED | `app/(auth)/_actions/login.ts` calls `signIn('credentials', { redirect: false })` rồi `redirect(defaultLandingPath(role))`; smoke test xác nhận 8/8 user authenticate |
| 6 | Logout server action signOut + redirect /login (AUTH-03) | ✓ VERIFIED | `app/(auth)/_actions/logout.ts` exports `logoutAction` calls `signOut({ redirect: false })` then `redirect('/login')`; LogoutDialog wire qua DropdownMenuItem trong UserMenu |
| 7 | Session JWT giữ trạng thái qua refresh (AUTH-04) | ✓ VERIFIED | `auth.config.ts` session.strategy='jwt' với maxAge=7d; jwt+session callbacks inject id/username/fullName/role/organizationId/organizationName |
| 8 | SSO placeholder button + Sonner info toast Vietnamese (AUTH-05) | ✓ VERIFIED | `components/auth/SsoPlaceholderButton.tsx` onClick `toast.info('Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án')`, icon Building2 |
| 9 | Layout shell sidebar role-aware + topbar + breadcrumb tiếng Việt (AUTH-06) | ✓ VERIFIED | `AppSidebar` RSC `getMenuItems(role)` split NGHIEP_VU/QUAN_TRI; `menu-smoke.mts` confirm 7 roles → 7 menu sets khác nhau (ADMIN=18, BANQL=14, CHUYENVIEN=4, HOIDONG=5, DONVI=10, TAICHINH=4, LANHDAO=13); Topbar h-14 sticky với SidebarTrigger + AppBreadcrumb + Bell + UserMenu; AppBreadcrumb usePathname + buildBreadcrumb |
| 10 | Light mode hardcode + locale vi-VN toàn cục (AUTH-07) | ✓ VERIFIED | `app/layout.tsx` `<html lang="vi" className="light">`; `lib/format.ts` import `vi` từ `date-fns/locale` cho formatDate/DateTime/DateLong + `Intl.NumberFormat('vi-VN')` cho VND/number; KHÔNG có ThemeProvider trong AppProviders |
| 11 | Trang 404 tiếng Việt KHÔNG lộ stack (AUTH-08) | ✓ VERIFIED | `app/not-found.tsx`: hero "404" `text-4xl font-bold text-blue-700`, heading "Không tìm thấy trang", body "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển", CTA "Quay về trang chủ"; grep `error.message`/`error.stack` returns NO match in not-found.tsx |
| 12 | Trang 500 (error.tsx + global-error.tsx) tiếng Việt KHÔNG lộ stack (AUTH-08) | ✓ VERIFIED | `app/error.tsx` is 'use client', hero "500" red, "Đã xảy ra lỗi", 2 CTA (Thử lại + Quay về trang chủ); console.error CHỈ trong useEffect dev. `app/global-error.tsx` inline-style fallback, "Đã xảy ra lỗi nghiêm trọng". Grep `error.message`/`error.stack` returns NO match trong cả 2 file (chỉ match là `error.message.startsWith('NEXT_REDIRECT')` trong login.ts — server action, not error page) |
| 13 | Edge middleware redirect protected → /login + /login → /dashboard | ✓ VERIFIED | `middleware.ts` export `auth: middleware` từ NextAuth(authConfig); matcher exclude api/auth\|api\|_next\|favicon\|fonts\|mock-files\|logo-\|test-pdf; `authorized` callback in auth.config.ts redirect logic implemented |
| 14 | Login page split 60/40 brand panel + form panel theo UI-SPEC | ✓ VERIFIED | `app/(auth)/login/page.tsx` split `lg:w-3/5` (brand) + `lg:w-2/5` (form); Quốc huy SVG, Quốc hiệu Times italic, wordmark XTTMQG `text-4xl text-blue-700`, "Bộ Công Thương — Cục Xúc tiến Thương mại" footer; LoginForm + Separator "Hoặc" + SsoPlaceholderButton + version footer "Phiên bản POC · 2026" |
| 15 | LoginForm wire useActionState + useFormStatus + show/hide password + Vietnamese errors | ✓ VERIFIED | `components/auth/LoginForm.tsx` `useActionState(loginAction, initialState)`; `useFormStatus` cho pending Loader2 + 'Đang đăng nhập...'; show/hide qua Eye/EyeOff + aria-label động ('Hiển thị mật khẩu' / 'Ẩn mật khẩu'); Alert destructive cho `state.error`; inline `text-red-600` cho fieldErrors |
| 16 | Dashboard placeholder role-aware "Xin chào, {fullName}" | ✓ VERIFIED | `app/(app)/dashboard/page.tsx` async RSC, `await auth()`, render `Xin chào, {fullName}` + `Bạn đang đăng nhập với vai trò {ROLE_LABELS[role]} · {organizationName}` + Card empty state `Trang chủ đang được xây dựng` |
| 17 | LogoutDialog AlertDialog confirmation Vietnamese | ✓ VERIFIED | `components/layout/LogoutDialog.tsx` AlertDialog title "Xác nhận đăng xuất", body "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", 2 buttons "Hủy" + "Đăng xuất" `bg-red-600`, Loader2 + "Đang đăng xuất..." pending |
| 18 | 18 shadcn components official từ registry (UI-SPEC §Registry Safety) | ✓ VERIFIED | `ls components/ui/*.tsx \| wc -l` = 18: alert-dialog, alert, avatar, badge, breadcrumb, button, card, dropdown-menu, form, input, label, scroll-area, separator, sheet, sidebar (726 lines), skeleton, sonner, tooltip |
| 19 | 7 layout components (AppShell + AppSidebar + AppTopbar + AppBreadcrumb + UserMenu + LogoutDialog + SidebarMenuItem) | ✓ VERIFIED | `ls components/layout/*.tsx \| wc -l` = 7 |
| 20 | (app)/layout.tsx wrap auth() + AppProviders + AppShell | ✓ VERIFIED | `app/(app)/layout.tsx` async RSC, `await auth()`, redirect '/login' if null, render `<AppProviders><AppShell user={session.user}>{children}</AppShell></AppProviders>` |
| 21 | TanStack Query provider sẵn cho phase sau | ✓ VERIFIED | `components/providers/QueryProvider.tsx` 'use client', useState lazy QueryClient với staleTime/gcTime/refetchOnWindowFocus/retry defaults; `AppProviders.tsx` wrap QueryProvider |
| 22 | PDF spike: Be Vietnam Pro static TTF (3 weights) > 30KB committed | ✓ VERIFIED | `public/fonts/BeVietnamPro-Regular.ttf` 132,948 bytes; Bold 140,300 bytes; Italic 137,244 bytes — all > 30KB threshold |
| 23 | PDF render: GET /api/pdf/spike trả PDF buffer Vietnamese (R1 CRITICAL mitigated) | ✓ VERIFIED | `scripts/pdf-smoke-test.mts` exit 0: PDF_SIZE 36823 bytes, PDF_HEADER `%PDF-`, render duration ~194ms; `app/api/pdf/spike/route.ts` Content-Type application/pdf + runtime nodejs |
| 24 | OfficialDocument template render Quyết định mẫu A4 với header công văn 2 cột + watermark | ✓ VERIFIED | `lib/pdf/templates/OfficialDocument.tsx` 240 lines, exports SMOKE_STRING (chứa 'á à ả ã ạ' + 'đ Đ' + '2.500.000.000 đồng') + OfficialDocument component; layout: BỘ CÔNG THƯƠNG + CỤC XÚC TIẾN THƯƠNG MẠI / CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM + Độc lập-Tự do-Hạnh phúc; QUYẾT ĐỊNH centered uppercase; watermark "BẢN MẪU" rgba(220,38,38,0.15) rotate(-30deg); Nghị định 28/2018/NĐ-CP reference; "Nơi nhận" + "Lưu: VT, XTTM" |
| 25 | TERMS dictionary lock + RBAC default-deny matrix + 6 state machines (Plan 01) | ✓ VERIFIED | `lib/constants.ts` exports TERMS (21 keys) + ROLES (7) + HARDCODED_USERS (8); `lib/permissions.ts` exports MATRIX + can() + getMenuItems() + defaultLandingPath(); 6 state machines trong `lib/workflows/` (programCycle/project/orgProfile/scoreSheet/contract/report) |
| 26 | Production build pass (Next.js 15 + middleware Edge bundle) | ✓ VERIFIED | `npm run build` exit 0: 7 routes ('/', '/_not-found', '/api/auth/[...nextauth]', '/api/pdf/spike', '/dashboard', '/login', '/test-pdf'), Middleware bundle 87.2 kB (KHÔNG pull bcrypt/prisma) |
| 27 | TypeScript typecheck pass | ✓ VERIFIED | `npx tsc --noEmit` exit 0 (no errors output) |
| 28 | Generic auth error string "Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại" cho mọi case fail | ✓ VERIFIED | `lib/auth.ts` GENERIC_AUTH_ERROR constant; user-not-found path runs dummy bcrypt.compare(DUMMY_HASH) trước throw — mitigate timing-based user enumeration (T-03-05) |
| 29 | dev.db gitignored (no DB committed) | ✓ VERIFIED | `git ls-files prisma/ \| grep '\.db$'` returns empty; `prisma/.gitignore` excludes `*.db`, `*.db-journal` |
| 30 | Defense-in-depth: middleware redirect + (app)/layout.tsx fallback redirect | ✓ VERIFIED | `middleware.ts` matcher cover protected routes; `app/(app)/layout.tsx` `await auth() → redirect('/login')` if null — 2 layers |
| 31 | scripts/uat-checklist.md ready cho manual UAT 8 accounts | ✓ VERIFIED | `scripts/uat-checklist.md` 10,332 bytes, contains all 8 hardcoded users với expected redirect path + sidebar sections + user menu greeting; covers AUTH-01..08 |
| 32 | Sample PDF artifact saved cho Phase 7-9 reference | ✓ VERIFIED | `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf` 36,823 bytes |

**Score:** 32/32 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `prisma/schema.prisma` | 14 models cho M0+scaffolding | ✓ VERIFIED | 323 lines, 14 `model ` declarations |
| `prisma/dev.db` | SQLite 8 users + 5 orgs (gitignored) | ✓ VERIFIED | 225KB, USER count=8, ORG count=5 (queried qua Prisma Client) |
| `prisma/seed.ts` + `seed/{users,organizations,helpers}.ts` | Idempotent seed bcrypt cost 10 | ✓ VERIFIED | All 4 files exist, bcrypt hash via `helpers.ts BCRYPT_COST=10`, upsert pattern |
| `auth.config.ts` | Edge-safe NextAuthConfig | ✓ VERIFIED | 67 lines, KHÔNG import bcryptjs/prisma, has authorized+jwt+session callbacks |
| `lib/auth.ts` | Full Credentials Provider | ✓ VERIFIED | Imports Credentials + bcrypt + prisma; exports handlers/signIn/signOut/auth |
| `middleware.ts` | Edge middleware với matcher | ✓ VERIFIED | Exports auth as middleware + config matcher (excludes api/auth, api, _next, fonts, mock-files, logo-, test-pdf) |
| `app/api/auth/[...nextauth]/route.ts` | GET/POST handlers | ✓ VERIFIED | Re-export `{ GET, POST }` từ handlers |
| `app/(auth)/_actions/login.ts` | loginAction server action | ✓ VERIFIED | 'use server', Zod validation, AuthError catch, defaultLandingPath redirect |
| `app/(auth)/_actions/logout.ts` | logoutAction server action | ✓ VERIFIED | 'use server', signOut + redirect /login |
| `app/(auth)/login/page.tsx` | Login UI split 60/40 | ✓ VERIFIED | Async RSC, await auth() redirect; brand panel + form panel với LoginForm/SsoPlaceholderButton |
| `app/(auth)/layout.tsx` | Minimal pass-through | ✓ VERIFIED | `<>{children}</>` (no shell, no provider) |
| `components/auth/LoginForm.tsx` | useActionState wrap loginAction | ✓ VERIFIED | useActionState + useFormStatus + show/hide password Eye toggle |
| `components/auth/SsoPlaceholderButton.tsx` | Outline button + Sonner toast | ✓ VERIFIED | toast.info Vietnamese, Building2 icon |
| `components/auth/QuocHuySvg.tsx` | SVG inline component | ✓ VERIFIED | viewBox 0 0 80 80, navy currentColor stroke |
| `app/(app)/layout.tsx` | RSC await auth() + AppShell | ✓ VERIFIED | redirect /login fallback + AppProviders > AppShell |
| `app/(app)/dashboard/page.tsx` | Placeholder greeting role-aware | ✓ VERIFIED | "Xin chào, {fullName}" + "Bạn đang đăng nhập với vai trò {role · org}" + empty state Card |
| `components/layout/AppShell.tsx` | SidebarProvider+SidebarInset wrapper | ✓ VERIFIED | exports AppShell + type AppUser; main#main-content |
| `components/layout/AppSidebar.tsx` | RSC role-aware menu | ✓ VERIFIED | getMenuItems(role) split NGHIEP_VU/QUAN_TRI; XTTMQG wordmark; user fullName + role · org footer |
| `components/layout/AppTopbar.tsx` | Sticky h-14 white + bell + UserMenu | ✓ VERIFIED | sticky top-0 z-30 h-14 border-b slate-200 bg-white; SidebarTrigger md:hidden + AppBreadcrumb + Bell + Separator + UserMenu |
| `components/layout/AppBreadcrumb.tsx` | Client usePathname + buildBreadcrumb | ✓ VERIFIED | usePathname() + buildBreadcrumb(pathname); ChevronRight separator h-3.5 |
| `components/layout/UserMenu.tsx` | Avatar initials + dropdown greeting | ✓ VERIFIED | Avatar bg-blue-700 text-white, getInitials, "Xin chào, {fullName}" + role · org |
| `components/layout/LogoutDialog.tsx` | AlertDialog confirm logout | ✓ VERIFIED | "Xác nhận đăng xuất" + "Bạn có chắc chắn..."; "Hủy" + "Đăng xuất" bg-red-600; logoutAction wired |
| `components/layout/SidebarMenuItem.tsx` | Client active-state highlight | ✓ VERIFIED | usePathname() check active; bg-blue-50 text-blue-700 border-l-2 border-l-blue-700 |
| `components/providers/QueryProvider.tsx` | TanStack Query client | ✓ VERIFIED | 'use client', useState lazy, staleTime 30s |
| `components/providers/AppProviders.tsx` | Composition root | ✓ VERIFIED | wraps QueryProvider |
| `app/not-found.tsx` | 404 hero navy no-stack | ✓ VERIFIED | "404" text-blue-700 + "Không tìm thấy trang"; NO error.message/stack |
| `app/error.tsx` | 500 red 2-CTA no-stack | ✓ VERIFIED | "500" text-red-600 + "Đã xảy ra lỗi" + reset+home; NO error.message/stack |
| `app/global-error.tsx` | Inline-style root fallback | ✓ VERIFIED | `<html lang="vi">` + `<body>` inline style; "Đã xảy ra lỗi nghiêm trọng"; NO error.message/stack |
| `public/fonts/BeVietnamPro-{Regular,Bold,Italic}.ttf` | Static TTF >30KB | ✓ VERIFIED | 132,948 / 140,300 / 137,244 bytes; magic 0x00010000 (TrueType static) |
| `lib/pdf/fonts.ts` | registerPdfFonts idempotent | ✓ VERIFIED | module-level `registered` boolean guard; Font.register 3 weights + registerHyphenationCallback identity |
| `lib/pdf/templates/OfficialDocument.tsx` | Quyết định mẫu A4 template | ✓ VERIFIED | exports SMOKE_STRING + OfficialDocument; header 2 cột BỘ CT + Quốc hiệu; watermark BẢN MẪU; signature block; Nghị định 28/2018/NĐ-CP |
| `lib/pdf/render.ts` | renderOfficialDocumentPdf wrapper | ✓ VERIFIED | calls registerPdfFonts() then renderToBuffer(createElement(OfficialDocument, props)) |
| `app/api/pdf/spike/route.ts` | GET handler PDF buffer | ✓ VERIFIED | runtime nodejs, dynamic force-dynamic, Content-Type application/pdf, Content-Disposition inline |
| `app/test-pdf/page.tsx` | Public spike test page | ✓ VERIFIED | Card với button mở `/api/pdf/spike` |
| `scripts/smoke-auth.mts` | Auth regression utility | ✓ VERIFIED | exit 0, 8/8 ✓ PASS |
| `scripts/menu-smoke.mts` | Menu role-awareness utility | ✓ VERIFIED | exit 0, 7 roles render 7 menu sets khác nhau |
| `scripts/pdf-smoke-test.mts` | PDF render smoke utility | ✓ VERIFIED | exit 0, 36823 bytes + %PDF- header |
| `scripts/uat-checklist.md` | Manual UAT documentation | ✓ VERIFIED | 10,332 bytes, 8 accounts coverage AUTH-01..08 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `app/(app)/layout.tsx` | `lib/auth.ts auth()` | session check + redirect | ✓ WIRED | `await auth()` + `redirect('/login')` if null |
| `components/layout/AppSidebar.tsx` | `lib/permissions.ts getMenuItems()` | role-aware menu | ✓ WIRED | `getMenuItems(user.role)` + filter section NGHIEP_VU/QUAN_TRI |
| `components/layout/AppBreadcrumb.tsx` | `lib/breadcrumbs.ts buildBreadcrumb()` | pathname → items | ✓ WIRED | `buildBreadcrumb(usePathname())` |
| `components/layout/UserMenu.tsx` | `LogoutDialog` (logoutAction wire) | dropdown → AlertDialog → server action | ✓ WIRED | LogoutDialog imports `logoutAction` từ `@/app/(auth)/_actions/logout` |
| `components/auth/LoginForm.tsx` | `loginAction` (Plan 03) | useActionState | ✓ WIRED | `useActionState(loginAction, initialState)` + form action={formAction} |
| `app/(auth)/login/page.tsx` | `lib/auth.ts auth()` + `defaultLandingPath` | already-auth redirect | ✓ WIRED | `await auth()` + `redirect(defaultLandingPath(role))` |
| `app/(app)/dashboard/page.tsx` | `lib/auth.ts auth()` + `ROLE_LABELS` | RSC reads session for greeting | ✓ WIRED | `session.user.fullName` + `ROLE_LABELS[role]` |
| `lib/auth.ts` | `lib/prisma.ts` + `bcryptjs` | User query + password compare | ✓ WIRED | `prisma.user.findUnique` + `bcrypt.compare` |
| `middleware.ts` | `auth.config.ts` (edge-safe) | NextAuth Edge wrap | ✓ WIRED | imports `authConfig` (NO bcrypt/prisma); exports auth as middleware |
| `auth.config.ts callbacks` | `types/next-auth.d.ts` augment | session shape inject role+orgId+orgName | ✓ WIRED | jwt+session callbacks set token.role/.organizationId/.organizationName |
| `prisma/seed/users.ts` | `lib/constants.ts HARDCODED_USERS` | seed input | ✓ WIRED | imports HARDCODED_USERS, upsert by username |
| `prisma/seed/users.ts` | bcryptjs cost 10 | password hashing | ✓ WIRED | `helpers.ts BCRYPT_COST = 10` + bcrypt.hash |
| `lib/pdf/render.ts` | `lib/pdf/fonts.ts registerPdfFonts` | font registration trước renderToBuffer | ✓ WIRED | `registerPdfFonts()` called first |
| `lib/pdf/templates/OfficialDocument.tsx` | Be Vietnam Pro family | Font.register family name | ✓ WIRED | `fontFamily: 'Be Vietnam Pro'` trong styles.page |
| `app/api/pdf/spike/route.ts` | `lib/pdf/render.ts` | render PDF buffer | ✓ WIRED | `renderOfficialDocumentPdf(...)` call + NextResponse |
| `LogoutDialog.tsx` | `app/(auth)/_actions/logout.ts logoutAction` | form action confirm logout | ✓ WIRED | imports logoutAction; await trong handleConfirm |
| `app/(auth)/_actions/login.ts` | `lib/permissions.ts defaultLandingPath` | role-based redirect | ✓ WIRED | `defaultLandingPath(user.role as Role)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Dashboard page greeting | `session.user.fullName / role / organizationName` | `await auth()` (NextAuth JWT decode) → session callback hydrate từ token | Yes — JWT contains real values từ authorize() return | ✓ FLOWING |
| AppSidebar menu items | `items` array | `getMenuItems(user.role)` reads `lib/permissions.ts MATRIX` (constant data) | Yes — RBAC matrix lookup returns real menu list (verified menu-smoke 7 roles → 7 sets khác nhau) | ✓ FLOWING |
| AppSidebar footer (fullName + role · org) | `user.fullName / organizationName` | passed via prop từ (app)/layout.tsx → AppShell → AppSidebar | Yes — chuyển từ session.user (which came from DB qua Credentials authorize) | ✓ FLOWING |
| UserMenu greeting | `user.fullName / role / organizationName` | Same prop chain | Yes — verified org names trong DB (Cục XTTM / Bộ CT / VITAS / LEFASO / VINATEX) | ✓ FLOWING |
| AppBreadcrumb items | `items` from `buildBreadcrumb(pathname)` | `lib/breadcrumbs.ts BREADCRUMB_LABELS` map | Yes — labels lookup return real Vietnamese strings | ✓ FLOWING |
| LoginForm error/fieldErrors | `state.error / state.fieldErrors` | `useActionState(loginAction)` returns LoginState từ server action | Yes — loginAction validates + queries DB + returns proper error structure | ✓ FLOWING |
| PDF /api/pdf/spike body | PDF buffer | `renderOfficialDocumentPdf()` → renderToBuffer → React.createElement(OfficialDocument, props) | Yes — smoke 36823 bytes %PDF- + font BeVietnamPro embedded | ✓ FLOWING |
| Dashboard role line | `ROLE_LABELS[role]` | constant lookup từ lib/constants.ts | Yes — covers all 7 roles | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| TypeScript typecheck | `npx tsc --noEmit` | exit 0, no errors | ✓ PASS |
| Production build | `npm run build` | exit 0, 7 routes generated, Middleware 87.2 kB | ✓ PASS |
| 8 hardcoded accounts authenticate | `npx tsx scripts/smoke-auth.mts` | exit 0, 8/8 ✓ PASS với role + org match | ✓ PASS |
| Menu role-awareness 7 roles | `npx tsx scripts/menu-smoke.mts` | 7 distinct menu sets (ADMIN=18, BANQL=14, CHUYENVIEN=4, HOIDONG=5, DONVI=10, TAICHINH=4, LANHDAO=13) | ✓ PASS |
| PDF render Vietnamese | `npx tsx scripts/pdf-smoke-test.mts` | exit 0, 36,823 bytes, %PDF- magic, render 194ms | ✓ PASS |
| Prisma DB user/org count | Prisma `user.count() / organization.count()` | 8 users, 5 orgs | ✓ PASS |
| dev.db not tracked | `git ls-files prisma/ \| grep '\.db$'` | empty (no .db files tracked) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| AUTH-01 | Plan 03, 05 | Đăng nhập username + password, redirect role-based | ✓ SATISFIED | smoke-auth 8/8 PASS, loginAction → defaultLandingPath, LoginForm useActionState wired |
| AUTH-02 | Plan 02, 03 | 8 tài khoản hardcoded với bcrypt cho 7 vai trò | ✓ SATISFIED | DB query: 8 users seeded, bcrypt cost 10 (helpers.ts BCRYPT_COST), smoke 8/8 ✓ |
| AUTH-03 | Plan 03 | Đăng xuất hủy session quay về /login | ✓ SATISFIED | logoutAction signOut + redirect /login; LogoutDialog wire qua UserMenu DropdownMenuItem |
| AUTH-04 | Plan 03 | Session JWT giữ trạng thái qua refresh | ✓ SATISFIED | auth.config session.strategy='jwt' maxAge 7d; jwt+session callbacks |
| AUTH-05 | Plan 05 | Trang đăng nhập có button SSO placeholder + toast | ✓ SATISFIED | SsoPlaceholderButton onClick toast.info "Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án" |
| AUTH-06 | Plan 04, 05 | Layout shell sidebar role-aware + topbar + breadcrumb tiếng Việt | ✓ SATISFIED | AppSidebar getMenuItems(role); AppTopbar sticky h-14 với bell + UserMenu; AppBreadcrumb buildBreadcrumb |
| AUTH-07 | Plan 01, 04 | Light mode + locale vi-VN | ✓ SATISFIED | `<html lang="vi" className="light">`; format.ts dùng date-fns/vi + Intl 'vi-VN' |
| AUTH-08 | Plan 05 | 404/500 tiếng Việt không lộ stack trace | ✓ SATISFIED | not-found.tsx + error.tsx + global-error.tsx tất cả no error.message/stack trong JSX (verified bằng grep) |

**Plan-claimed requirements vs ROADMAP mapping:** Cả 8 AUTH IDs đều được khai báo trong frontmatter của ít nhất 1 plan và được verify đến tận implementation. Không có orphaned requirement.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `prisma/seed.ts` | 8, 9, 18, 23, 24 | `console.log` (no-console rule) | ℹ️ Info | Build warning only — no-console rule cho seed/dev scripts là acceptable POC; Plan 11 polish có thể address |
| `prisma/seed/helpers.ts` | 10 | `console.log` | ℹ️ Info | Same as above |
| `app/error.tsx` | 17 | `console.error('[error.tsx]', error)` | ℹ️ Info | Wrapped trong `if (NODE_ENV === 'development')` → only fires trong dev; not exposed to user |
| `app/global-error.tsx` | 14 | Same pattern | ℹ️ Info | Same — dev-only logging |
| `app/(auth)/_actions/login.ts` | 59 | `error.message.startsWith('NEXT_REDIRECT')` | ℹ️ Info | Not a stack-trace leak — checking framework signal to re-throw redirect; correct pattern |
| `app/api/pdf/spike/route.ts` | 45 | `(err as Error).message` in JSON response 500 | ℹ️ Info | M0 spike public route serving placeholder content (T-06-01 accept); Phase 5+ will wrap with auth() — current scope OK |
| `lib/auth.ts` | 74 | `console.error('[auth.authorize]')` | ℹ️ Info | Server-side logging unknown errors trước throw GENERIC; T-03-10 mitigation correct |

**Blocker count:** 0
**Warning count:** 0
**Info count:** 7 (all expected/acceptable per threat model and plan scope)

### Human Verification Required

Phase 1 đạt status `human_needed` không phải vì có gap, mà vì **3 categories** của verification chỉ có thể human-verify:

#### 1. Visual PDF Rendering (R1 CRITICAL final mitigation)

**Test:** Mở PDF mẫu trong Chrome / Edge / Adobe Reader để xác nhận dấu tiếng Việt render đúng.
**Expected:** Tất cả ký tự có dấu (á à ả ã ạ — ắ ằ ẳ ẵ ặ — ấ ầ ẩ ẫ ậ — đ Đ — ê ô ơ ư) hiển thị đúng, KHÔNG bị □ hay ?; watermark "BẢN MẪU" đỏ chéo; layout 2 cột header (BỘ CT trái + Quốc hiệu phải); signature block "KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG".
**Why human:** Visual font rendering trong PDF viewer chỉ verify được bằng mắt. Programmatic test (smoke) đã PASS (size 36KB + magic %PDF- + font BeVietnamPro embedded). Sample PDF tại `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf`.

#### 2. End-to-End Login Flow 8 Accounts

**Test:** Run `npm run start` → browse `http://localhost:3000/login` → login từng account theo `scripts/uat-checklist.md`.
**Expected:** Mỗi tài khoản đăng nhập thành công → redirect đúng path role-based → sidebar render đúng menu set của role → topbar hiện đúng greeting + role · org → click logout → AlertDialog xuất hiện → confirm → toast 'Đã đăng xuất' → quay về /login. Toàn bộ chữ Việt render đầy đủ dấu (đặc biệt "Hiệp hội Da giày - Túi xách Việt Nam" cho donvi1).
**Why human:** End-to-end browser flow (cookie set, redirect, sidebar render, dropdown click, AlertDialog interaction, toast hiển thị, Vietnamese text rendering) yêu cầu human tương tác qua trình duyệt thật.

#### 3. 404/500 Page Visual + DOM Inspection

**Test 1 (404):** GET `/this-route-does-not-exist` trong browser → kiểm tra trang 404 render đúng.
**Expected:** Hero "404" navy `text-blue-700` + heading "Không tìm thấy trang" + body Vietnamese + CTA "Quay về trang chủ"; KHÔNG render `error.message` hay `error.stack`.

**Test 2 (500):** Inject error trong page server component tạm (vd `throw new Error('test')` trong dashboard) → kiểm tra error.tsx + open DevTools.
**Expected:** Hero "500" red + "Đã xảy ra lỗi" + 2 CTA (Thử lại + Quay về trang chủ); KHÔNG hiển thị error.message hay error.stack trong DOM.

**Why human:** Visual rendering + DevTools DOM inspection cần mắt người và tương tác browser.

### Gaps Summary

**No gaps found.** Mọi must-have từ 6 plan frontmatter, 8 AUTH requirements, ROADMAP success criteria đều VERIFIED qua tổng cộng:
- 7 behavioral spot-checks (all PASS)
- 32 truths verified với evidence cụ thể
- 17 key links wired
- 8 data flows verified
- 0 blocker anti-patterns

Phase 1 đã thực sự đạt goal "Người dùng đăng nhập được vào layout shell tiếng Việt với 8 tài khoản hardcoded; foundation kỹ thuật đủ vững cho phase sau xây trên đó" ở mức programmatic. Phần còn lại là 3 nhóm visual UAT cần human (PDF Vietnamese rendering, 8-account login flow end-to-end, 404/500 visual + DOM inspection) — những việc này theo design **không thể tự động hoá** và đã được document đầy đủ trong `scripts/uat-checklist.md`.

Status `human_needed` (NOT `gaps_found`) — automated layer hoàn tất, chỉ chờ user run UAT signing-off để chính thức đóng phase.

---

_Verified: 2026-04-30_
_Verifier: Claude (gsd-verifier)_
_Phase: 01-m0-bootstrap-h-t-ng_
_Score: 32/32 must-haves verified programmatically + 4 human UAT items pending_
