---
phase: 02-m1-quan-tri-danh-muc
plan: 05
subsystem: rbac
tags: [rbac, matrix-grid, optimistic-ui, custom-role, dynamic-permissions, accordion]
requirements: [ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05, ROLE-06, ROLE-07]
dependency-graph:
  requires:
    - 02-01 (withAuditLog wrapper, audit-types AUDIT_RESOURCE_LABELS)
    - 02-03 (ConfirmDialog + useConfirmDialog imperative hook, EmptyState)
    - 02-04 (form/dialog patterns reuse: RHF + Zod resolver, server-action+useMutation flow)
  provides:
    - "lib/permissions-db.canFromDB(roleCode, resource, action) — DB-backed permission check với 30s TTL cache + static MATRIX fallback"
    - "lib/permissions-db.loadPermissionsForRole(roleCode) — Set<permissionCode> per role"
    - "lib/permissions-db.invalidatePermissionsCache() — clear cache sau grant/revoke"
    - "lib/permissions.MATRIX_FOR_SEED + ALL_ACTIONS — seed/admin re-sync exports"
    - "prisma/seed/permissions.seedPermissions(prisma) — idempotent 7 roles + 144 permissions + 108 grants"
    - "app/(app)/vai-tro page — Tabs (Role list cards + Permission Matrix Grid)"
    - "5 server actions: grantPermission, revokePermission, createCustomRole, updateCustomRole, deleteCustomRole, seedPermissionsFromMatrix"
  affects:
    - "Phase 3+ server actions có thể chuyển từ can() static sang canFromDB() khi cần áp dụng admin override ngay"
    - "Phase 2-07 system-config có thể reuse Tabs primitive vừa thêm"
tech-stack:
  added:
    - "shadcn ui/tabs.tsx (radix-ui Tabs primitive)"
    - "shadcn ui/accordion.tsx (radix-ui Accordion primitive)"
    - "shadcn ui/textarea.tsx (native textarea với shadcn styling)"
  patterns:
    - "Optimistic UI: useMutation onMutate flips local state + onError rollback + 600ms red flash"
    - "DB-backed RBAC với in-memory cache 30s TTL + invalidate sau mutations + fallback static MATRIX nếu DB lỗi"
    - "Accordion grouping cho high-cardinality grids (1008 cells → 18 mini-tables 56 cells mỗi)"
    - "Idempotent seed qua upsert {where:{code}} — re-run không nhân bản rows"
    - "TanStack Query initialData từ RSC pre-fetch (client query không re-run cho first paint)"
key-files:
  created:
    - "lib/permissions-db.ts"
    - "prisma/seed/permissions.ts"
    - "app/(app)/vai-tro/page.tsx"
    - "app/(app)/vai-tro/_actions/schemas.ts"
    - "app/(app)/vai-tro/_actions/list.ts"
    - "app/(app)/vai-tro/_actions/grant.ts"
    - "app/(app)/vai-tro/_actions/custom-role.ts"
    - "app/(app)/vai-tro/_actions/seed-from-matrix.ts"
    - "app/(app)/vai-tro/_components/MatrixCell.tsx"
    - "app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx"
    - "app/(app)/vai-tro/_components/CustomRoleDialog.tsx"
    - "app/(app)/vai-tro/_components/RoleListCard.tsx"
    - "app/(app)/vai-tro/_components/VaiTroPageShell.tsx"
    - "components/ui/tabs.tsx"
    - "components/ui/accordion.tsx"
    - "components/ui/textarea.tsx"
  modified:
    - "lib/permissions.ts (export ALL_ACTIONS + MATRIX_FOR_SEED)"
    - "prisma/seed.ts (gọi seedPermissions() + RBAC count assertions)"
decisions:
  - "Static MATRIX (lib/permissions.ts) giữ vai trò source-of-truth tại seed time + fallback cho canFromDB; DB Role+Permission+RolePermission là override layer admin chỉnh được. Phase 3+ tuỳ context dùng can() static (95% server actions, fast) hoặc canFromDB (khi cần áp dụng admin override ngay)"
  - "Matrix grid: 18 accordion sections × (7+ roles × 8 actions = 56-cell mini-table) thay vì 1 grid 1008 cells — UX scrolling khả thi, mental model 'tôi cần phân quyền cho phân hệ X' rõ ràng"
  - "ADMIN role bảo vệ 2 lớp: (1) UI MatrixCell disabled khi roleCode==='ADMIN' với tooltip; (2) server action grantPermissionImpl throw 'Không thể thu hồi quyền của vai trò Quản trị viên hệ thống' khi parsed.granted===false — defense in depth (T-02-05-02)"
  - "Revoke = upsert {granted: false} (không delete row) để giữ history; on re-grant upsert update lại true. Nếu chưa có row thì create với granted=false (RolePermission row mới đại diện 'explicit deny')"
  - "Cache 30s TTL cho canFromDB với invalidatePermissionsCache() gọi sau mỗi grant/revoke — production phase 2 sẽ thay Redis pub/sub (multi-instance invalidation)"
  - "Seed-from-matrix server action wraps prisma/seed/permissions.ts seedPermissions() — admin re-sync DB về MATRIX defaults; không xóa custom roles hoặc grants ngoài MATRIX để tránh data loss"
  - "TabsPrimitive + AccordionPrimitive viết tay theo radix-ui meta-package pattern (đã dùng cho Dialog) thay vì npx shadcn add — npm registry không phụ thuộc, consistent với existing Dialog/AlertDialog wrapping style"
