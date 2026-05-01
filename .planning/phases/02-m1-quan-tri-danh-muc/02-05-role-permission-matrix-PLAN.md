---
phase: 02-m1-quan-tri-danh-muc
plan: 05
type: execute
wave: 2
depends_on: [01, 02, 03]
files_modified:
  - app/(app)/vai-tro/page.tsx
  - app/(app)/vai-tro/_components/RoleListCard.tsx
  - app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx
  - app/(app)/vai-tro/_components/MatrixCell.tsx
  - app/(app)/vai-tro/_components/CustomRoleDialog.tsx
  - app/(app)/vai-tro/_actions/list.ts
  - app/(app)/vai-tro/_actions/grant.ts
  - app/(app)/vai-tro/_actions/custom-role.ts
  - app/(app)/vai-tro/_actions/seed-from-matrix.ts
  - app/(app)/vai-tro/_actions/schemas.ts
  - lib/permissions-db.ts
  - prisma/seed/permissions.ts
  - prisma/seed.ts
autonomous: true
requirements: [ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05, ROLE-06, ROLE-07]
tags: [rbac, matrix-grid, optimistic-ui, custom-role, dynamic-permissions]

must_haves:
  truths:
    - "Admin (`admin/Admin@123`) thấy menu 'Vai trò & quyền' và truy cập /vai-tro được"
    - "Trang /vai-tro hiển thị 2 sections: List 7 vai trò seed + custom roles, và Permission Matrix Grid"
    - "Permission Matrix Grid: rows = 7 vai trò + custom roles; columns = 18 phân hệ × {Xem, Thêm, Sửa, Xóa, Phê duyệt, Phân công, Chấm điểm, Nộp} (8 actions). Cell = checkbox tick/untick"
    - "Click checkbox → optimistic UI flip ngay (instant feedback) → server action grant/revoke async; nếu fail → rollback + toast error"
    - "Mọi grant/revoke ghi audit log entry với resource='vai-tro' action='UPDATE' diff {role,resource,action,from,to}"
    - "Admin tạo custom role mới qua dialog (tên + mô tả) → role mới xuất hiện trong matrix với hàng riêng tick được tự do"
    - "lib/permissions-db.ts canFromDB(userId, resource, action) — đọc từ DB qua Role+RolePermission, fallback về MATRIX hardcode trong lib/permissions.ts nếu DB chưa seed (dev safety)"
    - "Seed permissions từ static MATRIX vào DB Role+Permission+RolePermission tables idempotent (chạy lại không nhân bản)"
    - "Sau khi admin thay đổi permission, sidebar và can() check phản ánh thay đổi sau revalidatePath('/') (cho 7 vai trò seed; custom role chưa assign user nào nên chưa cần test menu)"
    - "Server action authoritative: nếu admin tick xong, mở /vai-tro với role chuyenvien thì server reject mọi grant/revoke (can(role,'vai-tro','update')==false → throw)"
  artifacts:
    - path: "app/(app)/vai-tro/page.tsx"
      provides: "Role + matrix RSC page"
    - path: "app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx"
      provides: "Grid 7+ rows × 18×8 cells với optimistic UI"
    - path: "lib/permissions-db.ts"
      provides: "canFromDB(role, resource, action) đọc từ DB với fallback static MATRIX"
      exports: ["canFromDB", "loadPermissionsForRole", "invalidatePermissionsCache"]
    - path: "app/(app)/vai-tro/_actions/grant.ts"
      provides: "grantPermission, revokePermission, bulkGrantPermissions"
      exports: ["grantPermission", "revokePermission"]
    - path: "app/(app)/vai-tro/_actions/custom-role.ts"
      provides: "createCustomRole, updateCustomRole, deleteCustomRole"
      exports: ["createCustomRole", "updateCustomRole", "deleteCustomRole"]
    - path: "app/(app)/vai-tro/_actions/seed-from-matrix.ts"
      provides: "Server-callable seedPermissionsFromMatrix() để admin re-sync"
      exports: ["seedPermissionsFromMatrix"]
    - path: "prisma/seed/permissions.ts"
      provides: "seedPermissions() inserts 18×8=144 Permission rows + 7 Role rows + RolePermission grants từ static MATRIX"
      exports: ["seedPermissions"]
  key_links:
    - from: "app/(app)/vai-tro/_actions/grant.ts"
      to: "prisma.rolePermission upsert"
      via: "grant: upsert {roleId, permissionId, granted: true}; revoke: update granted=false"
      pattern: "rolePermission\\.(upsert|update|delete)"
    - from: "lib/permissions-db.ts canFromDB"
      to: "prisma.role.findUnique include permissions"
      via: "lookup role by code → load grants → check resource:action"
      pattern: "role\\.findUnique.*permissions"
    - from: "MatrixCell"
      to: "useMutation grantPermission/revokePermission"
      via: "TanStack Query useMutation với onMutate optimistic, onError rollback"
      pattern: "onMutate|onError"
    - from: "prisma/seed/permissions.ts"
      to: "lib/permissions.ts MATRIX (static)"
      via: "import MATRIX và iterate to seed"
      pattern: "from.*'@/lib/permissions'|MATRIX"
