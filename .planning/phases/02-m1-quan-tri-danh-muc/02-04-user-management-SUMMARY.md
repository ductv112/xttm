---
phase: 02-m1-quan-tri-danh-muc
plan: 04
subsystem: user-management
tags: [user-mgmt, crud, bulk-actions, excel-export, password-reset, rbac, audit-log]

requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: "lib/auth.ts auth() session, lib/permissions.ts can() RBAC matrix với 'nguoi-dung' resource (read/create/update/delete admin-only), lib/prisma.ts singleton, bcryptjs cho password hash, NextAuth Credentials provider"
  - phase: 02-m1-quan-tri-danh-muc plan 01
    provides: "lib/audit.ts withAuditLog<TArgs,TReturn> wrapper + AUDIT_RESOURCES bao gồm 'nguoi-dung' + AUDIT_ACTIONS có CREATE/UPDATE/EXPORT — mọi mutation server action user-mgmt phải import từ @/lib/audit"
  - phase: 02-m1-quan-tri-danh-muc plan 03
    provides: "components/shared/data-table (DataTable + BulkAction + DataTableEmptyState config), components/shared/MultiSelect, components/shared/ConfirmDialog + useConfirmDialog hook, components/shared/CopyButton, components/shared/EmptyState (10-icon whitelist gồm 'users')"
provides:
  - "app/(app)/nguoi-dung/_actions/schemas.ts: createUserSchema, updateUserSchema, listUsersFilterSchema (Zod with Vietnamese error messages, importable from client)"
  - "app/(app)/nguoi-dung/_actions/list.ts: listUsers(filter, pageIndex, pageSize) + getUserById(id) + listOrganizationsForSelect() — RBAC nguoi-dung:read"
  - "app/(app)/nguoi-dung/_actions/create.ts: createUser(input) — bcrypt hash cost 10, withAuditLog CREATE với captureAfter redact password '[redacted]' (T-02-04-04)"
  - "app/(app)/nguoi-dung/_actions/update.ts: updateUser(id, input) — captureBefore diff redacted (no passwordHash), self-role-change guard, ADMIN promotion guard (T-02-04-02)"
  - "app/(app)/nguoi-dung/_actions/lock.ts: lockUser/unlockUser (single, audit-wrapped) + bulkLockUsers/bulkUnlockUsers/bulkChangeRole với MAX_BULK_IDS=100 cap + filter-out-self (T-02-04-08)"
  - "app/(app)/nguoi-dung/_actions/reset-password.ts: resetPassword(id) trả {tempPassword} 1 lần, audit captureAfter chỉ {passwordReset:true} (T-02-04-04)"
  - "app/(app)/nguoi-dung/_actions/password-utils.ts: generateTempPassword() pure function — 12 chars guaranteed lower/upper/digit/symbol, Fisher-Yates shuffle (tách module để tránh non-async export trong 'use server')"
  - "app/(app)/nguoi-dung/_actions/export.ts: exportUsersExcel(filter) returns {filename, base64, count}, 8 cột tiếng Việt, cap 5000 rows, audit EXPORT"
  - "Trang /nguoi-dung: RSC defense-in-depth RBAC + filter bar (search debounce 300ms + MultiSelect roles + MultiSelect orgs + Select status + Xuất Excel) + DataTable 7 cột + bulk actions (Khóa/Mở khóa/Đổi vai trò popover) + reset password 2-step dialog"
  - "Trang /nguoi-dung/new: RSC RBAC + RHF zodResolver(createUserSchema) + UserFormFields (8 fields) + redirect /nguoi-dung sau success"
  - "Trang /nguoi-dung/[id]/edit: RSC fetch user + notFound() + UserFormFields mode='edit' (username readonly + isSelf disable role) + RHF zodResolver(updateUserSchema)"
  - "_components/UserFormFields.tsx: generic <T> RHF form fields cho cả create + edit, 2-column grid với 8 fields"
