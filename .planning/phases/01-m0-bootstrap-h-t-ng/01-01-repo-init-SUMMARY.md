---
phase: 01-m0-bootstrap-h-t-ng
plan: 01
subsystem: infra
tags: [next15, react19, tailwind4, shadcn, typescript, prisma, nextauth, foundation, vietnamese-locale]

requires: []
provides:
  - "Next.js 15.5 + React 19 + TypeScript strict toolchain"
  - "Tailwind v4 + shadcn/ui CLI v4 với new-york + slate + CSS variables"
  - "Lib foundation đầy đủ: TERMS dictionary (21 keys), RBAC matrix (18 resources × 8 actions), 5 Vietnamese formatters, relative date helpers, diacritics removal, breadcrumb labels, dynamic menu builder, 6 state machines"
  - "8 hardcoded users mapping ready cho Plan 02 seed (admin, banql, chuyenvien, hoidong, donvi1/2, taichinh, lanhdao)"
  - "next-auth Session module augmentation skeleton ready cho Plan 03"
  - "Folder skeleton chuẩn (app/, components/{ui,layout,shared}/, features/, lib/{workflows,pdf}/, prisma/, public/{mock-files,fonts}/, storage/uploads/, types/)"
  - "ESLint + Prettier config + .env.example/.env.local + .gitignore đầy đủ"
affects: [01-02-prisma-schema, 01-03-nextauth, 01-04-layout-shell, 01-05-login-pages, 01-06-pdf-spike, all-future-phases]

tech-stack:
  added:
    - "next@15.5.15"
    - "react@19.2.5"
    - "next-auth@5.0.0-beta.31"
    - "prisma@6.19.3 + @prisma/client@6.19.3"
    - "@react-pdf/renderer@4.5.1"
    - "tailwindcss@4.2.4 + @tailwindcss/postcss@4.2.4"
    - "shadcn/ui CLI v4 (new-york + slate + cssVariables)"
    - "radix-ui@1.4.3 (unified package)"
    - "lucide-react@0.460.0"
    - "react-hook-form@7.74.0 + @hookform/resolvers@4.1.3"
    - "zod@4.4.1"
    - "@tanstack/react-query@5.100.6 + @tanstack/react-table@8.21.3"
    - "zustand@5.0.12"
    - "date-fns@4.1.0 (locale vi)"
    - "recharts@3.8.1"
    - "motion@12.38.0 (framer-motion rebrand)"
    - "sonner@1.7.4"
    - "bcryptjs@2.4.3 (Windows-compatible)"
    - "xlsx@0.18.5 (deviation: 0.20.x not on npm registry)"
    - "class-variance-authority@0.7.1 (deviation: required by shadcn button)"
    - "clsx@2.1.1 + tailwind-merge@2.6.1"
    - "tsx@4.21.0 + prettier@3.8.3 + eslint-config-prettier@9.1.0"
    - "Be Vietnam Pro font qua next/font/google (subset vietnamese + latin)"
  patterns:
    - "TERMS dictionary lock từ M0 (PITFALLS R2) — mọi label nghiệp vụ tham chiếu TERMS, không hardcode"
    - "RBAC default-deny matrix object (lib/permissions.ts) — mọi resource×action mặc định false trừ khi liệt kê"
    - "PrismaClient singleton (lib/prisma.ts) — tránh hot-reload connection leak"
    - "State machine pure TS (transition table + canTransitionXxx + STATUS_LABELS) — không XState (per STACK §9)"
    - "Vietnamese formatters: formatVND ghép suffix ' đồng', formatVNDCompact dùng 'tỷ'/'triệu', dấu phân cách thập phân ',' (vi-VN locale)"
    - "Relative date helpers daysAgo/daysFromNow cho mock SLA scenarios (PITFALLS R5)"
    - "Diacritics removal (removeDiacritics) qua NFD normalize + đ→d cho Vietnamese search"
    - "Module augmentation cho next-auth Session — lib/constants.ts Role type được Session.user.role kế thừa"
    - "Folder structure (auth) vs (app) route group đã chuẩn bị (Plan 04 sẽ tạo)"