---

<objective>
Build Role management + Permission Matrix Grid UI configurable bằng UI (không hardcode) — wow factor cho IT team trong demo. Đồng thời seed permissions từ static MATRIX (lib/permissions.ts) vào DB Role+Permission+RolePermission tables để admin có data ban đầu chỉnh được.

Purpose: ROLE-01..07 là demo điểm chốt — peer quốc tế (Salesforce GM) có matrix UI nhưng không phải gov VN; demo "matrix configurable" thuyết phục IT team rằng kiến trúc RBAC linh hoạt. Plan 04 đã có user CRUD; plan này cho admin gán role + chỉnh permission của role. Plan 03+ phía sau sẽ dùng `canFromDB` để check (hoặc fallback MATRIX cho dev).

Output: 1 page với 2 sections (role list card view + matrix grid), 4 server actions, lib/permissions-db.ts, prisma seed permissions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/research/STACK.md
@.planning/research/PITFALLS.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@prisma/schema.prisma
@lib/permissions.ts
@lib/audit.ts
@lib/audit-types.ts
@lib/auth.ts
@lib/constants.ts
@components/shared/data-table/DataTable.tsx
@components/shared/ConfirmDialog.tsx
@components/shared/EmptyState.tsx

<interfaces>
From prisma/schema.prisma (Phase 1 already locked):
```prisma
model Role { id, code (unique), name, description?, isSystem (true=seed), permissions: RolePermission[] }
model Permission { id, code (unique "resource:action"), resource, action, name, roles: RolePermission[] }
model RolePermission { roleId, permissionId, granted (default true), @@id([roleId, permissionId]) }
```

From lib/permissions.ts (Phase 1):
```typescript
export const MATRIX: Record<Resource, Partial<Record<Action, Role[]>>>;
export type Resource; export type Action;
export function can(role: Role, resource: Resource, action: Action): boolean;
```

From lib/audit.ts (Plan 02-01):
```typescript
export const withAuditLog;
```

From components/shared (Plan 02-03): DataTable, ConfirmDialog, EmptyState

CONTEXT.md ROLE decisions:
- Custom role tạo được ngoài 7 seed
- Matrix grid 7+custom rows × 18 resources × 8 actions
- Cell checkbox tick/untick optimistic UI rollback nếu fail
- Audit log mỗi grant/revoke
- Sidebar re-fetch khi role permission đổi (TanStack Query invalidation)
- Authoritative server action verify từ DB
</interfaces>

<ui_design_contract>
REUSE Phase 1 UI-SPEC.md + Plan 02-03 shared components.

### Page layout (`/vai-tro`):
- Heading "Vai trò & Phân quyền" + description "Quản lý vai trò người dùng và ma trận phân quyền chi tiết"
- 2-tab navigation (shadcn Tabs): "Danh sách vai trò" | "Ma trận phân quyền"

### Tab 1 — Role List (RoleListCard):
- Grid card view: 3 cột `grid grid-cols-3 gap-4`
- Mỗi card hiển thị:
  - Header: `<Badge>System</Badge>` hoặc `<Badge variant="outline">Tùy chỉnh</Badge>`
  - Title: ROLE_LABELS[code] (ví dụ "Quản trị viên")
  - Description: role.description hoặc placeholder "Vai trò hệ thống mặc định"
  - Stats: "{N} người dùng" + "{N} quyền chức năng" (count user + count granted permissions)
  - Footer: button "Xem ma trận" (scroll tab matrix với highlight row), nếu custom role thêm button "Chỉnh sửa" + "Xóa"
- Top right: button "Tạo vai trò mới" (`lucide:plus`) → mở CustomRoleDialog

