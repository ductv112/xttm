---
phase: 02-m1-quan-tri-danh-muc
plan: 01
subsystem: audit
tags: [audit-log, server-action-wrapper, data-table, csv-export, vietnamese-ui, rbac]

requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: "lib/auth.ts auth() session, lib/permissions.ts can() RBAC, lib/prisma.ts singleton, lib/format.ts formatDateTime, AuditLog model trong prisma/schema, 18 shadcn primitives + sidebar/breadcrumb/QueryProvider"
provides:
  - "lib/audit-types.ts: 11 actions × 18 resources × Vietnamese labels + badge color tokens"
  - "lib/audit.ts: withAuditLog<TArgs,TReturn>(meta, fn) generic wrapper với captureBefore/captureAfter, fire-and-forget logAudit, diffObjects shallow diff (skip system fields)"
  - "app/(app)/nhat-ky/_actions/list.ts: listAuditLogs(filter, pageIndex, pageSize) RBAC audit-log:read"
  - "app/(app)/nhat-ky/_actions/export.ts: exportAuditLogsCSV(filter) UTF-8 BOM, cap 5000 rows, self-audit EXPORT"
  - "app/(app)/nhat-ky/page.tsx: RSC defense-in-depth RBAC + 6 filter parsing từ searchParams + initial data hydration"
  - "AuditLogFilterBar (URL search params bookmarkable), AuditLogTable (TanStack Query paginated), AuditLogDetailSheet (3 sections + grid 2 cột before/after diff)"
  - "Route /nhat-ky reachable qua sidebar menu cho admin + lãnh đạo (lib/permissions.ts ALL_MENU_ITEMS updated)"
affects: [02-04-user-management, 02-05-role-permission-matrix, 02-06-catalog-editors, 02-07-system-config, 03-program-cycle, 04-org-profile, 05-project-decl, 06-receive-review, 07-evaluation, 08-contract, 09-report-acceptance, all-future-mutations]

tech-stack:
  added:
    - "react-day-picker@9.14.0 (transitive via shadcn calendar)"
    - "cmdk@1.1.1 (transitive via shadcn command)"
    - "shadcn components: table, popover, command, calendar, checkbox, dialog, select"
  patterns:
    - "withAuditLog generic wrapper — mọi mutation server action TỪ Plan 02-04+ phải import withAuditLog từ @/lib/audit để wrap fn; meta cung cấp action+resource+resourceIdFromArgs/Result+captureBefore/captureAfter"
    - "Fire-and-forget audit log: void logAudit(...) trong wrapper, không await — audit failure log console.error nhưng không reject business action (graceful degradation per PITFALLS audit volume)"
    - "Dynamic import @/lib/auth + next/headers trong withAuditLog — tránh circular dep (lib/audit imported by mọi server action, lib/auth pulls bcrypt+prisma+next-auth)"
    - "RBAC dòng 1-2 mọi server action audit-log: const session = await auth(); throw 'Yêu cầu đăng nhập'; if(!can(role,'audit-log','read')) throw 'Bạn không có quyền truy cập nhật ký'"
    - "URL search params là source of truth cho filter — bookmarkable, browser back/forward navigation tự refetch via TanStack Query queryKey reactive"
    - "CSV UTF-8 BOM (\\uFEFF) prefix + CRLF line endings — Excel mở dấu Việt đúng"
    - "shadcn primitives được install incrementally per feature page — không bulk install (đỡ unused code)"