key-files:
  created:
    - "package.json — 38 deps lock"
    - "tsconfig.json — strict mode + noUncheckedIndexedAccess + path alias @/*"
    - "next.config.ts — serverActions bodySizeLimit 20mb"
    - "components.json — shadcn new-york + slate + cssVariables"
    - "app/layout.tsx — html lang=vi + Be Vietnam Pro + Sonner Toaster"
    - "app/globals.css — Tailwind v4 + shadcn slate tokens (HSL)"
    - "app/page.tsx — redirect to /login"
    - "lib/utils.ts — cn() helper"
    - "lib/prisma.ts — PrismaClient singleton"
    - "lib/constants.ts — TERMS (21) + ROLES (7) + ROLE_LABELS + HARDCODED_USERS (8) + ORG_CODES (7) + ORG_NAMES + SLA_THRESHOLDS + STATUS_LABELS"
    - "lib/permissions.ts — MATRIX (18 res × 8 act) + can() + getMenuItems() + defaultLandingPath()"
    - "lib/format.ts — formatDate, formatDateTime, formatDateLong, formatVND, formatVNDCompact, formatNumber"
    - "lib/date.ts — daysAgo, daysFromNow, formatRelative"
    - "lib/vi-search.ts — removeDiacritics"
    - "lib/breadcrumbs.ts — BREADCRUMB_LABELS + buildBreadcrumb"
    - "lib/menu.ts — re-export menu helpers"
    - "lib/workflows/programCycle.ts — 7-state với gia hạn flow"
    - "lib/workflows/project.ts — 16-state đề án lifecycle"
    - "lib/workflows/orgProfile.ts — 4-state hồ sơ đơn vị"
    - "lib/workflows/scoreSheet.ts — 2-state phiếu chấm"
    - "lib/workflows/contract.ts — 6-state hợp đồng"
    - "lib/workflows/report.ts — 4-state báo cáo"
    - "types/next-auth.d.ts — Session.user augmentation"
    - "components/ui/button.tsx — shadcn button (smoke test artifact)"
    - ".env.example, .env.local (gitignored), .gitignore, .eslintrc.json, .prettierrc.json, .prettierignore, postcss.config.mjs, storage/.gitignore"
  modified: []

key-decisions:
  - "Bootstrap manual (không qua create-next-app) vì dir name 'XTTM' uppercase vi phạm npm package naming"
  - "xlsx@0.18.5 thay 0.20.x (SheetJS đã chuyển sang CDN riêng cho versions mới — npm registry không có 0.20)"
  - "Cài thêm class-variance-authority cho shadcn button (CVA dependency required by shadcn templates)"
  - "components.json tạo manual thay vì qua npx shadcn init (CLI v4 không hỗ trợ flag --base-color/--style trực tiếp)"
  - "AUTH_SECRET sinh bằng node crypto.randomBytes(32).toString('base64'), lưu .env.local (gitignored), không commit"
  - "Be Vietnam Pro font dùng next/font/google cho UI (subset vietnamese+latin), Plan 06 PDF sẽ dùng static TTF riêng"
  - "Light mode hardcoded qua className='light' trên html — không expose dark toggle (per UI-SPEC + Out of Scope)"
  - "TERMS dictionary lock 21 thuật ngữ XTTM tại M0 (PITFALLS R2 critical) — đảm bảo 'đề án' ≠ 'dự án', 'thẩm định' ≠ 'kiểm tra' xuyên suốt mọi phase"
  - "RBAC matrix scaffolding default-deny (PITFALLS-related) — role không liệt kê = deny, an toàn hơn default-allow"
  - "Plain TS state machine (transition table + canTransitionXxx) — KHÔNG XState (overkill cho 7-state cycle, 16-state project)"

patterns-established:
  - "TERMS dictionary import: components/pages MUST `import { TERMS } from '@/lib/constants'` thay vì hardcode label nghiệp vụ"
  - "RBAC check: server actions/route handlers MUST `import { can } from '@/lib/permissions'` + check trước mọi mutation"
  - "Vietnamese format: dates dùng formatDate/formatDateTime, currency dùng formatVND/formatVNDCompact — KHÔNG dùng toLocaleString trực tiếp"
  - "Mock data dates: dùng daysAgo(n)/daysFromNow(n) để mock SLA scenarios (60/15/30 ngày) — KHÔNG hardcode date string"
  - "Search: cột searchKey trong Prisma model = removeDiacritics(name + code + ...), query input cũng strip diacritics trước"
  - "State transition: dùng canTransitionXxx() guard trong server action — luôn check trước khi update status"
  - "Menu render: layout component MUST `getMenuItems(session.user.role)` để render menu động theo quyền"