### Tab 2 — Permission Matrix Grid:
- Layout: horizontal scroll table với 2 axes
- Sticky header (top): 18 resources grouped by section ("Nghiệp vụ" / "Quản trị") với colspan + sub-header 8 actions per resource
  - Hoặc đơn giản hóa: column header "Phân hệ — Hành động" như "Đề án — Xem", "Đề án — Thêm", ... (144 cột tổng — quá rộng)
  - Quyết định: Render dạng accordion theo resource (hàng dọc), mỗi resource là 1 group có 8 columns (Xem/Thêm/Sửa/Xóa/Phê duyệt/Phân công/Chấm điểm/Nộp). User scroll ngang trong group hoặc collapse group.
  - Final layout: rows = roles (7+custom). Columns header: 1 col "Vai trò" + 8 col actions × 18 resource groups stacked vertically (split into 18 mini-tables). Each mini-table: heading (resource label) + table 7 rows × 8 cols.
  - Reasoning: 144 cells per row × 7+ rows = 1008+ checkboxes nếu dồn 1 grid → quá nặng UX. Split into 18 mini-grids (7×8 mỗi cái = 56 checkboxes/group) → manageable, accordion expand từng resource.

### MatrixCell:
- Wrapper `<button class="h-10 w-10 flex items-center justify-center hover:bg-slate-50">`
- Checkbox visual: `<lucide:check />` 16px text-blue-700 nếu granted; trống nếu không
- Disabled cho system role × ADMIN action (admin always all) hoặc combinations not in MATRIX (action not applicable to resource)
- Loading: pulsing skeleton `bg-slate-200` khi mutation in-flight
- Error rollback: brief flash red border 500ms

### CustomRoleDialog:
- shadcn Dialog
- Title: "Tạo vai trò mới" / "Chỉnh sửa vai trò {name}"
- Form fields:
  - "Mã vai trò *" (uppercase code, regex /^[A-Z][A-Z0-9_]+$/, vd "NHANVIEN_KHOI_TRUNG_TAM")
  - "Tên hiển thị *" (vd "Nhân viên khối Trung tâm")
  - "Mô tả" (textarea)
- Submit button "Tạo" / "Lưu" + Cancel "Hủy"