key-files:
  created:
    - "lib/audit-types.ts (96 LOC) — AUDIT_ACTIONS (11) + AUDIT_RESOURCES (18) + labels + badge tokens + AuditEntry"
    - "lib/audit.ts (228 LOC) — diffObjects + logAudit + withAuditLog generic wrapper"
    - "app/(app)/nhat-ky/_actions/types.ts — AuditFilter, AuditLogRow, AuditListResult"
    - "app/(app)/nhat-ky/_actions/list.ts — listAuditLogs với buildAuditWhere + RBAC + pagination"
    - "app/(app)/nhat-ky/_actions/export.ts — exportAuditLogsCSV với BOM + cap 5000 + self-audit"
    - "app/(app)/nhat-ky/page.tsx — RSC, defense-in-depth RBAC, 6 filter parsing, hydration"
    - "app/(app)/nhat-ky/_components/AuditLogFilterBar.tsx — combobox + 2 multi-select + 2 date pickers + keyword + apply/reset/export buttons"
    - "app/(app)/nhat-ky/_components/AuditLogTable.tsx — TanStack Query paginated 50/page + badge action màu + empty state"
    - "app/(app)/nhat-ky/_components/AuditLogDetailSheet.tsx — 3 sections + diff grid 2 cột + JsonBlock fallback + sao chép JSON"
    - "components/ui/{table,popover,command,calendar,checkbox,dialog,select}.tsx — shadcn"
  modified:
    - "lib/permissions.ts — ALL_MENU_ITEMS audit-log href đổi /audit-log → /nhat-ky"
    - "lib/breadcrumbs.ts — thêm '/nhat-ky' label (giữ '/audit-log' cho backward compat)"
    - "package.json — react-day-picker + cmdk transitive deps"

key-decisions:
  - "Fire-and-forget audit write — wrapper kicks off promise via void logAudit(...) thay vì await; failure log console.error nhưng business action vẫn return result (T-02-01-05 mitigation per PITFALLS audit volume)"
  - "Dynamic import @/lib/auth bên trong withAuditLog body, không top-level — tránh circular dep ở module load time (lib/audit là dependency của mọi server action mutation Phase 2-9, lib/auth pulls bcrypt+prisma+next-auth heavy stack)"
  - "Skip SYSTEM_FIELDS (updatedAt/createdAt/searchKey/currentVersion) trong diffObjects — Prisma/system tự update các field này, ghi vào diff sẽ tạo noise"
  - "Resource type AuditResource = 18 entries khớp 100% với lib/permissions.ts Resource — single source of truth, tránh drift"
  - "Filter inclusive end-of-day: nếu user pass filter.to dạng YYYY-MM-DD, expand thành 23:59:59.999 trước khi đưa vào prisma where (UX expectation 'đến ngày 30/4' = include all 30/4)"
  - "CSV không export userAgent đầy đủ (T-02-01-03 fingerprint mitigation) — chỉ summarize trong UI Sheet detail, không xuất ra file"
  - "Cap export 5000 rows — bound memory + prevent OOM cho production-like; CSV ~1.2MB Excel mở vài giây"
  - "URL search params làm source of truth cho filter (bookmarkable + browser nav) — Filter Bar local state mirror sp + commit on Áp dụng; Table queryKey reactive với sp"
  - "Pagination 50/page thay vì virtualization Phase 1 — virtualization sẽ refactor khi data > 1000 rows ở Plan 02-03 shared-ui-primitives"
  - "Hardcoded user list trong combobox tạm thời — Plan 02-04 sẽ thay bằng loadUsers server action với DB id thực; comment TODO inline"

patterns-established:
  - "Audit wrapper convention: server action MUST `import { withAuditLog } from '@/lib/audit'` + wrap fn; resource enum khớp với lib/permissions.ts Resource type"
  - "Filter pattern URL-driven: server search params parsing trong RSC + client useSearchParams + URL push on commit — bookmarkable + back/forward friendly"
  - "Audit log routing 2 layers: middleware (Plan 01-03) + RSC defense-in-depth (audit-log:read) + server action authoritative (RBAC again at action entry) — 3 layers per ARCHITECTURE.md"
  - "CSV export pattern: server action returns {filename, csv, count} → client Blob + URL.createObjectURL + a.click + revokeObjectURL + toast success"
  - "Sheet detail pattern: action-aware diff rendering (CREATE → after only, DELETE → before only, UPDATE → grid 2 cột key-by-key) — phase sau phải re-use cùng pattern"

requirements-completed:
  - LOG-01
  - LOG-02
  - LOG-03

duration: 8m
completed: 2026-04-30
---

# Phase 02 Plan 01: Audit Log Infrastructure Summary

**Audit log foundation hoàn chỉnh: withAuditLog wrapper sẵn sàng cho mọi mutation server action Phase 2-9 + trang /nhat-ky DataTable filter 6 fields + JSON diff sheet + xuất CSV UTF-8 BOM Excel-compatible.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-30T18:10:47Z
- **Completed:** 2026-04-30T18:18:44Z
- **Tasks:** 3
- **Files created:** 14 (2 lib + 3 server actions + 1 page + 3 components + 7 shadcn primitives — `lib/breadcrumbs.ts` + `lib/permissions.ts` modified, `package.json` + `package-lock.json` updated)