requirements-completed:
  - AUTH-07

duration: 11m
completed: 2026-04-30
---

# Phase 01 Plan 01: Repo Init Summary

**Greenfield Next.js 15 + Tailwind v4 + shadcn/ui foundation với 15 lib helper files (TERMS, RBAC, formatters, 6 state machines) và toolchain typecheck/lint/build pass.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-30T16:30:39Z
- **Completed:** 2026-04-30T16:41:41Z
- **Tasks:** 3
- **Files created:** 38 (8 root config + 3 app/ + 15 lib/ + 1 types/ + 1 components/ui/ + 6 .gitkeep + 4 docs)

## Accomplishments

- Bootstrap Next.js 15.5 + React 19 + TypeScript strict mode + Tailwind v4 + 38 dependencies (25 runtime + 13 dev)
- shadcn/ui CLI v4 initialized với preset chính xác như UI-SPEC: new-york style + slate base + CSS variables + lucide icons
- 15 file lib/ foundation viết đầy đủ: TERMS dictionary 21 keys (PITFALLS R2 lock), RBAC default-deny matrix (18 resources × 8 actions), Vietnamese formatters (5 date + 3 number), state machines cho 6 entity (programCycle 7-state với gia hạn flow, project 16-state, orgProfile/scoreSheet/contract/report)
- Be Vietnam Pro font integrated qua next/font (subset vietnamese + latin), locale vi-VN globally
- Phase verification PASS: typecheck (tsc --noEmit), lint (next lint), build (next build) tất cả exit 0
- 8 hardcoded users mapping (admin/banql/chuyenvien/hoidong/donvi1/donvi2/taichinh/lanhdao) ready cho Plan 02 seed
- next-auth Session module augmentation ready cho Plan 03 wire callbacks

## Task Commits

1. **Task 1: Khởi tạo Next.js 15 + dependencies** — `1c0f29d` (feat)
2. **Task 2: shadcn/ui CLI v4 init với new-york + slate + CSS variables** — `aaca0c6` (feat)
3. **Task 3: Foundation libs — TERMS, RBAC, formatters, state machines** — `9e4178f` (feat)

## Files Created

### Root config (Task 1)

- `package.json` — 38 deps lock (next 15.4, react 19, next-auth beta, prisma 6.6, react-pdf 4, sonner, motion, date-fns 4, zod 4, RHF, TanStack Query/Table, zustand 5, recharts 3, lucide, bcryptjs, xlsx, tsx, prettier)
- `tsconfig.json` — strict + noUncheckedIndexedAccess + path alias `@/*`
- `next.config.ts` — `experimental.serverActions.bodySizeLimit: '20mb'` (mitigation T-01-06)
- `postcss.config.mjs` — `@tailwindcss/postcss` plugin
- `.gitignore` — exclude `prisma/dev.db`, `.env.local`, `storage/uploads/*`
- `.env.example` — committed key names + placeholder
- `.env.local` — gitignored với AUTH_SECRET sinh ngẫu nhiên (32 bytes base64)
- `.eslintrc.json` — next/core-web-vitals + next/typescript + prettier
- `.prettierrc.json` — single quotes, trailing comma all, printWidth 100
- `.prettierignore` — ignore node_modules, .next, lockfile, fonts
- `next-env.d.ts` — auto-generated Next types
- `storage/.gitignore` — ignore all uploads except .gitkeep

### App skeleton (Task 1)

- `app/layout.tsx` — `<html lang="vi" className="light">` + Be Vietnam Pro variable + Sonner Toaster top-right
- `app/globals.css` — `@import "tailwindcss"` + shadcn slate CSS variables (HSL tokens) + Be Vietnam Pro fallback chain
- `app/page.tsx` — redirect to `/login` (placeholder, role-based redirect ở Plan 05)

### shadcn (Task 2)