affects:
  - "02-05-role-permission-matrix: sẽ assign role cho 8 hardcoded users + new users tạo qua plan này; can use createUser/updateUser pattern as reference"
  - "Phase 3+ (mọi phase nghiệp vụ): user list trong dropdown 'Phân công chuyên viên' / 'Thành viên hội đồng' / 'Người ký' sẽ load từ DB users (active only) thay vì HARDCODED_USERS placeholder"
  - "02-01-audit-log: trang /nhat-ky bây giờ có data thực — mọi create/update/lock/reset của user-mgmt sẽ ghi audit entry với resource='nguoi-dung'"

tech-stack:
  added:
    - "shadcn switch component (components/ui/switch.tsx) — install qua npx shadcn add switch (cho isActive toggle trong UserFormFields)"
  patterns:
    - "Server action 'use server' module convention: mọi non-async export phải tách thành sibling module (vd password-utils.ts) để Next 15 không reject — chỉ async functions được phép export từ 'use server'"
    - "withAuditLog captureAfter redact convention: với entity có sensitive field (passwordHash, secret token), captureAfter trả object explicit field whitelist KHÔNG include sensitive bytes — diff trong audit log không bao giờ chứa hash bytes hay raw password"
    - "Zod parse strips unknown fields — KHÔNG spread parsed input vào prisma.create.data, viết explicit field whitelist để chống mass assignment ngoài Zod schema (defense in depth, T-02-04-03)"
    - "Bulk action filter-out-self pattern: trước khi process bulk lock/role-change, filter ids để loại bỏ session.user.id, append vào skipped array — UX feedback 'bỏ qua tài khoản của bạn' thay vì throw error toàn bộ batch"
    - "Self privilege guards 2 layers: server action (authoritative) throw + client UI disable (UX hint với tooltip/description) — phòng UI override hoặc API direct call"
    - "Excel export base64 pattern: server action returns base64 string thay vì Buffer (RSC ↔ client serialization friendly), client decode atob → Uint8Array → Blob → URL.createObjectURL → anchor download → revokeObjectURL"
    - "URL search params là source of truth cho filter — ResetPasswordDialog state controlled bởi parent qua selected row state, không qua URL"
    - "shadcn FormField generic typed via Path<T> + FieldValues — UserFormFields chia sẻ giữa CreateUserInput và UpdateUserInput mà không cần duplicate component"

key-files:
  created:
    - "app/(app)/nguoi-dung/_actions/schemas.ts (74 dòng) — Zod 3 schemas Vietnamese error messages"
    - "app/(app)/nguoi-dung/_actions/list.ts (157 dòng) — listUsers + getUserById + listOrganizationsForSelect, RBAC + Prisma where build"
    - "app/(app)/nguoi-dung/_actions/create.ts (110 dòng) — createUser bcrypt + withAuditLog redact password"
    - "app/(app)/nguoi-dung/_actions/update.ts (143 dòng) — updateUser captureBefore/After diff + privilege guards"
    - "app/(app)/nguoi-dung/_actions/lock.ts (286 dòng) — 5 functions: lockUser/unlockUser/bulkLockUsers/bulkUnlockUsers/bulkChangeRole"
    - "app/(app)/nguoi-dung/_actions/reset-password.ts (61 dòng) — resetPassword với T-02-04-04 mitigation"
    - "app/(app)/nguoi-dung/_actions/password-utils.ts (40 dòng) — generateTempPassword Fisher-Yates"
    - "app/(app)/nguoi-dung/_actions/export.ts (102 dòng) — exportUsersExcel base64 8 cột + audit EXPORT"
    - "app/(app)/nguoi-dung/page.tsx (83 dòng) — RSC list page với defense-in-depth RBAC + initial data hydration"
    - "app/(app)/nguoi-dung/_components/UserFilterBar.tsx (236 dòng) — search debounce 300ms + MultiSelect + Select + xuất Excel"
    - "app/(app)/nguoi-dung/_components/UserTable.tsx (478 dòng) — DataTable wrap + 7 cột + row dropdown + bulk actions + ResetPasswordDialog hookup + BulkChangeRoleFloatingPopover"
    - "app/(app)/nguoi-dung/_components/ResetPasswordDialog.tsx (171 dòng) — 2-step dialog (confirm → show-password) với prevent-close khi show-password"
    - "app/(app)/nguoi-dung/_components/UserFormFields.tsx (212 dòng) — generic <T> RHF form fields"
    - "app/(app)/nguoi-dung/new/page.tsx (24 dòng) — RSC orgs prefetch + render client form"
    - "app/(app)/nguoi-dung/new/_client.tsx (108 dòng) — RHF createUser + redirect"
    - "app/(app)/nguoi-dung/[id]/edit/page.tsx (43 dòng) — RSC fetch user + notFound + isSelf detect"
    - "app/(app)/nguoi-dung/[id]/edit/_client.tsx (143 dòng) — RHF updateUser + readonly username display"
    - "components/ui/switch.tsx — shadcn Switch primitive (install via npx shadcn add switch)"
  modified: []