## Accomplishments

- `lib/audit.ts` `withAuditLog<TArgs,TReturn>(meta, fn)` generic wrapper sẵn sàng cho mọi server action mutation Phase 2-9 — meta cung cấp `action`, `resource`, `resourceIdFromArgs/Result`, `captureBefore/captureAfter`; fire-and-forget audit write không block business latency
- `diffObjects(before, after)` shallow diff helper với SYSTEM_FIELDS skip list (`updatedAt`/`createdAt`/`searchKey`/`currentVersion`) — tránh noise khi Prisma tự update các field hệ thống
- `logAudit(entry, userId, ip?, userAgent?)` graceful-degradation persist — failure log console.error nhưng KHÔNG throw (T-02-01-05 mitigation)
- 2 server actions RBAC-checked dòng đầu: `listAuditLogs(filter, pageIndex, pageSize)` paginated 50/page với 6 filter (userId / resources / actions / from / to / keyword OR fullName+resourceId) và `exportAuditLogsCSV(filter)` UTF-8 BOM + cap 5000 rows + self-audit EXPORT
- Trang `/nhat-ky` đầy đủ: heading "Nhật ký truy cập" + filter bar 6 controls + DataTable badge màu theo action (CREATE green / UPDATE blue / DELETE red) + empty state lucide:history + Sheet detail JSON diff grid 2 cột before/after với strikethrough đỏ + sao chép JSON
- URL search params là source of truth cho filter — bookmarkable + browser back/forward tự refetch qua TanStack Query queryKey reactive với `useSearchParams`
- Defense-in-depth RBAC 3 layers: middleware (Plan 01-03) + RSC redirect (`if(!can(role,'audit-log','read')) redirect`) + server action authoritative throw

## Task Commits

1. **Task 1: Audit types + withAuditLog helper** — `cb90e19` (feat)
2. **Task 2: Server actions list + export CSV cho audit log** — `69b2c6d` (feat)
3. **Task 3: Audit log page + components (DataTable + filter + sheet diff)** — `ecfa107` (feat)

## Files Created/Modified

### Lib foundation (Task 1)
- `lib/audit-types.ts` — 11 actions × 18 resources × Vietnamese labels + badge color tokens (`AUDIT_ACTION_BADGE`)
- `lib/audit.ts` — `diffObjects` (skip SYSTEM_FIELDS), `logAudit` fire-and-forget với try/catch, `withAuditLog<TArgs,TReturn>` generic wrapper — dynamic import `@/lib/auth` + `next/headers` tránh circular dep

### Server actions (Task 2)
- `app/(app)/nhat-ky/_actions/types.ts` — `AuditFilter` (6 fields), `AuditLogRow`, `AuditListResult`
- `app/(app)/nhat-ky/_actions/list.ts` — `listAuditLogs` + `buildAuditWhere` (re-used by export); RBAC dòng 1-2; prisma `where` build từ filter (in/contains parameterized)
- `app/(app)/nhat-ky/_actions/export.ts` — `exportAuditLogsCSV` với UTF-8 BOM (`'﻿'` literal) + CRLF + cap 5000 + self-audit EXPORT/audit-log + filename `nhat-ky-${YYYYMMDD-HHmmss}.csv`

### Page + components (Task 3)
- `app/(app)/nhat-ky/page.tsx` — RSC defense-in-depth (`auth()` redirect /login + `can()` redirect defaultLandingPath nếu thiếu quyền), `searchParams: Promise<...>` Next 15 async parsing 6 filter fields, fetch initial data via `listAuditLogs`, hydrate
- `app/(app)/nhat-ky/_components/AuditLogFilterBar.tsx` — Client; combobox người dùng + 2 multi-select (phân hệ/hành động) + 2 date pickers (Từ ngày / Đến ngày) + keyword input với icon search; "Áp dụng" + "Xóa bộ lọc" + "Xuất CSV" CTA; URL search params via `useRouter` + `useSearchParams`
- `app/(app)/nhat-ky/_components/AuditLogTable.tsx` — Client; TanStack Query với `keepPreviousData` + `initialData` hydration; 6 columns (Thời gian / Người dùng + role / Hành động badge / Phân hệ / Đối tượng mono / Chi tiết button); pagination 50/page với "Hiển thị X-Y trong tổng N"; empty state `lucide:history` + "Chưa có nhật ký"; loading state Skeleton x8
- `app/(app)/nhat-ky/_components/AuditLogDetailSheet.tsx` — Client; shadcn Sheet 600px slide-in từ phải; 3 sections: "Người thực hiện" (họ tên + vai trò + IP + trình duyệt summarized), "Đối tượng" (resourceId mono), "Thay đổi" (action-aware: CREATE → after only green, DELETE → before only red, UPDATE → grid 2 cột key-by-key strikethrough/highlight + metadata JsonBlock); footer "Đóng" + "Sao chép JSON" copy clipboard