### Tone:
- "Vai trò hệ thống" / "Vai trò tùy chỉnh"
- "Đã cấp" / "Chưa cấp"
- "Bạn có chắc chắn muốn cấp quyền {action} cho phân hệ {resource} với vai trò {role}?"
</ui_design_contract>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Seed Role + Permission tables từ static MATRIX + lib/permissions-db.ts</name>
  <files>prisma/seed/permissions.ts, prisma/seed.ts, lib/permissions-db.ts</files>
  <read_first>
    - lib/permissions.ts (toàn bộ MATRIX + Resource + Action types + ROLE_LABELS reference)
    - prisma/schema.prisma Role/Permission/RolePermission models
    - prisma/seed/users.ts (idempotent upsert pattern reference)
    - lib/constants.ts ROLE_LABELS
  </read_first>
  <action>
    **`prisma/seed/permissions.ts`**:
    ```typescript
    import { prisma } from '../../lib/prisma';
    import { MATRIX, type Resource, type Action } from '../../lib/permissions';
    import { ROLES, ROLE_LABELS } from '../../lib/constants';
    import { logSeedStep } from './helpers';

    const ACTION_LABELS: Record<Action, string> = {
      read: 'Xem', create: 'Thêm', update: 'Sửa', delete: 'Xóa',
      submit: 'Nộp', approve: 'Phê duyệt', assign: 'Phân công', score: 'Chấm điểm',
    };
    const RESOURCE_LABELS: Record<Resource, string> = {
      // 18 entries — copy từ AUDIT_RESOURCE_LABELS (Plan 02-01)
    };

    export async function seedPermissions() {
      // 1. Seed 7 system roles
      for (const code of Object.values(ROLES)) {
        await prisma.role.upsert({
          where: { code },
          update: { name: ROLE_LABELS[code], isSystem: true },
          create: { code, name: ROLE_LABELS[code], isSystem: true,
            description: `Vai trò hệ thống: ${ROLE_LABELS[code]}` },
        });
      }
      // 2. Seed 144 permissions (18 resources × 8 actions)
      const allActions: Action[] = ['read','create','update','delete','submit','approve','assign','score'];
      const allResources = Object.keys(MATRIX) as Resource[];
      for (const resource of allResources) {
        for (const action of allActions) {
          const code = `${resource}:${action}`;
          await prisma.permission.upsert({
            where: { code },
            update: { resource, action, name: `${RESOURCE_LABELS[resource]} — ${ACTION_LABELS[action]}` },
            create: { code, resource, action, name: `${RESOURCE_LABELS[resource]} — ${ACTION_LABELS[action]}` },
          });
        }
      }
      // 3. Seed RolePermission grants from MATRIX
      for (const resource of allResources) {
        const resourceMatrix = MATRIX[resource];
        for (const action of allActions) {
          const grantedRoles = resourceMatrix?.[action] ?? [];
          const permission = await prisma.permission.findUnique({where: {code: `${resource}:${action}`}});
          if (!permission) continue;
          for (const roleCode of grantedRoles) {
            const role = await prisma.role.findUnique({where:{code: roleCode}});
            if (!role) continue;
            await prisma.rolePermission.upsert({
              where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
              update: { granted: true },
              create: { roleId: role.id, permissionId: permission.id, granted: true },
            });
          }
        }
      }
      logSeedStep('Roles', await prisma.role.count());
      logSeedStep('Permissions', await prisma.permission.count());
      logSeedStep('RolePermissions (granted)', await prisma.rolePermission.count({where:{granted:true}}));
    }
    ```

    **Update `prisma/seed.ts`** to call `seedPermissions()` after `seedCatalogs()`:
    ```typescript
    await seedOrganizations();
    await seedUsers();
    await seedCatalogs();
    await seedPermissions(); // NEW
    ```

    **`lib/permissions-db.ts`** — DB-backed permission check với cache:
    ```typescript
    import { prisma } from './prisma';
    import { can as canStatic } from './permissions';
    import type { Resource, Action } from './permissions';
    import type { Role } from './constants';

    // In-memory cache (server-only, dev-safe; production phase 2 will use Redis)
    type Cache = Map<string, Set<string>>; // role code -> Set of "resource:action"
    const cache: Cache = new Map();
    let cacheLoadedAt: number | null = null;
    const CACHE_TTL_MS = 30_000; // 30s

    export async function loadPermissionsForRole(roleCode: string): Promise<Set<string>> {
      const now = Date.now();
      if (cacheLoadedAt && now - cacheLoadedAt < CACHE_TTL_MS && cache.has(roleCode)) {
        return cache.get(roleCode)!;
      }
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
        include: { permissions: { where: { granted: true }, include: { permission: true } } },
      });
      if (!role) return new Set();
      const set = new Set<string>(role.permissions.map(rp => rp.permission.code));
      cache.set(roleCode, set);
      cacheLoadedAt = now;
      return set;
    }

    export async function canFromDB(roleCode: string, resource: Resource, action: Action): Promise<boolean> {
      try {
        const grants = await loadPermissionsForRole(roleCode);
        return grants.has(`${resource}:${action}`);
      } catch (err) {
        // Fallback to static MATRIX nếu DB chưa seed hoặc connection lỗi (dev safety)
        console.error('[permissions-db] fallback to static MATRIX:', err);
        return canStatic(roleCode as Role, resource, action);
      }
    }

    export function invalidatePermissionsCache(): void {
      cache.clear();
      cacheLoadedAt = null;
    }
    ```

    Note WHY: "30s TTL cache cho dev — Plan 03+ server actions có thể call canFromDB nhiều lần per request; production sẽ thay bằng Redis."

    **DECISION DOCUMENTED:** Plan 04 (user mgmt) đang dùng `can()` static. Plan 02-05 thêm `canFromDB`. Phase 3+ sẽ chọn 1 trong 2:
    - Static `can()` cho 95% server actions (fast, no DB query)
    - `canFromDB()` chỉ khi admin đã thay đổi permission qua matrix UI và cần áp dụng ngay
    Quyết định: keep both. lib/permissions.ts MATRIX là source of truth khi seed; DB là override layer chỉ apply nếu admin chỉnh.
  </action>
  <acceptance_criteria>
    - `npm run db:seed` exit 0; log shows "Roles 7", "Permissions 144" (18×8), "RolePermissions (granted) ≈ 80-100" (sum of MATRIX entries)
    - Idempotent: chạy lần 2 counts unchanged
    - `prisma.role.findUnique({where:{code:'ADMIN'}, include:{permissions:{include:{permission:true}}}})` returns role với ≥18 grants (admin có quyền mọi resource ít nhất read)
    - `prisma.role.findUnique({where:{code:'DONVI'}, include:{permissions:{include:{permission:true}}}})` returns DONVI với 6-10 grants (de-an, don-vi-chu-tri, bao-cao, ...)
    - `lib/permissions-db.ts` exports đúng 3 functions: `canFromDB`, `loadPermissionsForRole`, `invalidatePermissionsCache`
    - `npx tsc --noEmit` exit 0
    - Smoke: `tsx -e "import {canFromDB} from './lib/permissions-db'; canFromDB('ADMIN','de-an','read').then(console.log)"` → true
    - `tsx -e "import {canFromDB} from './lib/permissions-db'; canFromDB('DONVI','phe-duyet','approve').then(console.log)"` → false
  </acceptance_criteria>
  <verify>
    <automated>npm run db:seed && npx tsc --noEmit</automated>
  </verify>
  <done>Roles+Permissions seeded từ MATRIX, idempotent, lib/permissions-db.ts canFromDB hoạt động với fallback static.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Server actions grant/revoke + custom role CRUD + schemas</name>
  <files>app/(app)/vai-tro/_actions/schemas.ts, app/(app)/vai-tro/_actions/list.ts, app/(app)/vai-tro/_actions/grant.ts, app/(app)/vai-tro/_actions/custom-role.ts, app/(app)/vai-tro/_actions/seed-from-matrix.ts</files>
  <read_first>
    - prisma/schema.prisma Role/Permission/RolePermission
    - lib/audit.ts withAuditLog
    - lib/permissions.ts can() (static, dùng để verify admin có quyền 'vai-tro:update')
    - lib/permissions-db.ts (Task 1) invalidatePermissionsCache
  </read_first>
  <action>
    **`schemas.ts`** (pure Zod):
    ```typescript
    export const grantPermissionSchema = z.object({
      roleCode: z.string().min(1),
      resource: z.string().min(1),
      action: z.enum(['read','create','update','delete','submit','approve','assign','score']),
      granted: z.boolean(),
    });
    
    export const customRoleSchema = z.object({
      code: z.string().regex(/^[A-Z][A-Z0-9_]+$/, 'Mã vai trò chỉ chữ in hoa, số, gạch dưới'),
      name: z.string().min(2).max(100),
      description: z.string().max(500).optional(),
    });
    ```

    **`list.ts`** — `'use server'`:
    - `listRoles()`: returns all Role with `_count.permissions` (granted) + count user assigned (`prisma.user.count({where:{role: role.code}})`)
    - `listMatrix()`: returns `{ roles: Role[], permissions: Permission[], grants: { [roleCode]: Set<permissionCode> } }`. Use `prisma.role.findMany({include:{permissions:{where:{granted:true}, select:{permission:{select:{code:true}}}}}})`. Map to `grants[roleCode] = new Set(...)`.
    Both check `can(session.user.role, 'vai-tro', 'read')`.

    **`grant.ts`** — 2 server actions wrapped withAuditLog:
    ```typescript
    'use server';
    async function grantPermissionImpl(input: GrantInput) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'vai-tro', 'update')) throw new Error('Bạn không có quyền');
      const parsed = grantPermissionSchema.parse(input);
      const role = await prisma.role.findUnique({where:{code:parsed.roleCode}});
      if (!role) throw new Error('Vai trò không tồn tại');
      // System role ADMIN never revoked - protect critical ops
      if (role.code === 'ADMIN' && !parsed.granted) {
        throw new Error('Không thể thu hồi quyền của vai trò Quản trị viên hệ thống');
      }
      const permission = await prisma.permission.findUnique({where:{code:`${parsed.resource}:${parsed.action}`}});
      if (!permission) throw new Error('Quyền không tồn tại');
      const before = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id }}
      });
      const result = parsed.granted
        ? await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id }},
            update: { granted: true },
            create: { roleId: role.id, permissionId: permission.id, granted: true },
          })
        : await prisma.rolePermission.update({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id }},
            data: { granted: false },
          });
      // Invalidate cache so canFromDB picks up new grants on next call
      invalidatePermissionsCache();
      revalidatePath('/vai-tro');
      revalidatePath('/'); // sidebar re-render với getMenuItems mới
      return { roleCode: parsed.roleCode, resource: parsed.resource, action: parsed.action, granted: parsed.granted };
    }
    
    export const grantPermission = withAuditLog(
      { action: 'UPDATE', resource: 'vai-tro',
        captureBefore: ([input]) => ({granted: false}), // simplified
        captureAfter: (result) => result },
      grantPermissionImpl
    );
    
    export const revokePermission = (input) => grantPermission({...input, granted: false});
    ```

    **`custom-role.ts`**:
    - `createCustomRole({code, name, description})`:
      - RBAC check
      - Validate code không trùng với system roles (`Object.values(ROLES).includes(code)` → throw "Mã trùng với vai trò hệ thống")
      - Check unique
      - `prisma.role.create({data: {code, name, description, isSystem: false}})`
      - revalidatePath
    - `updateCustomRole(id, {name, description})`: chỉ cho phép update non-system role; throw nếu role.isSystem
    - `deleteCustomRole(id)`: chỉ non-system; check không có user assigned (`prisma.user.count({where:{role:role.code}})` = 0); cascade delete RolePermission; revalidatePath
    All wrapped withAuditLog.

    **`seed-from-matrix.ts`**:
    - `seedPermissionsFromMatrix()`: server-callable wrapper gọi `seedPermissions()` từ prisma/seed/permissions.ts (Task 1) — admin có thể click "Re-sync from MATRIX" để reset DB grants về static state nếu cần. Wrap withAuditLog action='UPDATE'. Confirm trên UI bằng ConfirmDialog destructive.
  </action>
  <acceptance_criteria>
    - 5 files tạo, 4 file `'use server'`, 1 schemas pure
    - `grep "withAuditLog" app/(app)/vai-tro/_actions/*.ts | wc -l` ≥ 5 (mọi mutation wrap)
    - `grep "can(.*'vai-tro'" app/(app)/vai-tro/_actions/*.ts | wc -l` ≥ 5
    - `grep "invalidatePermissionsCache" app/(app)/vai-tro/_actions/grant.ts` returns 1
    - `grep "revalidatePath\\('/'\\)\\|revalidatePath\\('/vai-tro'\\)" app/(app)/vai-tro/_actions/grant.ts` returns ≥1
    - `grep "ADMIN.*Không thể\\|isSystem" app/(app)/vai-tro/_actions/grant.ts` returns ≥1 (admin protection)
    - Smoke: gọi `grantPermission({roleCode:'CHUYENVIEN', resource:'tham-dinh', action:'score', granted:true})` từ tsx → DB có RolePermission record; `canFromDB('CHUYENVIEN','tham-dinh','score')` returns true. Sau revoke, returns false.
    - Smoke: gọi `createCustomRole({code:'NHANVIEN_NHAP', name:'Nhân viên nhập liệu'})` → role.count tăng 7 → 8; sau cleanup deleteCustomRole.
    - `npx tsc --noEmit` exit 0
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "withAuditLog" "app/(app)/vai-tro/_actions/grant.ts" "app/(app)/vai-tro/_actions/custom-role.ts" "app/(app)/vai-tro/_actions/seed-from-matrix.ts"</automated>
  </verify>
  <done>4 server actions grant/revoke/custom-role/seed, RBAC + audit + cache invalidation, ADMIN bảo vệ không revoke được.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Page UI — Tabs (RoleListCard + PermissionMatrixGrid + CustomRoleDialog)</name>
  <files>app/(app)/vai-tro/page.tsx, app/(app)/vai-tro/_components/RoleListCard.tsx, app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx, app/(app)/vai-tro/_components/MatrixCell.tsx, app/(app)/vai-tro/_components/CustomRoleDialog.tsx</files>
  <read_first>
    - components/ui/tabs.tsx (install nếu chưa: `npx shadcn add tabs accordion`)
    - components/shared/ConfirmDialog.tsx, EmptyState.tsx
    - app/(app)/vai-tro/_actions/list.ts, grant.ts, custom-role.ts (Task 2)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (ROLE decisions: matrix optimistic UI, sidebar re-fetch)
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (color/spacing/tone)
  </read_first>
  <action>
    Cài shadcn nếu thiếu: `npx shadcn add tabs accordion`

    **`page.tsx`** — Server Component:
    - auth() + can() check
    - Pre-fetch matrix qua `listMatrix()`
    - Heading "Vai trò & Phân quyền" + description
    - Render `<Tabs defaultValue="roles">` với 2 panels: "Danh sách vai trò" (`<RoleListCard />`) + "Ma trận phân quyền" (`<PermissionMatrixGrid initialData={matrix} />`)
    - Top right global: button "Tạo vai trò mới" (chỉ hiển thị tab roles) + button "Re-sync từ mặc định" (icon refresh, mở ConfirmDialog destructive)

    **`RoleListCard.tsx`** — `'use client'`:
    - useQuery(['roles']) gọi `listRoles()`
    - Grid 3 cột (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
    - Mỗi role render Card với:
      - Header: Badge "Hệ thống" (slate) hoặc "Tùy chỉnh" (blue) + title (ROLE_LABELS[code] hoặc role.name)
      - Body: description, stats "{N} người dùng / {M} quyền"
      - Footer: "Xem ma trận" (scroll/highlight in tab 2) + nếu custom: "Chỉnh sửa" (mở CustomRoleDialog edit) + "Xóa" (ConfirmDialog destructive — gọi deleteCustomRole)
    - Empty state nếu 0 custom roles: "Chưa có vai trò tùy chỉnh"
    - "Tạo vai trò mới" button mở CustomRoleDialog create

    **`PermissionMatrixGrid.tsx`** — `'use client'`:
    - useQuery(['matrix']) initial = pre-fetched data
    - Wrapper layout: vertical stack of 18 resource sections (1 per resource)
    - Mỗi section là Accordion (shadcn) closed by default; click expand show table:
      - Header row: "Vai trò" + 8 action columns ("Xem", "Thêm", "Sửa", "Xóa", "Phê duyệt", "Phân công", "Chấm điểm", "Nộp")
      - Body: 7+ rows (1 per role). Cell = `<MatrixCell roleCode resource action granted onToggle />`
    - Section header: resource label + count grants stat "{n} ô đã cấp / {7×8=56}"
    - Sticky search filter "Tìm phân hệ" trên đầu — filter sections by resource label

    **`MatrixCell.tsx`** — `'use client'`:
    - Props: `{roleCode, resource, action, granted, onToggle: (newGranted: boolean) => Promise<void>}`
    - useMutation với:
      - onMutate: optimistic UI flip — set local state granted = !granted, return rollback function
      - onError: revert local state + sonner toast.error error.message
      - onSuccess: queryClient.invalidateQueries(['matrix'])
    - Render button:
      - `<button onClick={() => mutation.mutate({...})} disabled={mutation.isPending} className={cn("h-10 w-10", granted && "text-blue-700", mutation.isPending && "animate-pulse")}>`
      - Icon: `<lucide:check />` nếu granted, trống nếu không
      - Disable khi roleCode='ADMIN' (admin always granted, không cho revoke)
      - Confirmation: NO confirm dialog cho click — optimistic UI tốc độ; chỉ confirm khi role là DONVI và action là 'delete' on critical resources (vd 'de-an:delete') — defer cho POC, không enforce confirm.

    **`CustomRoleDialog.tsx`** — `'use client'`:
    - Props: `{ mode: 'create' | 'edit'; role?: Role; open; onOpenChange }`
    - shadcn Dialog với form RHF + Zod
    - Fields: code (disabled khi edit), name, description (textarea)
    - Submit: createCustomRole hoặc updateCustomRole → toast → close → invalidate ['roles']
    - Loading state spinner trên submit button
  </action>
  <acceptance_criteria>
    - 5 components tạo
    - `app/(app)/vai-tro/page.tsx` có Tabs với 2 trigger labels "Danh sách vai trò" + "Ma trận phân quyền"
    - `grep "useMutation\\|onMutate" app/(app)/vai-tro/_components/MatrixCell.tsx` returns ≥2 (optimistic)
    - `grep "ROLE_LABELS\\|listRoles" app/(app)/vai-tro/_components/RoleListCard.tsx` returns ≥2
    - `grep "Accordion\\|18\\|resource" app/(app)/vai-tro/_components/PermissionMatrixGrid.tsx` returns ≥3
    - `grep "createCustomRole\\|updateCustomRole" app/(app)/vai-tro/_components/CustomRoleDialog.tsx` returns ≥2
    - `grep "Hệ thống\\|Tùy chỉnh" app/(app)/vai-tro/_components/RoleListCard.tsx` returns ≥1 (Vietnamese badges)
    - `npm run typecheck && npm run lint && npm run build` exit 0
    - Smoke manual: `npm run dev` → admin → /vai-tro tab "Ma trận phân quyền" → mở section "Đề án" → click cell CHUYENVIEN × Phê duyệt (chưa cấp) → optimistic UI flip ngay → audit log có entry; refresh trang giữ state (DB persisted).
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <done>2-tab page (role list cards + matrix accordion grid 18 sections), optimistic UI cell click, custom role CRUD dialog. Vietnamese tone formal.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Admin browser → grant/revoke server action | Admin tick checkbox; risk privilege escalation nếu không validate |
| MATRIX static fallback → DB override | DB là override layer; risk drift giữa MATRIX và DB nếu seed lỗi |
| Custom role creation | Admin tự định nghĩa role mới — risk role với code trùng system role |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-05-01 | E (Authorization bypass) | grantPermission/revokePermission | mitigate | First 2 lines `auth()` + `can(role, 'vai-tro', 'update')`; throw VN message; chỉ ADMIN có quyền |
| T-02-05-02 | E (Privilege escalation — admin self-revoke) | grantPermission | mitigate | Hardcoded check: `if (role.code === 'ADMIN' && !granted) throw 'Không thể thu hồi quyền ADMIN'`; UI disable cell với tooltip |
| T-02-05-03 | T (Role code clash) | createCustomRole | mitigate | `Object.values(ROLES).includes(input.code)` → throw "Mã trùng với vai trò hệ thống"; Prisma `@unique` constraint là defense thứ 2 |
| T-02-05-04 | T (Cache stale) | canFromDB cache TTL | mitigate | 30s TTL + `invalidatePermissionsCache()` gọi sau mọi grant/revoke; production phase 2 sẽ thay Redis pub/sub |
| T-02-05-05 | I (Permission disclosure to non-admin) | listMatrix | mitigate | RBAC check `can(role, 'vai-tro', 'read')` ở đầu — chỉ admin/lãnh đạo (per MATRIX); non-admin gọi → throw |
| T-02-05-06 | T (Concurrent grant race) | optimistic UI MatrixCell | accept | TanStack Query cancellation prevent stale; nếu admin tick từ 2 tabs cùng lúc → last-write-wins; POC scope acceptable |
| T-02-05-07 | E (Custom role assigned ADMIN-level perms by accident) | grant on custom role | accept | Custom role có thể được grant bất kỳ permission nào; admin chịu trách nhiệm đánh giá; UI hiển thị warning khi grant 'delete' on user resource |
| T-02-05-08 | I (XSS via custom role name) | RoleListCard render | mitigate | React tự escape JSX; KHÔNG dùng dangerouslySetInnerHTML; Zod max 100 chars |
| T-02-05-09 | T (Delete role with assigned users) | deleteCustomRole | mitigate | Server action check `prisma.user.count({where:{role:code}}) === 0`; throw "Vai trò đang được gán cho {n} người dùng" |
</threat_model>

<verification>
- `npm run db:seed` → Roles 7, Permissions 144, RolePermission grants ≈ 80-100
- `npm run typecheck && npm run lint && npm run build` exit 0
- Đăng nhập admin → /vai-tro:
  - Tab "Danh sách vai trò" → 7 system role cards với badges "Hệ thống"
  - Tab "Ma trận phân quyền" → 18 accordion sections; expand "Đề án" → 7×8 = 56 cells; ADMIN row tất cả granted
- Tick CHUYENVIEN × tham-dinh × score (chưa cấp) → checkbox flip ngay → Network tab thấy server action call → success → audit log /nhat-ky có entry mới
- Refresh trang → state vẫn flipped (DB persisted)
- Untick → flip back → audit log entry mới
- Try untick ADMIN × de-an × read → button disabled (tooltip "ADMIN luôn có toàn quyền")
- Tạo custom role "NHANVIEN_NHAP" → xuất hiện trong list cards với badge "Tùy chỉnh"; tab matrix có row mới (default 0 grants)
- Tick vài cells cho NHANVIEN_NHAP → grants persist; sau xóa role → role và RolePermission cascade gone
- Đăng nhập DONVI → /vai-tro middleware redirect (sidebar không show menu)
</verification>

<success_criteria>
- ROLE-01: List 7 system + custom roles with description (card view)
- ROLE-02: Tạo custom role qua dialog
- ROLE-03: Edit custom role (name, description; code immutable)
- ROLE-04: Matrix grid 18 resources × 8 actions × 7+ roles (accordion-grouped)
- ROLE-05: Grant/revoke với optimistic UI + audit log
- ROLE-06: Sidebar re-render khi role permission đổi (revalidatePath('/'))
- ROLE-07: Server action authoritative (DONVI gọi grantPermission → throw)
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-05-role-permission-matrix-SUMMARY.md`
</output>