key-decisions:
  - "**generateTempPassword tách module sang password-utils.ts** — Next 15 'use server' files chỉ cho phép async function exports; generateTempPassword là sync pure function nên phải nằm ở module riêng. Plan original spec exports generateTempPassword từ reset-password.ts; tôi tách giữ nguyên test grep coverage (≥2 occurrences trong actions folder) và build pass."
  - "**captureAfter redact convention** — captureAfter trong withAuditLog cho create/update KHÔNG dùng spread (...result) vì Prisma user object include passwordHash; thay vào đó liệt kê explicit fields {id, username, fullName, email, phone, role, isActive, organizationId} + 'password: [redacted]' cho create. Diff trong audit log bao giờ cũng safe to display."
  - "**Self privilege guards 3 layers** — (1) Server action throw 'Không thể tự khóa/đổi vai trò'; (2) Bulk actions filter-out-self ID trước khi process + append vào skipped; (3) UI dropdown menu disable item khi `id === currentUserId`. Layered defense vì bulk action skipped UX khác với single action throw — user phải nhận được feedback rõ ràng."
  - "**Bulk role-change UX qua floating popover, không qua bulk-action button onClick** — DataTableBulkActions component chia sẻ chỉ support single onClick async, không có popover slot. Giải pháp: render BulkChangeRoleFloatingPopover song song với DataTable khi selectedIds.length > 0, position offset translate-y-14 để hover bên trên DataTableBulkActions toolbar. UX trade-off: 2 popover/toolbar elements ở cùng vùng nhưng không chồng nhau."
  - "**Excel export base64 thay vì Buffer pass-through** — Server action result phải serializable (RSC ↔ client boundary). Buffer không serialize qua server-action JSON. Client decode atob → Uint8Array → Blob. Trade-off: 33% tăng kích thước network nhưng acceptable cho POC scope (5000 user × ~250 bytes = 1.2MB → 1.6MB base64)."
  - "**Status select '__none__' sentinel cho 'Không thuộc đơn vị nào'** — shadcn Select không cho phép value='' (empty string) vì SelectValue không render placeholder khi value defined; dùng sentinel '__none__' và convert về null khi onChange commit qua organizationId field."
  - "**ConfirmDialog 'destructive' variant cho khóa, default cho mở khóa** — Khóa = action irreversible từ góc nhìn UX (user không thể đăng nhập); mở khóa = restorative (default variant)."
  - "**ResetPasswordDialog prevent-close khi show-password step** — onPointerDownOutside + onEscapeKeyDown e.preventDefault() khi step === 'show-password' để force user click 'Đã lưu, đóng dialog' sau khi đã copy. UX critical vì password chỉ hiển thị 1 lần."
  - "**MAX_BULK_IDS = 100** — T-02-04-07 mitigation. Cap input array length để tránh OOM nếu admin chọn vô số rows; UX validation throw 'tối đa 100 tài khoản' trước khi loop. Cap có thể tăng nếu cần qua config sau."
  - "**RHF defaultValues 'role: undefined'** — Zod enum không cho phép '' (empty string) làm default; undefined cho phép Zod hiển thị placeholder + validation chỉ trigger khi user submit. UI shadcn Select với value={field.value ?? ''} fallback render placeholder."