### shadcn primitives installed
- `components/ui/{table,popover,command,calendar,checkbox,dialog,select}.tsx` — installed via `npx shadcn add table popover command calendar checkbox dialog select`

### Modified
- `lib/permissions.ts` — `ALL_MENU_ITEMS` audit-log href đổi từ `/audit-log` → `/nhat-ky` để khớp route plan
- `lib/breadcrumbs.ts` — thêm key `/nhat-ky` label "Nhật ký truy cập" (giữ `/audit-log` cho backward compat tránh break sidebar legacy nếu có)
- `package.json` + `package-lock.json` — react-day-picker@9.14.0 + cmdk@1.1.1 transitive deps từ shadcn install

## Decisions Made

- **Fire-and-forget audit write** — `void logAudit(...)` trong wrapper, không await; failure log console.error nhưng business action vẫn return result. Lý do: PITFALLS audit volume warning — mọi mutation Phase 2-9 wrap qua withAuditLog → nếu await audit DB write, mọi server action chậm thêm ~10-30ms. Audit log không phải transactional với business write, "best-effort" acceptable cho POC.
- **Dynamic import @/lib/auth** — `const { auth } = await import('@/lib/auth')` bên trong wrapped fn body, không top-level. Lý do: lib/audit imported by mọi server action mutation Phase 2-9; lib/auth pulls bcryptjs + prisma + next-auth heavy stack — top-level import gây circular ở module load time + slower cold start.
- **Skip SYSTEM_FIELDS trong diffObjects** — `updatedAt/createdAt/searchKey/currentVersion` không tính vào diff vì Prisma/system tự update; ghi vào diff chỉ tạo noise visually trong Sheet detail (mỗi UPDATE sẽ luôn có "updatedAt changed").
- **CSV không export userAgent đầy đủ** — T-02-01-03 (info disclosure / fingerprint) mitigation. UI Sheet detail summarize 80 chars first; CSV chỉ giữ Time/User/Role/Action/Resource/ID/IP — IP là cần thiết cho compliance audit, userAgent quá fingerprint-heavy.
- **Cap export 5000 rows** — bound memory + prevent OOM. 5000 × ~250 bytes = 1.2MB CSV, Excel mở vài giây. Production scope tương lai có thể stream/chunk; POC scope acceptable.
- **URL search params là source of truth** — Filter Bar local state mirror sp; commit "Áp dụng" push URL; Table queryKey reactive với sp via React.useMemo. Lợi: bookmarkable filter URL + browser back/forward tự work + share filter URL với colleague. Trade-off: nhiều filter changes = nhiều URL pushes — acceptable vì user click "Áp dụng" 1 lần sau khi pick all filters.
- **Pagination 50/page thay vì virtualization** — Plan này dùng pagination đơn giản; virtualization (TanStack Virtual) sẽ refactor sang DataTable shared primitive ở Plan 02-03 khi >1000 rows realistic. POC volume 50/page là enough.
- **Hardcoded users trong combobox tạm thời** — `HARDCODED_USERS` constant từ Plan 01-01 dùng làm options; user.id mapping placeholder bằng username. Plan 02-04 sẽ thay bằng `loadUsers()` server action với DB id thực; comment inline TODO.
- **Route /nhat-ky thay vì /audit-log** — Plan locks route Vietnamese-friendly `/nhat-ky` (slug VN-style nhất quán với /tham-dinh, /phe-duyet, /hop-dong). Update lib/permissions.ts ALL_MENU_ITEMS + lib/breadcrumbs.ts để khớp (Rule 3 deviation).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Sidebar menu ALL_MENU_ITEMS trỏ `/audit-log` nhưng plan locks route `/nhat-ky`**