metrics:
  duration: "11m"
  completed: "2026-04-30"
  tasks: 3
  commits: 3
  files_created: 16
  files_modified: 2
---

# Phase 2 Plan 05: Role & Permission Matrix Summary

**One-liner:** RBAC matrix grid 18×8×7+ configurable bằng UI với optimistic checkbox tick + canFromDB DB-backed check + custom role CRUD; seed 144 permissions + 108 grants từ static MATRIX.

## Goal Achieved

ROLE-01..07 đạt: list 7 system + custom roles card view, custom role create/edit/delete dialog, matrix grid 18 resources × 8 actions × 7+ roles, grant/revoke optimistic UI + audit log mỗi mutation, sidebar re-render qua revalidatePath('/'), server action authoritative reject mọi grant/revoke từ non-admin role. ADMIN bị bảo vệ 2 lớp (UI disable + server throw) chống privilege escalation.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Seed Role+Permission từ MATRIX + lib/permissions-db.ts canFromDB | 260439e | prisma/seed/permissions.ts, lib/permissions-db.ts, lib/permissions.ts (export), prisma/seed.ts |
| 2 | Server actions grant/revoke + custom role CRUD + schemas | 1e5cb8f | app/(app)/vai-tro/_actions/{schemas,list,grant,custom-role,seed-from-matrix}.ts |
| 3 | Page UI — Tabs (RoleListCard + PermissionMatrixGrid + CustomRoleDialog) | 3b73542 | app/(app)/vai-tro/page.tsx + 5 components + 3 shadcn primitives (tabs/accordion/textarea) |

## Verification Results

- `npm run db:seed` → "Roles: 7", "Permissions: 144", "RolePermissions (granted): 108" — assertions trong prisma/seed.ts pass (`roleCount === 7`, `permissionCount === 144`, `grantCount ≥ 50`)
- Idempotency: re-run seed counts unchanged (7/144/108)
- `npx tsc --noEmit` exit 0
- `npm run lint` chỉ warnings (no errors): 1 warning trong RoleListCard (unused 'Role' import — fixed) + 9 console warnings legacy trong prisma/seed
- `npm run build` exit 0; `/vai-tro` route 11kB (193kB First Load JS)
- Smoke test: `canFromDB('CHUYENVIEN','tham-dinh','score')` returns false trước grant, true sau grant + cache invalidate, false sau revoke. Custom role create lifecycle (8 → 9 → 8 roles) với cleanup OK.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing shadcn UI primitives (tabs, accordion, textarea)**
- **Found during:** Task 3 (Page UI build)
- **Issue:** Plan instructions say `npx shadcn add tabs accordion`, but package.json không list `@radix-ui/react-tabs` etc. — radix-ui meta-package `^1.4.3` đã có sẵn (consistent với existing Dialog/AlertDialog primitives)
- **Fix:** Viết tay 3 primitives theo radix-ui meta-package pattern (consistent với components/ui/dialog.tsx style). No npm install needed — radix-ui meta-package đã expose all primitives.
- **Files modified:** components/ui/tabs.tsx, components/ui/accordion.tsx, components/ui/textarea.tsx
- **Commit:** 3b73542

**2. [Rule 1 - Bug] EmptyState icon='shield-plus' không tồn tại trong whitelist**
- **Found during:** Task 3 (RoleListCard build)
- **Issue:** Plan đề xuất `<EmptyState icon="shield-plus" />` cho empty custom roles state, nhưng EmptyState ICON_MAP chỉ whitelist 10 icons (T-02-03-06 bundle bloat mitigation từ Plan 02-03) — `shield-plus` chưa có
- **Fix:** Đổi sang `icon="shield"` (đã có trong whitelist)
- **Files modified:** app/(app)/vai-tro/_components/RoleListCard.tsx
- **Commit:** 3b73542