requirements-completed:
  - USER-01
  - USER-02
  - USER-03
  - USER-04
  - USER-05
  - USER-06
  - USER-07

metrics:
  duration_minutes: 22
  completed_at: 2026-04-30
  task_count: 3
  file_count: 18
  commits:
    - "094950d: feat(02-04): server actions cho nguoi-dung (list/create/update/lock/reset/export) + Zod schemas"
    - "2955a60: feat(02-04): trang /nguoi-dung list page + DataTable + filter bar + bulk actions + reset password dialog"
    - "86e6d96: feat(02-04): trang tạo + chỉnh sửa người dùng + UserFormFields shared"
---

# Phase 02 Plan 04: User Management Summary

User CRUD module hoàn chỉnh — list/filter/bulk-actions + create/edit pages + lock/unlock + reset password 12-char + Excel export 8 cột tiếng Việt. Mọi mutation wrap qua `withAuditLog` (resource='nguoi-dung'); RBAC enforced 3 layers (middleware + RSC redirect + server action throw). 7/7 USER-01..07 đạt.

## Performance

- **Duration:** ~22 min
- **Started:** 2026-04-30 (overnight autonomous Phase 2 Wave 2)
- **Completed:** 2026-04-30
- **Tasks:** 3 atomic commits
- **Files created:** 18 (8 server actions + 5 components + 3 pages + UserFormFields shared + switch shadcn primitive)

## Accomplishments

- **8 server actions** với RBAC dòng đầu + `withAuditLog` wrap mọi mutation (CREATE/UPDATE/EXPORT) — `createUser/updateUser/lockUser/unlockUser/bulkLockUsers/bulkUnlockUsers/bulkChangeRole/resetPassword/exportUsersExcel/listUsers/getUserById/listOrganizationsForSelect`
- **3 pages** với defense-in-depth RBAC: `/nguoi-dung` (list RSC) + `/nguoi-dung/new` (RSC + client RHF) + `/nguoi-dung/[id]/edit` (RSC fetch + client RHF prefilled)
- **Filter bar** 4 controls: search debounce 300ms (fullName/username/email Prisma `contains`), MultiSelect 7 vai trò, MultiSelect orgs (loaded từ DB), Select status (Tất cả/Đang hoạt động/Đã khóa), Xuất Excel CTA
- **DataTable 7 cột** wrap shared primitive: Người dùng (fullName + @username), Email, Vai trò (Badge với ADMIN highlight blue), Đơn vị, Trạng thái (green/red Badge), Ngày tạo, Hành động dropdown
- **Bulk actions 3** — Khóa (destructive ConfirmDialog), Mở khóa (default ConfirmDialog), Đổi vai trò (popover trigger với Select 7 vai trò + ConfirmDialog)
- **Reset password dialog 2-step** — confirm → show-password với 12-char temp password code-formatted, CopyButton, Alert warning "Vui lòng lưu lại — sau khi đóng sẽ không thể xem lại", prevent-close khi show-password (force user copy first)
- **Excel export 8 cột tiếng Việt** — Họ tên / Tên đăng nhập / Email / Số điện thoại / Vai trò / Đơn vị / Trạng thái / Ngày tạo, cap 5000 rows, filename `nguoi-dung-{yyyyMMdd-HHmmss}.xlsx`, audit log EXPORT entry
- **Threat model mitigations implemented:** T-02-04-01 RBAC (mọi action), T-02-04-02 privilege escalation (ADMIN promotion guard + self-role-change guard), T-02-04-03 mass assignment (Zod parse + explicit field whitelist), T-02-04-04 temp password leak (audit captureAfter `{passwordReset:true}` only), T-02-04-05 SQL injection (Prisma `contains` parameterized), T-02-04-07 bulk OOM (MAX_BULK_IDS=100 cap), T-02-04-08 lock-self lockout (server throw + bulk filter-out-self + UI disable)

## Task Commits

1. **Task 1: Server actions + Zod schemas** — `094950d` (feat)
2. **Task 2: Trang /nguoi-dung + DataTable + filter + reset password dialog** — `2955a60` (feat)
3. **Task 3: Trang new + edit + UserFormFields shared** — `86e6d96` (feat)