- **Found during:** Task 3 (sau khi tạo `app/(app)/nhat-ky/page.tsx`)
- **Issue:** `lib/permissions.ts` ALL_MENU_ITEMS có entry với `href: '/audit-log'` (set tại Plan 01-01) nhưng Plan 02-01 specify route `/nhat-ky` — nếu giữ nguyên, admin/lãnh đạo click sidebar "Nhật ký truy cập" → 404 (no `/audit-log/page.tsx` exists).
- **Fix:** Đổi `href: '/audit-log'` → `href: '/nhat-ky'` trong ALL_MENU_ITEMS. Thêm key `/nhat-ky` vào `lib/breadcrumbs.ts` BREADCRUMB_LABELS (giữ `/audit-log` cho backward compat phòng có code khác reference legacy).
- **Files modified:** `lib/permissions.ts`, `lib/breadcrumbs.ts`
- **Verification:** Build pass `/nhat-ky` route hiển thị 41.9 kB; sidebar admin/lãnh đạo render link đúng.
- **Committed in:** `ecfa107` (Task 3 commit)

**2. [Rule 1 - Bug] Unused `AuditEntry` import trong `lib/audit.ts` lint warning**

- **Found during:** Task 3 verification (`npm run lint`)
- **Issue:** `lib/audit.ts` import `AuditEntry` từ `@/lib/audit-types` nhưng không reference (dùng `LogAuditInput` type local thay vì re-export `AuditEntry`).
- **Fix:** Xóa `AuditEntry` khỏi import statement.
- **Files modified:** `lib/audit.ts`
- **Verification:** Lint pass (chỉ còn pre-existing prisma/seed warnings out of scope).
- **Committed in:** `ecfa107` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — Rule 3, 1 lint cleanup — Rule 1)

**Impact on plan:** Cả 2 fix cần thiết để plan goal achieved (route reachable + clean lint). Không scope creep.

## Authentication Gates

None — plan không yêu cầu external service auth. Smoke test (Task 1) chạy local Prisma SQLite với admin user từ seed.

## Issues Encountered

- **Pre-existing prisma/seed lint warnings** — `prisma/seed/helpers.ts` + `prisma/seed.ts` có 6 console.log warnings (set tại Plan 01-02). Out of scope per scope-boundary rule — log nhưng không fix.
- **Git LF→CRLF warnings** — Windows default line ending, không ảnh hưởng functionality.

## User Setup Required

None — Plan 02-01 không yêu cầu user setup.

**UAT manual checklist (post-Plan execution):**
1. Đăng nhập `admin/Admin@123` → click sidebar "Quản trị" → "Nhật ký truy cập" → trang `/nhat-ky` render với heading "Nhật ký truy cập" + filter bar đầy đủ 6 controls + empty state "Chưa có nhật ký" (DB chưa có log).
2. Đăng nhập `lanhdao/Ld@123` → cùng kết quả (Lãnh đạo cũng có quyền `audit-log:read`).
3. Đăng nhập `donvi1/Donvi@123` → sidebar KHÔNG hiển thị "Nhật ký truy cập"; truy cập trực tiếp `/nhat-ky` → middleware/RSC redirect về `/de-an` (DONVI default landing).
4. Click "Xuất CSV" với filter rỗng → file `nhat-ky-{timestamp}.csv` download (sẽ chỉ có header row vì DB rỗng); mở Excel verify dấu Việt "Thời gian" / "Hành động" / "Phân hệ" hiển thị đúng dấu.
5. Sau khi Plan 02-04+ chạy mutation đầu tiên, `/nhat-ky` sẽ tự hiển thị log records — verify badge màu (CREATE green / UPDATE blue), filter user/resource/action/date range hoạt động, click row mở Sheet detail với diff grid 2 cột.

## Next Phase Readiness

**Plan 02-04 (User Management) ready to import:**
```typescript
import { withAuditLog } from '@/lib/audit';

export const createUser = withAuditLog(
  {
    action: 'CREATE',
    resource: 'nguoi-dung',
    resourceIdFromResult: (user) => user.id,
  },
  async (data: UserPatch) => {
    // ... business logic
    return prisma.user.create({ data });
  },
);
```