- `components.json` — new-york + slate + cssVariables=true + iconLibrary=lucide
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components/ui/button.tsx` — shadcn button v4 (smoke test artifact)

### Foundation libs (Task 3)

- `lib/prisma.ts` — PrismaClient singleton chống connection leak hot-reload
- `lib/constants.ts` — TERMS (21) + ROLES (7) + ROLE_LABELS + HARDCODED_USERS (8) + ORG_CODES (7) + ORG_NAMES + SLA_THRESHOLDS + STATUS_LABELS
- `lib/permissions.ts` — MATRIX (18 resources × 8 actions) + can() + getMenuItems() + defaultLandingPath()
- `lib/format.ts` — formatDate (dd/MM/yyyy), formatDateTime, formatDateLong, formatVND ('… đồng'), formatVNDCompact ('… tỷ' / '… triệu'), formatNumber
- `lib/date.ts` — daysAgo, daysFromNow, formatRelative (vi)
- `lib/vi-search.ts` — removeDiacritics (NFD + đ→d)
- `lib/breadcrumbs.ts` — BREADCRUMB_LABELS map + buildBreadcrumb(pathname)
- `lib/menu.ts` — re-export menu helpers
- `lib/workflows/programCycle.ts` — 7-state với REOPEN flow (CLOSED→OPEN gia hạn)
- `lib/workflows/project.ts` — 16-state đề án full lifecycle
- `lib/workflows/orgProfile.ts` — 4-state
- `lib/workflows/scoreSheet.ts` — 2-state
- `lib/workflows/contract.ts` — 6-state với OVERDUE branch
- `lib/workflows/report.ts` — 4-state với RETURNED loop
- `types/next-auth.d.ts` — augment Session.user + User + JWT với role + organizationId

### Folder skeleton (.gitkeep placeholders)

- `components/ui/`, `components/layout/`, `components/shared/`, `features/`, `public/mock-files/`, `storage/uploads/`

## Decisions Made

- **Bootstrap manual thay vì create-next-app** — dir name `XTTM` uppercase vi phạm npm naming, create-next-app refuse. Tự viết package.json + config files theo Next 15 template chuẩn, kết quả tương đương.
- **xlsx@0.18.5 thay 0.20.x** — SheetJS đã chuyển versions mới (≥0.20) sang CDN riêng (cdn.sheetjs.com), npm registry chỉ có đến 0.18.5. POC scope chấp nhận 0.18.5 (compatible với CLAUDE.md scope).
- **components.json tạo manual** — shadcn CLI v4 không hỗ trợ flag `--base-color`/`--style` cho non-interactive init; manual JSON đảm bảo cấu hình chính xác như UI-SPEC.
- **class-variance-authority dependency thêm** — shadcn button v4 import CVA, không có sẵn trong project; cài qua `npm i class-variance-authority`.
- **AUTH_SECRET strategy** — sinh bằng `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (Windows-compatible, không cần openssl), lưu `.env.local` gitignored, không bao giờ commit. `.env.example` chỉ có key names.
- **TERMS dictionary 21 keys lock** — đầy đủ thuật ngữ XTTM (đề án, chu kỳ chương trình, đơn vị chủ trì, kiểm tra hồ sơ, thẩm định, phê duyệt, nghiệm thu, thanh lý hợp đồng, quyết toán, tạm ứng, thương vụ, hồ sơ, tờ trình, quyết định, hội đồng thẩm định, chuyên viên, ban quản lý, điều chỉnh, triển khai, báo cáo, công văn) — phase sau import từ TERMS, không hardcode label.
- **RBAC default-deny** — `MATRIX[resource]?.[action]?.includes(role) ?? false` — security-first, role không liệt kê = deny.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] xlsx@^0.20.0 không tồn tại trên npm registry**

- **Found during:** Task 1 (npm install)
- **Issue:** SheetJS đã chuyển mọi version ≥0.20 sang CDN riêng (cdn.sheetjs.com); npm registry chỉ có đến `xlsx@0.18.5`. `npm install` fail với ETARGET error.
- **Fix:** Đổi version range trong package.json từ `^0.20.0` → `^0.18.5`. POC scope không cần features mới của 0.20+ (chủ yếu là export báo cáo Excel cơ bản ở M6).
- **Files modified:** `package.json`
- **Verification:** `npm install` thành công, no ETARGET, lockfile generated.
- **Committed in:** `1c0f29d` (Task 1 commit)