**3. [Rule 1 - TypeScript strict] action prop type mismatch**
- **Found during:** Task 3 typecheck
- **Issue:** MatrixCell `action: string` prop được pass vào `grantPermission({action})` schema enum → TS2322 error
- **Fix:** Export `MatrixActionKey` union type từ MatrixCell, import + áp vào ACTIONS array literal trong PermissionMatrixGrid
- **Files modified:** MatrixCell.tsx, PermissionMatrixGrid.tsx
- **Commit:** 3b73542

**4. [Rule 1 - TypeScript strict] SECTION_LABEL[key] returns string | undefined**
- **Found during:** Task 3 typecheck
- **Issue:** `Record<string, string>` indexing với arbitrary key returns `string | undefined` per TS strict mode — `title` prop expects `string`
- **Fix:** Inline string literal "Nghiệp vụ" / "Quản trị" thay vì lookup map (chỉ 2 sections, complexity overhead không xứng)
- **Files modified:** PermissionMatrixGrid.tsx
- **Commit:** 3b73542

### CLAUDE.md Compliance

- Tất cả UI text tiếng Việt formal (CLAUDE.md §8.1): "Vai trò & Phân quyền", "Vai trò hệ thống" / "Vai trò tùy chỉnh", "Đã cấp" / "Chưa cấp", "Bạn có chắc chắn muốn xóa..."
- Code identifier tiếng Anh (camelCase) — toàn bộ types/functions/components
- Comment WHY (không "Added for sprint X")
- Server action mutation wrapped withAuditLog (per Phase 2 convention từ Plan 02-01)
- Component files < 300 dòng (PermissionMatrixGrid.tsx ~250 dòng — borderline, nhưng tách subcomponent đã làm với SectionGroup + ResourceAccordionItem)
- Mock data realistic: ROLE_LABELS Việt formal, role description "Vai trò hệ thống: {label}"

## Threat Model Mitigations

| Threat ID | Mitigation Implementation |
|-----------|---------------------------|
| T-02-05-01 (Authorization bypass) | All 6 mutations check `auth() + can(role, 'vai-tro', action)` ở line 1-2 mỗi impl function; throw VN message |
| T-02-05-02 (Admin self-revoke) | grantPermissionImpl: `if (parsed.roleCode === ROLES.ADMIN && !parsed.granted) throw` (line 38-43); MatrixCell UI disabled khi roleCode==='ADMIN' |
| T-02-05-03 (Role code clash) | createCustomRoleImpl: `if (SYSTEM_ROLE_CODES.has(parsed.code)) throw`; Prisma @unique defense-in-depth |
| T-02-05-04 (Cache stale) | invalidatePermissionsCache() called sau mọi grant/revoke/create/delete custom role; 30s TTL fallback |
| T-02-05-05 (Permission disclosure) | listRoles + listMatrix check `can(role, 'vai-tro', 'read')` ở đầu; non-admin throw |
| T-02-05-08 (XSS via custom role name) | React JSX auto-escape (no dangerouslySetInnerHTML); Zod max 100 chars |
| T-02-05-09 (Delete role with users) | deleteCustomRoleImpl: `if (userCount > 0) throw 'Vai trò đang được gán cho ${n} người dùng'` |

## Self-Check: PASSED

Files verified:
- FOUND: lib/permissions-db.ts
- FOUND: prisma/seed/permissions.ts
- FOUND: app/(app)/vai-tro/page.tsx
- FOUND: app/(app)/vai-tro/_actions/schemas.ts
- FOUND: app/(app)/vai-tro/_actions/list.ts
- FOUND: app/(app)/vai-tro/_actions/grant.ts
- FOUND: app/(app)/vai-tro/_actions/custom-role.ts
- FOUND: app/(app)/vai-tro/_actions/seed-from-matrix.ts
- FOUND: app/(app)/vai-tro/_components/MatrixCell.tsx
- FOUND: app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx
- FOUND: app/(app)/vai-tro/_components/CustomRoleDialog.tsx
- FOUND: app/(app)/vai-tro/_components/RoleListCard.tsx
- FOUND: app/(app)/vai-tro/_components/VaiTroPageShell.tsx
- FOUND: components/ui/tabs.tsx
- FOUND: components/ui/accordion.tsx
- FOUND: components/ui/textarea.tsx

Commits verified:
- FOUND: 260439e (Task 1)
- FOUND: 1e5cb8f (Task 2)
- FOUND: 3b73542 (Task 3)

Build verified: `npm run build` exit 0; `/vai-tro` route compiled (11kB / 193kB First Load JS)