**Plan 02-04..07 + 03+ MUST:**
- Import `withAuditLog` từ `@/lib/audit` cho mọi mutation server action
- Choose `action` từ AUDIT_ACTIONS (`'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ASSIGN' | 'EXPORT'`)
- Choose `resource` từ AUDIT_RESOURCES (18 entries khớp lib/permissions.ts)
- Use `captureBefore` để load existing record cho UPDATE/DELETE → diffObjects sẽ generate before/after diff trong Sheet detail
- Use `resourceIdFromResult` cho CREATE (entity.id từ create) hoặc `resourceIdFromArgs` cho UPDATE/DELETE (id từ args)

**Plan 02-03 (Shared UI Primitives) MAY refactor:**
- Move `AuditLogTable` pagination + empty state pattern thành shared `<DataTable>` primitive
- Move `MultiSelect` + `UserCombobox` patterns thành shared
- Move `DiffView` thành shared `<JsonDiffView>` cho re-use bởi audit-related screens khác (vd Plan 03 visual state machine history)

**No blockers.** Plan 02-02 (catalog schema) có thể tiếp tục Wave 1.

## Threat Flags

None — plan không introduce new attack surface ngoài threat_model đã document. Existing mitigations:
- T-02-01-01 E (privilege escalation): `can(role, 'audit-log', 'read')` dòng 2 cả listAuditLogs + exportAuditLogsCSV ✓
- T-02-01-02 T (tampering): không có server action update/delete audit log entry ✓
- T-02-01-03 I (info disclosure): cap 5000 rows + không export userAgent đầy đủ ✓
- T-02-01-04 T (injection): Prisma `contains` parameterized ✓
- T-02-01-05 D (denial): fire-and-forget `void logAudit(...)` ✓
- T-02-01-06 R (repudiation): convention enforce by code review ✓ (defer immutable WORM Phase 11)
- T-02-01-07 I (XSS in diff): React JSX auto-escape, không `dangerouslySetInnerHTML`, JSON.parse safe ✓

## Self-Check

Verifying claims before completion:

**Files created:**
- FOUND: `lib/audit-types.ts`, `lib/audit.ts`
- FOUND: `app/(app)/nhat-ky/_actions/types.ts`, `_actions/list.ts`, `_actions/export.ts`
- FOUND: `app/(app)/nhat-ky/page.tsx`
- FOUND: `_components/AuditLogFilterBar.tsx`, `_components/AuditLogTable.tsx`, `_components/AuditLogDetailSheet.tsx`
- FOUND: `components/ui/{table,popover,command,calendar,checkbox,dialog,select}.tsx`

**Commits:**
- FOUND: `cb90e19` (Task 1: feat audit types + helper)
- FOUND: `69b2c6d` (Task 2: feat server actions list + export)
- FOUND: `ecfa107` (Task 3: feat trang /nhat-ky + components)

**Behavioral smoke tests passed:**
- `lib/audit.ts` exports 3 names: `diffObjects` ✓, `logAudit` ✓, `withAuditLog` ✓
- `AUDIT_RESOURCES` đúng 18 entries ✓ (khớp lib/permissions.ts Resource)
- `AUDIT_ACTIONS` đúng 11 entries ✓
- `prisma.auditLog.create` smoke test (Task 1) — record persisted, found via findFirst, deleted cleanup ✓
- `diffObjects` skip SYSTEM_FIELDS đúng (updatedAt change KHÔNG appear, name change DO appear) ✓
- Both server actions có `'use server'` directive ✓
- Both server actions check `can(role, 'audit-log', 'read')` dòng đầu ✓
- `exportAuditLogsCSV` chứa UTF-8 BOM `'﻿'` literal ✓
- Page heading "Nhật ký truy cập" appears trong page.tsx + metadata title ✓
- Sidebar `/nhat-ky` link cho admin/lãnh đạo (lib/permissions.ts updated) ✓

**Phase verification:**
- `npx tsc --noEmit` → exit 0 ✓
- `npm run lint` → only pre-existing prisma/seed warnings (out of scope) ✓
- `npm run build` → exit 0, `/nhat-ky` route 41.9 kB; 8 routes total compile pass ✓

## Self-Check: PASSED

---

*Phase: 02-m1-quan-tri-danh-muc*
*Completed: 2026-04-30*