**2. [Rule 3 - Blocking] create-next-app từ chối tạo project trong dir uppercase**

- **Found during:** Task 1 (npx create-next-app)
- **Issue:** Dir name `D:/Thaodnp/XTTM` chứa chữ in hoa, npm naming rules không cho phép → create-next-app abort: "name can no longer contain capital letters". Cannot rename dir (chứa file docx/xlsx user upload).
- **Fix:** Bootstrap manual — tự viết package.json (name: `xttm-qg` lowercase), tsconfig.json, next.config.ts, postcss.config.mjs, app/layout.tsx, app/globals.css, app/page.tsx theo Next 15 template chuẩn (đối chiếu shadcn docs + Next docs).
- **Files modified:** Toàn bộ root config files Task 1.
- **Verification:** `npx tsc --noEmit` pass, `npm run build` pass.
- **Committed in:** `1c0f29d` (Task 1 commit)

**3. [Rule 3 - Blocking] shadcn CLI v4 không support flag --base-color/--style**

- **Found during:** Task 2 (shadcn init)
- **Issue:** `npx shadcn@latest init --base-color slate --style new-york` → `error: unknown option '--base-color'`. CLI v4 (release 03/2026) đã đổi flag set, không hỗ trợ non-interactive với preset cụ thể.
- **Fix:** Tạo `components.json` manual với cấu hình chính xác như UI-SPEC (style new-york, baseColor slate, cssVariables true, iconLibrary lucide); CSS variables HSL tokens append vào `app/globals.css` theo shadcn slate preset official docs. Sau đó `npx shadcn add button` để verify CLI hoạt động → button.tsx tạo thành công.
- **Files modified:** `components.json`, `app/globals.css`, `lib/utils.ts`, `components/ui/button.tsx`
- **Verification:** `components.json` chứa exact preset values, `npm run build` pass với button component.
- **Committed in:** `aaca0c6` (Task 2 commit)

**4. [Rule 2 - Missing Critical] Cài thêm class-variance-authority dependency**