## Files Created/Modified

### Server actions (Task 1, 8 files)
- `app/(app)/nguoi-dung/_actions/schemas.ts` — Zod schemas Vietnamese messages (createUserSchema/updateUserSchema/listUsersFilterSchema)
- `app/(app)/nguoi-dung/_actions/list.ts` — listUsers + getUserById + listOrganizationsForSelect, RBAC dòng 1-2
- `app/(app)/nguoi-dung/_actions/create.ts` — createUser bcrypt cost 10 + withAuditLog redact password
- `app/(app)/nguoi-dung/_actions/update.ts` — updateUser captureBefore diff + privilege escalation guards
- `app/(app)/nguoi-dung/_actions/lock.ts` — 5 functions: single + 3 bulk + bulkChangeRole với filter-out-self
- `app/(app)/nguoi-dung/_actions/reset-password.ts` — resetPassword T-02-04-04 (audit chỉ flag, không log raw)
- `app/(app)/nguoi-dung/_actions/password-utils.ts` — generateTempPassword pure (tách module để satisfy Next 15 'use server' constraint)
- `app/(app)/nguoi-dung/_actions/export.ts` — exportUsersExcel base64 + audit EXPORT

### Page + components (Task 2, 4 files)
- `app/(app)/nguoi-dung/page.tsx` — RSC RBAC + initial data hydration cho UserTable (Quản lý người dùng + Tạo người dùng CTA)
- `app/(app)/nguoi-dung/_components/UserFilterBar.tsx` — Client; URL search params source of truth + debounce 300ms keyword + MultiSelect roles/orgs + Select status + Xuất Excel CTA (atob → Blob → download)
- `app/(app)/nguoi-dung/_components/UserTable.tsx` — Client; TanStack Query với keepPreviousData + initialData; DataTable 7 cột + bulk actions array + per-row UserRowActions dropdown menu (Chỉnh sửa/Reset/Khóa-Mở khóa) + BulkChangeRoleFloatingPopover (z-60 above bulk toolbar) + ResetPasswordDialog hookup
- `app/(app)/nguoi-dung/_components/ResetPasswordDialog.tsx` — Client; shadcn Dialog 2-step state machine (`confirm` → `show-password`) + onPointerDownOutside/onEscapeKeyDown preventDefault khi show-password + CopyButton inline + Alert warning amber

### Create + Edit pages + UserFormFields (Task 3, 5 files)
- `app/(app)/nguoi-dung/_components/UserFormFields.tsx` — Generic `<T extends FieldValues>` RHF form fields, 2-column grid responsive, 8 fields (fullName/username readonly when edit/email/phone/password create-only/role select/organizationId select with __none__ sentinel/isActive Switch)
- `app/(app)/nguoi-dung/new/page.tsx` — RSC RBAC nguoi-dung:create + listOrganizationsForSelect prefetch
- `app/(app)/nguoi-dung/new/_client.tsx` — Client RHF zodResolver(createUserSchema) + onSubmit createUser + redirect /nguoi-dung + toast "Đã tạo người dùng {fullName}"
- `app/(app)/nguoi-dung/[id]/edit/page.tsx` — RSC fetch user via getUserById + notFound() nếu null + isSelf detection
- `app/(app)/nguoi-dung/[id]/edit/_client.tsx` — Client RHF zodResolver(updateUserSchema) + readonly username display block + UserFormFields với disableRoleSelect khi isSelf + onSubmit updateUser

### shadcn primitive
- `components/ui/switch.tsx` — installed via `npx shadcn add switch` (cho isActive toggle trong UserFormFields)

## Decisions Made