- **Found during:** Task 2 (after shadcn add button)
- **Issue:** shadcn button v4 template import `cva` từ `class-variance-authority`. STACK.md §13 không list CVA trực tiếp (gộp vào shadcn deps). `npx tsc --noEmit` fail với `Cannot find module 'class-variance-authority'`.
- **Fix:** `npm install --legacy-peer-deps class-variance-authority` → đã cài 0.7.1.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npx tsc --noEmit` pass.
- **Committed in:** `aaca0c6` (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking — Rule 3, 1 missing critical — Rule 2)

**Impact on plan:** Tất cả deviations cần thiết để bootstrap chạy được trên Windows + dir uppercase + shadcn CLI v4 latest. Không có scope creep — kết quả cuối cùng tương đương 100% với plan goal (Next 15 + Tailwind v4 + shadcn new-york + slate + Vietnamese-ready foundation).

## Issues Encountered

- **Prettier format warnings on .planning/STATE.md, CLAUDE.md** — không trong scope plan (file user-managed). Để nguyên, không format. Files lib/ Plan 01 đã `npx prettier --write` xong.
- **Git LF→CRLF warnings** — Windows default line ending; không ảnh hưởng functionality, git tự normalize khi checkout. Không action.

## User Setup Required

None — không cần external services. AUTH_SECRET sinh tự động trong Task 1.

Phase 1 sẽ cần user xác nhận khi:
- Plan 06 PDF spike — user verify font tiếng Việt render đúng trên Adobe Reader / Foxit / Chrome built-in viewer.

## Next Phase Readiness

**Plan 02 (Prisma schema + seed) ready:**
- `lib/prisma.ts` PrismaClient singleton có sẵn để import.
- `HARDCODED_USERS` constant (8 users) ready cho seed script — Plan 02 chỉ việc bcrypt hash password và `prisma.user.upsert`.
- `lib/constants.ts` đã có ROLES, ORG_CODES, ORG_NAMES, STATUS_LABELS — schema enum reference đúng.
- `lib/workflows/×6` đã định nghĩa state types — Prisma enum đồng bộ.
- `prisma/dev.db` đã trong `.gitignore`.
- `npm run db:push`, `db:seed`, `db:studio`, `db:reset` scripts đã có trong package.json.
- `prisma` block `{ "seed": "tsx prisma/seed.ts" }` đã set.

**Plan 03 (NextAuth credentials) ready:**
- `types/next-auth.d.ts` augment Session.user với `id, username, fullName, role, organizationId, organizationName` đã chuẩn bị.
- `bcryptjs` (Windows-compatible) đã cài.
- `AUTH_SECRET`, `AUTH_TRUST_HOST`, `DATABASE_URL` đã có trong `.env.local`.
- `next-auth@beta` 5.0.0-beta.31 cài rồi.

**Plan 04 (Layout shell) ready:**
- `getMenuItems(role)` đã sẵn — render sidebar động.
- `BREADCRUMB_LABELS` đã sẵn — Breadcrumb component đọc map.
- `defaultLandingPath(role)` đã sẵn — middleware redirect role-based.
- shadcn CLI hoạt động — Plan 04 chạy `npx shadcn add sidebar breadcrumb dropdown-menu avatar tooltip sheet sonner alert-dialog`.

**Plan 06 (PDF spike) ready:**
- `@react-pdf/renderer@4.5.1` đã cài.
- `public/fonts/` folder đã tạo — Plan 06 download Be Vietnam Pro static TTF (Regular, Bold, Italic) đặt vào.
- `lib/pdf/` folder đã tạo — Plan 06 viết `fonts.ts` + `QuyetDinhMau.tsx` template.

**No blockers.** Phase 1 có thể tiếp tục Plan 02.

## Self-Check

Verifying claims before completion:

**Files created:**
- FOUND: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `.env.local`, `.eslintrc.json`, `.prettierrc.json`, `.prettierignore`, `next-env.d.ts`
- FOUND: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- FOUND: `components.json`, `lib/utils.ts`, `components/ui/button.tsx`
- FOUND: `lib/prisma.ts`, `lib/constants.ts`, `lib/permissions.ts`, `lib/format.ts`, `lib/date.ts`, `lib/vi-search.ts`, `lib/breadcrumbs.ts`, `lib/menu.ts`
- FOUND: `lib/workflows/programCycle.ts`, `lib/workflows/project.ts`, `lib/workflows/orgProfile.ts`, `lib/workflows/scoreSheet.ts`, `lib/workflows/contract.ts`, `lib/workflows/report.ts`
- FOUND: `types/next-auth.d.ts`
- FOUND: `storage/.gitignore`, all .gitkeep placeholders

**Commits:**
- FOUND: `1c0f29d` (Task 1)
- FOUND: `aaca0c6` (Task 2)
- FOUND: `9e4178f` (Task 3)

**Behavioral smoke tests passed:**
- TERMS = 21 keys ✓
- HARDCODED_USERS = 8 ✓
- can('DONVI', 'de-an', 'create') = true ✓
- can('DONVI', 'phe-duyet', 'approve') = false ✓ (default-deny)
- canTransitionCycle('CLOSED_REGISTRATION', 'OPEN_REGISTRATION') = true ✓ (gia hạn flow)
- canTransitionCycle('APPROVED', 'DRAFT') = false ✓ (no rollback)
- formatVND(2_500_000_000) = "2.500.000.000 đồng" ✓
- formatVNDCompact(2_500_000_000) = "2,5 tỷ" ✓
- formatDate(2026-04-30) = "30/04/2026" ✓
- removeDiacritics("Đề án Việt Nam") = "de an viet nam" ✓
- BREADCRUMB_LABELS['/dashboard'] = "Trang chủ" ✓
- defaultLandingPath('HOIDONG') = "/tham-dinh" ✓

**Phase verification:**
- `npm run typecheck` → exit 0 ✓
- `npm run lint` → exit 0, no errors/warnings ✓
- `npm run build` → exit 0, 4 static pages generated ✓
- `git ls-files | grep .env.local` → empty ✓ (T-01-01 mitigation)
- `git ls-files | grep prisma/dev.db` → empty ✓ (T-01-02 mitigation)

## Self-Check: PASSED

---

*Phase: 01-m0-bootstrap-h-t-ng*
*Completed: 2026-04-30*