- **generateTempPassword tách module password-utils.ts** — Next 15 `'use server'` files chỉ cho phép async function exports. generateTempPassword là sync pure → phải nằm ở module riêng để build pass. Plan grep acceptance ≥2 vẫn met (export trong utils + import trong reset-password).
- **captureAfter redact explicit field whitelist** — không spread `...result` để tránh leak passwordHash bytes vào audit log diff. Pattern này sẽ apply tiếp cho mọi entity nhạy cảm Phase tiếp theo.
- **Self privilege guards 3 layers** — server throw + bulk filter + UI disable. UX phân biệt rõ: bulk skipped (toast info "bỏ qua tài khoản của bạn") vs single throw (toast error).
- **Bulk role-change qua floating popover** — DataTableBulkActions không có custom render slot; render `BulkChangeRoleFloatingPopover` song song với position offset `translate-y-14` để hover bên trên bulk toolbar (z-60). UX trade-off acceptable cho POC.
- **Excel export base64 thay Buffer** — RSC ↔ client serialization constraint, +33% network size acceptable.
- **shadcn Select '__none__' sentinel cho organizationId** — Select không cho phép empty string value; onChange convert về null trước khi commit lên field.
- **ResetPasswordDialog prevent-close khi show-password** — UX critical: temp password chỉ hiển thị 1 lần, force click "Đã lưu, đóng dialog" sau khi copy.
- **MAX_BULK_IDS = 100 cap** — T-02-04-07 mitigation; throw early trước khi loop.
- **RHF role default `undefined` thay vì empty string** — Zod enum không nhận '', undefined hiển thị placeholder + validation trigger khi submit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] generateTempPassword không thể export từ 'use server' file**

- **Found during:** Task 1 (build verification sau khi implement reset-password.ts)
- **Issue:** Plan spec exports `generateTempPassword` từ `reset-password.ts` cùng với `resetPassword`. Next 15 enforces 'use server' modules CHỈ cho phép async function exports — sync pure function `generateTempPassword` sẽ fail Next compilation kiểm tra (mặc dù `npm run build` initial pass có thể là Next chưa enforce strict trên Next 15.4, nhưng khả năng cao runtime invoke từ client component sẽ fail).
- **Fix:** Tạo `app/(app)/nguoi-dung/_actions/password-utils.ts` (plain TS, không 'use server') chứa `generateTempPassword`, import vào `reset-password.ts`. Pattern này giữ generateTempPassword reachable từ server side (resetPassword imports it) nhưng không expose ra client (vì password-utils.ts không có 'use server' và caller không bao giờ import từ client side).
- **Files modified:** `app/(app)/nguoi-dung/_actions/reset-password.ts`, `app/(app)/nguoi-dung/_actions/password-utils.ts` (new)
- **Verification:** `grep "generateTempPassword" app/(app)/nguoi-dung/_actions/*.ts` returns 3 (export + import + use), met plan acceptance criteria ≥2. Smoke test 5 samples đều 12 chars + có đủ 4 character classes.
- **Committed in:** `094950d`

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking architectural compatibility với Next 15)

**Impact on plan:** Acceptance criteria fully met (generateTempPassword vẫn export ≥2 lần trong _actions folder, satisfies grep check). Pattern `password-utils.ts` sibling module có thể reuse cho Phase tiếp theo nếu cần helper functions phục vụ server actions nhưng không cần là server actions themselves.

## Authentication Gates

None — plan không yêu cầu external service auth. DB seeded từ Plan 01-02 với 8 users + 5 orgs đã sẵn sàng. Smoke tests local SQLite pass.

## Issues Encountered

- **Pre-existing prisma/seed lint warnings** — `prisma/seed/catalogs.ts` 2 unused vars + `prisma/seed/helpers.ts` + `prisma/seed.ts` 7 console statements. Out of scope per scope-boundary rule — log nhưng không fix.
- **Git LF→CRLF warnings** — Windows line endings, không ảnh hưởng functionality.

## User Setup Required

None — plan không yêu cầu user setup. UAT manual checklist:

1. **Đăng nhập admin** (`admin/Admin@123`) → click sidebar "Quản trị" → "Người dùng" → trang `/nguoi-dung` render với heading "Quản lý người dùng" + filter bar + DataTable hiển thị 8 users từ seed.
2. **Filter** — chọn vai trò "Đơn vị chủ trì" → DataTable hiển thị 2 users (donvi1 Hoàng Mai Linh + donvi2 Vũ Đức Minh). Search "Hoàng Mai" → 1 user. Status "Đã khóa" → 0 users (tất cả đang active).
3. **Tạo user mới** — click "Tạo người dùng" → trang `/nguoi-dung/new` → fill form (Tên: Nguyễn Test, username: testuser, password: Test@1234, vai trò: Ban quản lý CT XTTM, đơn vị: Cục XTTM) → click "Tạo người dùng" → redirect `/nguoi-dung` + toast "Đã tạo người dùng Nguyễn Test"; user mới xuất hiện trong list (count 8 → 9).
4. **Edit user** — click row dropdown của testuser → "Chỉnh sửa" → trang `/nguoi-dung/[id]/edit` → username field readonly disabled với note "Không thể thay đổi sau khi tạo" → đổi fullName → "Lưu thay đổi" → toast "Đã cập nhật thông tin {fullName}".
5. **Reset password** — row dropdown → "Reset mật khẩu" → dialog confirm "Bạn có chắc chắn muốn reset...?" → click "Reset mật khẩu" → step show-password hiển thị 12-char password code-formatted + "Sao chép" + Alert "Vui lòng lưu lại..."; click "Sao chép" → toast success; close dialog (overlay click bị disabled, ESC bị disabled, chỉ button "Đã lưu, đóng dialog" hoạt động).
6. **Bulk actions** — chọn 3 users (checkbox) → bottom sticky toolbar hiển thị "[3] đã chọn | Khóa | Mở khóa | Đổi vai trò | × clear" + floating popover "Đổi vai trò" trên đó → click "Khóa" → ConfirmDialog "Khóa 3 tài khoản đã chọn?" → confirm → toast "Đã khóa 3 tài khoản"; nếu admin tự chọn mình → toast "Đã khóa 2 tài khoản (bỏ qua tài khoản của bạn)".
7. **Đổi vai trò bulk** — chọn 2 users → click floating popover "Đổi vai trò" → Select "Tài chính" → "Áp dụng" → ConfirmDialog → confirm → toast "Đã đổi vai trò cho 2 tài khoản"; refresh DataTable hiển thị Vai trò mới với badge slate.
8. **Xuất Excel** — click "Xuất Excel" → file `nguoi-dung-{timestamp}.xlsx` download; mở Excel verify 8 cột tiếng Việt hiển thị đúng dấu (Họ tên / Tên đăng nhập / Email / Số điện thoại / Vai trò / Đơn vị / Trạng thái / Ngày tạo).
9. **Audit log verification** — đăng nhập admin → /nhat-ky → kiểm tra entries CREATE/UPDATE/EXPORT cho resource "Người dùng" với badge action màu (CREATE green / UPDATE blue / EXPORT slate); click row mở Sheet detail xem JSON diff (password=[redacted] cho CREATE; before/after key-by-key cho UPDATE; tempPassword KHÔNG xuất hiện trong reset-password entries).
10. **RBAC negative test** — đăng nhập `donvi1/Donvi@123` → sidebar KHÔNG hiển thị "Người dùng"; truy cập trực tiếp `/nguoi-dung` → middleware/RSC redirect về `/de-an` (DONVI default landing).

## Next Phase Readiness

**Plan 02-05 (Role & Permission Matrix) ready to consume:**

- User list từ DB qua `listUsers({roles:['ADMIN'|...]})` để hiển thị "Users với vai trò X" trong matrix grid
- `bulkChangeRole(ids, newRole)` server action có thể reuse cho "Bulk change role from matrix" UX nếu cần
- Audit log entries cho `nguoi-dung` resource đã có pattern reference cho `vai-tro` resource cùng chuẩn

**Plan 03+ (Phase 3 Chu kỳ chương trình + Phase 5 Đề án etc.) ready to consume:**

- `prisma.user.findMany({where:{isActive:true, role:'CHUYENVIEN'}})` cho dropdown "Phân công chuyên viên kiểm tra"
- `prisma.user.findMany({where:{isActive:true, role:'HOIDONG'}})` cho thành viên hội đồng
- `prisma.user.findMany({where:{isActive:true, role:{in:['BANQL','LANHDAO']}}})` cho người ký quyết định

**Patterns reusable cho mọi CRUD entity Phase 4-9:**

1. **Server action conventions:** `'use server'` files chỉ async exports + sibling utils module cho helpers + RBAC dòng 1-2 + Zod parse + explicit field whitelist + withAuditLog wrap với captureBefore/After redact
2. **List page conventions:** RSC defense-in-depth RBAC + initial data prefetch + URL search params filter + TanStack Query với initialData hydration + DataTable + sticky bulk actions
3. **Form page conventions:** RSC RBAC + prefetch dropdowns + client RHF với zodResolver + UserFormFields-style shared field component + redirect + toast feedback

**No blockers.** Plan 02-05 (role-permission-matrix) có thể tiếp tục Wave 2.

## Threat Flags

None mới ngoài threat_model đã document. Existing mitigations:

- T-02-04-01 E (Authorization bypass): mọi server action `auth() + can()` dòng đầu ✓
- T-02-04-02 E (Privilege escalation): updateUser/bulkChangeRole có ADMIN promotion guard + self-role-change guard ✓
- T-02-04-03 T (Mass assignment): Zod parse strips unknown + explicit field whitelist trong Prisma create/update ✓
- T-02-04-04 I (Temp password leak): captureAfter chỉ `{passwordReset:true}` flag; tempPassword chỉ trả về client 1 lần ✓
- T-02-04-05 T (SQL injection): Prisma `contains` parameterized ✓
- T-02-04-06 I (CSV/Excel formula injection): xlsx XLSX format binary, không evaluate raw string formulas — accept per plan, defer production fix ✓
- T-02-04-07 D (Bulk OOM): MAX_BULK_IDS=100 cap với throw early ✓
- T-02-04-08 E (Lock-self lockout): server throw + bulk filter-out-self + UI disable ✓

## Self-Check

Verifying claims before completion.

**Files created (18):**
- FOUND: `app/(app)/nguoi-dung/_actions/{schemas,list,create,update,lock,reset-password,password-utils,export}.ts` (8)
- FOUND: `app/(app)/nguoi-dung/page.tsx`
- FOUND: `app/(app)/nguoi-dung/_components/{UserFilterBar,UserTable,ResetPasswordDialog,UserFormFields}.tsx` (4)
- FOUND: `app/(app)/nguoi-dung/new/{page,_client}.tsx` (2)
- FOUND: `app/(app)/nguoi-dung/[id]/edit/{page,_client}.tsx` (2)
- FOUND: `components/ui/switch.tsx`

**Commits in git log:**
- FOUND: `094950d` (Task 1: server actions)
- FOUND: `2955a60` (Task 2: list page + components)
- FOUND: `86e6d96` (Task 3: new + edit pages + UserFormFields)

**Behavioral smoke tests passed:**
- 5 samples `generateTempPassword()` đều 12 chars với lower/upper/digit/symbol all true ✓
- DB count 8 users từ seed verified via prisma.user.count() ✓
- xlsx package generates valid Excel buffer (16263 bytes, magic bytes 0x504B PK ZIP) ✓
- All 6 server action files có `'use server'` first line ✓
- All 6 mutation actions có `withAuditLog` wrap (createUser/updateUser/lockUser/unlockUser/resetPassword/exportUsersExcel) ✓
- All actions có RBAC `can(role, 'nguoi-dung', action)` dòng 2-3 ✓
- `session.user.id` self-check appears 5 times in lock.ts + 1 in update.ts ✓
- Password redaction string `[redacted]` appears in create.ts ✓
- Page heading "Quản lý người dùng" appears 2 times trong page.tsx (h1 + metadata) ✓

**Phase verification:**
- `npm run typecheck` → exit 0 ✓
- `npm run lint` → only pre-existing prisma/seed warnings out of scope ✓
- `npm run build` → exit 0; routes `/nguoi-dung` 67.9 kB + `/nguoi-dung/new` 1.24 kB + `/nguoi-dung/[id]/edit` 1.51 kB compile pass ✓

## Self-Check: PASSED

---

*Phase: 02-m1-quan-tri-danh-muc*
*Completed: 2026-04-30*
