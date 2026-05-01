---
phase: 02-m1-quan-tri-danh-muc
plan: 04
type: execute
wave: 2
depends_on: [01, 03]
files_modified:
  - app/(app)/nguoi-dung/page.tsx
  - app/(app)/nguoi-dung/_components/UserTable.tsx
  - app/(app)/nguoi-dung/_components/UserFilterBar.tsx
  - app/(app)/nguoi-dung/_components/UserFormFields.tsx
  - app/(app)/nguoi-dung/_components/ResetPasswordDialog.tsx
  - app/(app)/nguoi-dung/new/page.tsx
  - app/(app)/nguoi-dung/[id]/edit/page.tsx
  - app/(app)/nguoi-dung/_actions/list.ts
  - app/(app)/nguoi-dung/_actions/create.ts
  - app/(app)/nguoi-dung/_actions/update.ts
  - app/(app)/nguoi-dung/_actions/lock.ts
  - app/(app)/nguoi-dung/_actions/reset-password.ts
  - app/(app)/nguoi-dung/_actions/export.ts
  - app/(app)/nguoi-dung/_actions/schemas.ts
autonomous: true
requirements: [USER-01, USER-02, USER-03, USER-04, USER-05, USER-06, USER-07]
tags: [user-mgmt, crud, bulk-actions, excel-export, password-reset]

must_haves:
  truths:
    - "Admin (login `admin/Admin@123`) thấy menu 'Người dùng' và truy cập /nguoi-dung được"
    - "Trang /nguoi-dung hiển thị DataTable danh sách 8 users với cột: Họ tên + Username, Email, Vai trò, Đơn vị, Trạng thái, Ngày tạo, Hành động"
    - "Filter bar có: search debounce 300ms (theo fullName/username/email), MultiSelect vai trò (7), MultiSelect đơn vị, Select trạng thái (active/locked)"
    - "Click 'Tạo người dùng' → trang /nguoi-dung/new với form RHF+Zod (họ tên, email, username, mật khẩu, vai trò, đơn vị); submit thành công → redirect /nguoi-dung + toast"
    - "Click row 'Chỉnh sửa' → trang /nguoi-dung/[id]/edit với form prefilled, username readonly; submit → optimistic update + audit log entry"
    - "Bulk action: chọn nhiều rows → toolbar bottom xuất hiện 'Khóa', 'Mở khóa', 'Đổi vai trò' (popover dropdown)"
    - "Click 'Reset mật khẩu' (row action) → dialog hiển thị mật khẩu tạm 12 chars random + button 'Sao chép' + warning 'Lưu lại trước khi đóng'"
    - "Click 'Xuất Excel' → download file .xlsx với 8 cột, mở Excel hiển thị tiếng Việt đúng dấu"
    - "Mọi mutation (create/update/lock/reset/role-change) ghi audit log qua withAuditLog với resource='nguoi-dung'"
    - "RBAC enforced: server actions verify can(role, 'nguoi-dung', 'create'|'update'|'delete') — chỉ ADMIN; non-admin gọi → throw 'Bạn không có quyền'"
  artifacts:
    - path: "app/(app)/nguoi-dung/page.tsx"
      provides: "User list RSC page"
    - path: "app/(app)/nguoi-dung/new/page.tsx"
      provides: "Create user form page"
    - path: "app/(app)/nguoi-dung/[id]/edit/page.tsx"
      provides: "Edit user form page với prefilled data"
    - path: "app/(app)/nguoi-dung/_actions/schemas.ts"
      provides: "Zod schemas: createUserSchema, updateUserSchema, listUsersFilterSchema"
      exports: ["createUserSchema", "updateUserSchema", "listUsersFilterSchema"]
    - path: "app/(app)/nguoi-dung/_actions/list.ts"
      provides: "listUsers(filter, pageIndex, pageSize) server action với RBAC"
      exports: ["listUsers"]
    - path: "app/(app)/nguoi-dung/_actions/create.ts"
      exports: ["createUser"]
    - path: "app/(app)/nguoi-dung/_actions/update.ts"
      exports: ["updateUser"]
    - path: "app/(app)/nguoi-dung/_actions/lock.ts"
      provides: "lockUser, unlockUser, bulkLockUsers, bulkUnlockUsers, bulkChangeRole"
      exports: ["lockUser", "unlockUser", "bulkLockUsers", "bulkUnlockUsers", "bulkChangeRole"]
    - path: "app/(app)/nguoi-dung/_actions/reset-password.ts"
      provides: "resetPassword(userId) returns temp password (12 chars random)"
      exports: ["resetPassword", "generateTempPassword"]
    - path: "app/(app)/nguoi-dung/_actions/export.ts"
      provides: "exportUsersExcel(filter) returns xlsx Buffer"
      exports: ["exportUsersExcel"]
  key_links:
    - from: "app/(app)/nguoi-dung/_actions/*.ts"
      to: "lib/audit.ts withAuditLog"
      via: "wrap mọi mutation với withAuditLog meta"
      pattern: "withAuditLog"
    - from: "app/(app)/nguoi-dung/_actions/*.ts"
      to: "lib/permissions.ts can()"
      via: "first line RBAC check"
      pattern: "can\\([^,]+,\\s*'nguoi-dung'"
    - from: "app/(app)/nguoi-dung/_components/UserTable.tsx"
      to: "components/shared/data-table/DataTable.tsx"
      via: "import DataTable from shared"
      pattern: "from '@/components/shared/data-table"
    - from: "app/(app)/nguoi-dung/_actions/create.ts"
      to: "bcryptjs"
      via: "hash password before prisma.user.create"
      pattern: "bcrypt\\.hash"
---

<objective>
Build full User CRUD module: list với filter+sort+bulk action, create/edit dedicated pages, lock/unlock, reset password (sinh tạm 12 chars), bulk role change, xuất Excel — phục vụ Admin quản trị 8 hardcoded users + thêm user mới khi cần demo. Mọi mutation ghi audit log qua withAuditLog.

Purpose: USER-01..07 là tiền điều kiện để Plan 02-05 (role matrix) gán role cho user, và Plan 03+ (Phase 3 trở đi) có user thực để assign reviewer / hội đồng. Demo "ma trận phân quyền hoạt động" phụ thuộc vào việc tạo được test user với role tùy chỉnh.

Output: 1 list page + 1 new page + 1 edit page + 7 server actions + 5 components + 1 schemas file.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@prisma/schema.prisma
@lib/permissions.ts
@lib/constants.ts
@lib/auth.ts
@lib/audit.ts
@lib/audit-types.ts
@components/shared/data-table/DataTable.tsx
@components/shared/data-table/types.ts
@components/shared/EmptyState.tsx
@components/shared/ConfirmDialog.tsx
@components/shared/MultiSelect.tsx
@components/shared/CopyButton.tsx

<interfaces>
From Plan 02-01 (lib/audit.ts):
```typescript
export function withAuditLog<TArgs extends unknown[], TReturn>(
  meta: {
    action: AuditAction;
    resource: AuditResource;
    resourceIdFromArgs?: (args: TArgs) => string | null;
    resourceIdFromResult?: (result: TReturn) => string | null;
    captureBefore?: (args: TArgs) => Promise<unknown>;
    captureAfter?: (result: TReturn, args: TArgs) => unknown;
  },
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn>;
```

From Plan 02-03 (DataTable):
```typescript
type DataTableProps<TData> = {
  columns: ColumnDef<TData>[]; data: TData[]; total: number;
  pageIndex: number; pageSize: number;
  onPageChange: (idx: number, size: number) => void;
  rowSelection?: RowSelectionState; onRowSelectionChange?;
  bulkActions?: BulkAction<TData>[]; toolbarSlot?: ReactNode; ...
};
```

From prisma/schema.prisma User model:
```prisma
model User {
  id, username (unique), passwordHash, fullName, email?, phone?,
  role, isActive, organizationId?, createdAt, updatedAt
  organization Organization?
}
```

From lib/constants.ts:
```typescript
export const ROLES = { ADMIN, BANQL, CHUYENVIEN, HOIDONG, DONVI, TAICHINH, LANHDAO };
export const ROLE_LABELS: Record<Role, string>;
```

From bcryptjs (Phase 1 installed):
```typescript
import bcrypt from 'bcryptjs';
await bcrypt.hash(plain, 10);
```

From xlsx@0.18.5 (Phase 1 installed):
```typescript
import * as XLSX from 'xlsx';
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Người dùng');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Server actions (list, create, update, lock/bulk, reset-password, export Excel) + schemas</name>
  <files>app/(app)/nguoi-dung/_actions/schemas.ts, app/(app)/nguoi-dung/_actions/list.ts, app/(app)/nguoi-dung/_actions/create.ts, app/(app)/nguoi-dung/_actions/update.ts, app/(app)/nguoi-dung/_actions/lock.ts, app/(app)/nguoi-dung/_actions/reset-password.ts, app/(app)/nguoi-dung/_actions/export.ts</files>
  <read_first>
    - lib/audit.ts (withAuditLog signature + usage example)
    - lib/permissions.ts (can() function, ROLES constants)
    - lib/auth.ts (auth() returns session)
    - prisma/schema.prisma (User model)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (USER decisions: dedicated page, bulk action, reset password 12 chars random, search debounce 300ms, server-side pagination 20/page)
  </read_first>
  <action>
    7 server action files, mỗi file `'use server'` đầu file:

    **`schemas.ts`** (NOT 'use server' — pure Zod, importable from client):
    ```typescript
    import { z } from 'zod';
    import { ROLES } from '@/lib/constants';
    
    export const ROLE_VALUES = Object.values(ROLES) as [string, ...string[]];
    
    export const createUserSchema = z.object({
      fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
      username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(50)
        .regex(/^[a-z0-9_-]+$/i, 'Chỉ chữ, số, gạch dưới, gạch ngang'),
      email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
      phone: z.string().optional(),
      password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
      role: z.enum(ROLE_VALUES),
      organizationId: z.string().optional().nullable(),
      isActive: z.boolean().default(true),
    });
    
    export const updateUserSchema = createUserSchema.omit({ username: true, password: true })
      .partial({ email: true, phone: true, organizationId: true });
    
    export const listUsersFilterSchema = z.object({
      keyword: z.string().optional(),
      roles: z.array(z.string()).optional(),
      organizationIds: z.array(z.string()).optional(),
      status: z.enum(['all', 'active', 'locked']).default('all'),
    });
    ```

    **`list.ts`**:
    ```typescript
    'use server';
    export async function listUsers(filter: ListFilter, pageIndex = 0, pageSize = 20) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'nguoi-dung', 'read')) throw new Error('Bạn không có quyền');
      const where: Prisma.UserWhereInput = {};
      if (filter.keyword) {
        const kw = filter.keyword.trim();
        where.OR = [
          { fullName: { contains: kw } },
          { username: { contains: kw } },
          { email: { contains: kw } },
        ];
      }
      if (filter.roles?.length) where.role = { in: filter.roles };
      if (filter.organizationIds?.length) where.organizationId = { in: filter.organizationIds };
      if (filter.status === 'active') where.isActive = true;
      if (filter.status === 'locked') where.isActive = false;
      const [rows, total] = await Promise.all([
        prisma.user.findMany({ where, orderBy: {createdAt: 'desc'}, skip: pageIndex*pageSize, take: pageSize, include: {organization: {select: {id:true, name:true, code:true}}}}),
        prisma.user.count({where}),
      ]);
      return { rows, total };
    }
    ```

    **`create.ts`**:
    ```typescript
    'use server';
    async function createUserImpl(input: CreateUserInput) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'nguoi-dung', 'create')) throw new Error('Bạn không có quyền tạo người dùng');
      const parsed = createUserSchema.parse(input);
      const exists = await prisma.user.findUnique({where:{username:parsed.username}});
      if (exists) throw new Error('Tên đăng nhập đã tồn tại');
      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const user = await prisma.user.create({
        data: { ...parsed, passwordHash, password: undefined as never },
        select: { id: true, username: true, fullName: true, role: true, isActive: true, organizationId: true, createdAt: true, email: true, phone: true },
      });
      revalidatePath('/nguoi-dung');
      return user;
    }
    export const createUser = withAuditLog(
      { action: 'CREATE', resource: 'nguoi-dung', resourceIdFromResult: r => r.id, captureAfter: r => ({...r, password: '[redacted]'}) },
      createUserImpl
    );
    ```

    **`update.ts`**:
    Similar pattern. Capture before via `prisma.user.findUnique` for diff. Don't allow username change. Don't allow self-role-change to ADMIN if current user role isn't ADMIN (security: prevent privilege escalation T-02-04-02).

    **`lock.ts`** — exports 5 functions:
    - `lockUser(id)`: set isActive=false; cannot lock self (`if (id === session.user.id) throw new Error('Không thể tự khóa tài khoản của chính mình')`)
    - `unlockUser(id)`: set isActive=true
    - `bulkLockUsers(ids)`: filter out current user id, batch update, audit each
    - `bulkUnlockUsers(ids)`: similar
    - `bulkChangeRole(ids, newRole)`: validate newRole in ROLES enum, update each, audit each. Cannot change own role.
    All wrapped withAuditLog with action='UPDATE' or 'TRANSITION'.

    **`reset-password.ts`**:
    ```typescript
    export function generateTempPassword(): string {
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const symbols = '!@#$%^&*';
      const all = lower + upper + digits + symbols;
      // Ensure 1 of each + 8 random = 12 chars
      const chars = [
        lower[Math.floor(Math.random() * lower.length)],
        upper[Math.floor(Math.random() * upper.length)],
        digits[Math.floor(Math.random() * digits.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];
      for (let i = 0; i < 8; i++) chars.push(all[Math.floor(Math.random() * all.length)]);
      return chars.sort(() => Math.random() - 0.5).join('');
    }
    
    async function resetPasswordImpl(userId: string): Promise<{tempPassword: string}> {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'nguoi-dung', 'update')) throw new Error('Bạn không có quyền');
      const tempPassword = generateTempPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.update({where:{id:userId}, data:{passwordHash:hash}});
      return { tempPassword };
    }
    export const resetPassword = withAuditLog(
      { action: 'UPDATE', resource: 'nguoi-dung', resourceIdFromArgs: ([id]) => id,
        captureAfter: () => ({passwordReset: true}) }, // KHÔNG ghi tempPassword vào audit log
      resetPasswordImpl
    );
    ```
    Note WHY in code: "tempPassword chỉ trả về client 1 lần, KHÔNG persist hoặc audit log raw value (T-02-04-04 mitigation)."

    **`export.ts`**:
    ```typescript
    'use server';
    export async function exportUsersExcel(filter: ListFilter): Promise<{filename:string; base64:string}> {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'nguoi-dung', 'read')) throw new Error('Bạn không có quyền');
      const { rows } = await listUsers(filter, 0, 5000); // cap cho POC
      const data = rows.map(u => ({
        'Họ tên': u.fullName,
        'Tên đăng nhập': u.username,
        'Email': u.email ?? '',
        'Số điện thoại': u.phone ?? '',
        'Vai trò': ROLE_LABELS[u.role as Role],
        'Đơn vị': u.organization?.name ?? '',
        'Trạng thái': u.isActive ? 'Đang hoạt động' : 'Đã khóa',
        'Ngày tạo': formatDateTime(u.createdAt),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Người dùng');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      // log audit EXPORT
      const filename = `nguoi-dung-${format(new Date(),'yyyyMMdd-HHmmss')}.xlsx`;
      return { filename, base64: buf.toString('base64') };
    }
    ```
    Client decode base64 → Blob → download.
  </action>
  <acceptance_criteria>
    - 7 file actions tạo, mỗi file (trừ schemas.ts) có `'use server'` đầu file
    - `grep -c "withAuditLog" app/(app)/nguoi-dung/_actions/*.ts` returns ≥6 (mọi mutation wrap)
    - `grep "can(.*'nguoi-dung'" app/(app)/nguoi-dung/_actions/*.ts | wc -l` returns ≥6 (mọi action RBAC check)
    - `grep "session.user.id" app/(app)/nguoi-dung/_actions/lock.ts` returns ≥1 (self-lock prevention)
    - `grep "generateTempPassword" app/(app)/nguoi-dung/_actions/reset-password.ts` returns ≥2 (export + use)
    - `grep "tempPassword: '\\[redacted\\]'\\|password: '\\[redacted\\]'\\|password: undefined as never" app/(app)/nguoi-dung/_actions/*.ts` returns ≥1 (password không leak vào audit/return)
    - `npx tsc --noEmit` exit 0
    - Smoke test: `tsx scripts/test-create-user.ts` (tạo tạm rồi xóa) → call createUser({fullName:'Test', username:'testuser', password:'Test@1234', role:'BANQL'}) → user count tăng từ 8 → 9, audit log có entry mới với resource='nguoi-dung' action='CREATE'. Sau cleanup user và audit entry.
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "withAuditLog" "app/(app)/nguoi-dung/_actions/create.ts" "app/(app)/nguoi-dung/_actions/update.ts" "app/(app)/nguoi-dung/_actions/lock.ts" "app/(app)/nguoi-dung/_actions/reset-password.ts"</automated>
  </verify>
  <done>7 server actions + Zod schemas, RBAC enforced, audit log wrapped, password reset trả 12-char temp password (1 lần), bcrypt hash cost 10, Excel export 8 cột tiếng Việt.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: List page (DataTable + filter bar + bulk actions + reset password dialog)</name>
  <files>app/(app)/nguoi-dung/page.tsx, app/(app)/nguoi-dung/_components/UserTable.tsx, app/(app)/nguoi-dung/_components/UserFilterBar.tsx, app/(app)/nguoi-dung/_components/ResetPasswordDialog.tsx</files>
  <read_first>
    - components/shared/data-table/DataTable.tsx, types.ts (Plan 02-03 interfaces)
    - components/shared/MultiSelect.tsx, ConfirmDialog.tsx, CopyButton.tsx, EmptyState.tsx
    - components/shared/StatusBadge.tsx (cho extension entity user — chưa có, trong plan này thêm 'USER' entity vào StatusBadge nếu cần)
    - app/(app)/nguoi-dung/_actions/* (Task 1)
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (UI tone)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (USER decisions)
  </read_first>
  <action>
    **`page.tsx`** — Server Component:
    - `auth()` check + `can(role, 'nguoi-dung', 'read')` redirect to `/dashboard` nếu fail
    - Page heading "Quản lý người dùng" + description "Quản lý tài khoản và phân quyền cho 7 vai trò trong hệ thống"
    - Right-aligned button "Tạo người dùng" → `<Link href="/nguoi-dung/new">`
    - Render `<UserFilterBar />` + `<UserTable />` (both client)
    - Initial data: pre-fetch trên server `listUsers({}, 0, 20)`, pass via prop `initialData`

    **`UserFilterBar.tsx`** — `'use client'`:
    - State qua URL search params + useRouter (Next 15)
    - Layout: `flex flex-wrap items-end gap-3 p-4 bg-white border rounded-md`
    - Components:
      1. Input search (icon `lucide:search`, placeholder "Tìm theo họ tên, email, tên đăng nhập...") — debounce 300ms via custom `useDebouncedValue` hook
      2. MultiSelect "Vai trò" — options từ `Object.entries(ROLE_LABELS)`
      3. MultiSelect "Đơn vị" — options từ load orgs (server action `listOrganizations()` — tạo helper inline trong page hoặc reuse 5 orgs từ HARDCODED list)
      4. Select "Trạng thái" — Tất cả / Đang hoạt động / Đã khóa
      5. Button "Xóa bộ lọc" + Button "Xuất Excel" (`lucide:file-spreadsheet`)
    - "Xuất Excel" onClick: `exportUsersExcel(filter)` → decode base64 → Blob `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → download. Toast "Đã xuất {n} bản ghi".

    **`UserTable.tsx`** — `'use client'`:
    - useQuery với key `['users', filter, pageIndex]`
    - Columns:
      1. Checkbox selection (auto-prepended by DataTable nếu rowSelection set)
      2. "Người dùng" — `<div>{fullName}</div><div class="text-xs text-slate-500">@{username}</div>` (note: text-xs là exception cho secondary metadata)
      3. "Email" — text-sm
      4. "Vai trò" — `<Badge variant="outline">{ROLE_LABELS[role]}</Badge>` (slate cho tất cả vai trò; ADMIN có thể `bg-blue-50 text-blue-700` để emphasize)
      5. "Đơn vị" — `organization?.name ?? '—'`
      6. "Trạng thái" — Badge: isActive=true → green-100 "Đang hoạt động"; false → red-100 "Đã khóa"
      7. "Ngày tạo" — `formatDate(createdAt)` text-sm text-slate-600
      8. "" — Actions DropdownMenu (lucide:more-vertical):
         - "Chỉnh sửa" → `router.push("/nguoi-dung/${id}/edit")`
         - "Reset mật khẩu" → mở `<ResetPasswordDialog userId={id} />`
         - Separator
         - "Khóa" / "Mở khóa" (toggle theo isActive) → ConfirmDialog → call lockUser/unlockUser → invalidate query
    - bulkActions:
      - "Khóa" (icon lock, requireConfirm "Khóa {n} tài khoản?") → bulkLockUsers
      - "Mở khóa" (icon unlock) → bulkUnlockUsers
      - "Đổi vai trò" — popover trigger với Select 7 vai trò → bulkChangeRole(ids, newRole)
    - Empty state: `<EmptyState icon="users" heading="Chưa có người dùng" description="Tạo người dùng đầu tiên để bắt đầu" action={{label:'Tạo người dùng', href:'/nguoi-dung/new'}} />`

    **`ResetPasswordDialog.tsx`** — `'use client'`:
    - shadcn Dialog (mở qua state controlled)
    - State: `step: 'confirm' | 'show-password' | 'done'`
    - Step confirm: AlertDialog "Bạn có chắc chắn muốn reset mật khẩu cho {fullName}?" + button "Hủy" + "Reset mật khẩu" → call `resetPassword(userId)` → set step 'show-password' với tempPassword
    - Step show-password: Card với:
      - Heading "Mật khẩu tạm thời"
      - Warning Alert variant="warning": "Vui lòng lưu lại mật khẩu này — sau khi đóng dialog sẽ không thể xem lại"
      - Mật khẩu trong `<code class="text-base font-mono bg-slate-100 px-3 py-2 rounded">${tempPassword}</code>`
      - `<CopyButton value={tempPassword} label="Sao chép mật khẩu" />`
      - Button "Đã lưu, đóng dialog" → close
  </action>
  <acceptance_criteria>
    - `app/(app)/nguoi-dung/page.tsx` là Server Component (no `'use client'` ở dòng 1)
    - `grep "Quản lý người dùng" app/(app)/nguoi-dung/page.tsx` returns 1
    - `grep "from '@/components/shared/data-table" app/(app)/nguoi-dung/_components/UserTable.tsx` returns 1
    - `grep "ROLE_LABELS" app/(app)/nguoi-dung/_components/*.tsx` returns ≥2
    - `grep "exportUsersExcel" app/(app)/nguoi-dung/_components/UserFilterBar.tsx` returns 1
    - `grep "Mật khẩu tạm thời\\|Vui lòng lưu lại" app/(app)/nguoi-dung/_components/ResetPasswordDialog.tsx` returns ≥1
    - `npm run typecheck` exit 0
    - `npm run lint` exit 0
    - `npm run build` exit 0
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>List page render, filter bar 4 controls + xuất Excel, DataTable 7 cột + bulk actions 3, reset password dialog 2 steps với CopyButton.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create + Edit pages với UserFormFields shared component</name>
  <files>app/(app)/nguoi-dung/new/page.tsx, app/(app)/nguoi-dung/[id]/edit/page.tsx, app/(app)/nguoi-dung/_components/UserFormFields.tsx</files>
  <read_first>
    - app/(app)/nguoi-dung/_actions/schemas.ts (Task 1)
    - app/(app)/nguoi-dung/_actions/create.ts, update.ts
    - components/ui/form.tsx (shadcn Form RHF wrapper)
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (form layout, validation tone)
  </read_first>
  <action>
    **`UserFormFields.tsx`** — `'use client'`, shared form fields:
    Props: `{ form: UseFormReturn<CreateUserInput | UpdateUserInput>; mode: 'create' | 'edit'; orgs: {id:string; name:string}[]; }`
    Layout: 2-column grid `grid-cols-1 md:grid-cols-2 gap-6`:
    - `<FormField name="fullName" label="Họ và tên *" placeholder="Nguyễn Văn A" />`
    - `<FormField name="username" label="Tên đăng nhập *" placeholder="username" disabled={mode === 'edit'} />` + helper text "Không thể thay đổi sau khi tạo"
    - `<FormField name="email" label="Email" placeholder="user@xttm.gov.vn" type="email" />`
    - `<FormField name="phone" label="Số điện thoại" placeholder="+84 ..." />`
    - `<FormField name="password" label="Mật khẩu *" type="password" placeholder="Tối thiểu 8 ký tự" />` (chỉ render khi mode === 'create')
    - `<FormField name="role" label="Vai trò *" component={<Select options=ROLE_LABELS />} />`
    - `<FormField name="organizationId" label="Đơn vị" component={<Select options=orgs (allow null with 'Không thuộc đơn vị nào' option)} />}`
    - `<FormField name="isActive" label="Trạng thái" component={<Switch label="Đang hoạt động" />} />`
    Tone validation Vietnamese (đã trong Zod schemas Task 1).

    **`new/page.tsx`** — Client Component (vì có RHF):
    - `'use client'`
    - `auth()` check via parent layout — but defensive redirect via useEffect nếu non-admin
    - Pre-fetch orgs qua server action `listOrganizationsForSelect()` (helper inline)
    - useForm với resolver Zod + defaultValues
    - Header: "Tạo người dùng mới" + breadcrumb
    - Render `<UserFormFields form={form} mode="create" orgs={orgs} />`
    - Footer: 2 buttons — "Hủy" (router.back) + "Tạo người dùng" (`form.handleSubmit(onSubmit)`)
    - onSubmit: `await createUser(values)` → toast.success "Đã tạo người dùng {fullName}" → router.push('/nguoi-dung')
    - Error handling: try/catch → toast.error với error.message (server action throw VN message)
    - Loading state trên button submit

    **`[id]/edit/page.tsx`** — Same pattern but:
    - Server-side fetch user by id
    - If user not found → notFound() (Next 15)
    - Pass user data as initialData → useForm `defaultValues: user`
    - Submit calls `updateUser(id, values)`
    - Header: "Chỉnh sửa người dùng: {fullName}"
    - Cannot edit own role to lower privilege (server action enforce); UI also disable role select if `id === session.user.id` với tooltip "Không thể tự thay đổi vai trò của mình"
  </action>
  <acceptance_criteria>
    - `grep "useForm\\|FormField" app/(app)/nguoi-dung/_components/UserFormFields.tsx` returns ≥2
    - `grep "createUser\\|updateUser" app/(app)/nguoi-dung/new/page.tsx app/(app)/nguoi-dung/\\[id\\]/edit/page.tsx` returns ≥2
    - `grep "disabled={mode === 'edit'}\\|disabled={mode==='edit'}" app/(app)/nguoi-dung/_components/UserFormFields.tsx` returns ≥1 (username readonly khi edit)
    - `grep "Tạo người dùng mới\\|Chỉnh sửa người dùng" app/(app)/nguoi-dung/**/page.tsx` returns ≥2
    - `npm run typecheck` exit 0
    - `npm run lint` exit 0
    - `npm run build` exit 0
    - Smoke test manual: `npm run dev` → đăng nhập admin → /nguoi-dung → click "Tạo người dùng" → fill form → submit → user xuất hiện trong list, password hashed verify được, audit log có entry CREATE.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <done>2 pages (new + edit) + shared UserFormFields, RHF + Zod, username readonly khi edit, password chỉ create mode, redirect sau success, validation Vietnamese formal tone.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser form → Server Action | Admin nhập user data; risk mass assignment, privilege escalation |
| Reset password → temp password client | Server trả tempPassword 1 lần; risk leak nếu intercept hoặc cache |
| Bulk action → multiple records | One action affects N users; risk one bad input cascades |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-04-01 | E (Authorization bypass) | All server actions | mitigate | First 2 lines: `auth()` + `can(role, 'nguoi-dung', action)`; throw VN message trước khi query |
| T-02-04-02 | E (Privilege escalation — self ADMIN) | updateUser, bulkChangeRole | mitigate | Server action checks `if (input.role === 'ADMIN' && session.user.role !== 'ADMIN') throw`; UI disable role select khi id===session.user.id |
| T-02-04-03 | T (Mass assignment) | createUser, updateUser | mitigate | Zod `.parse()` strips unknown fields; explicit field whitelist trong `data: { fullName, username, email, ... }` không spread input raw |
| T-02-04-04 | I (Temp password leak via audit log) | resetPassword | mitigate | `withAuditLog` capture `{passwordReset: true}` chỉ flag, KHÔNG include tempPassword raw value; comment WHY trong code |
| T-02-04-05 | T (SQL injection trong filter.keyword) | listUsers | mitigate | Prisma `contains` parameterized; KHÔNG raw query |
| T-02-04-06 | I (Excel formula injection — CSV equivalent) | exportUsersExcel | accept | xlsx XLSX format binary, không evaluate formula trừ khi cell value bắt đầu `=`; rủi ro thấp cho POC; production phase 2 sẽ prefix `'` |
| T-02-04-07 | D (Bulk action OOM) | bulkLockUsers, bulkChangeRole | mitigate | Cap input length 100 IDs/request; loop async với Promise.all đủ; POC scope OK |
| T-02-04-08 | E (Lock self → lockout) | lockUser, bulkLockUsers | mitigate | Server check `if (id === session.user.id) throw 'Không thể tự khóa tài khoản'`; bulk filter ra current user id trước khi process |
</threat_model>

<verification>
- `npm run typecheck && npm run lint && npm run build` exit 0
- Đăng nhập admin → /nguoi-dung → 8 users hiện trong list
- Filter "Vai trò = DONVI" → 2 users (donvi1, donvi2)
- Search "Hoàng Mai" → 1 user (Hoàng Mai Linh / donvi1)
- Tạo user mới qua /nguoi-dung/new → submit → trong list +1; audit log có entry
- Edit user → username field disabled; submit thay đổi fullName → audit log entry UPDATE với diff
- Reset password user → dialog hiện 12-char password; copy button hoạt động; user mới có thể đăng nhập với password tạm
- Bulk select 3 users → toolbar bottom xuất hiện → "Khóa" → ConfirmDialog → confirm → 3 users isActive=false; audit log 3 entries
- Xuất Excel → download nguoi-dung-{timestamp}.xlsx; mở Excel hiển thị 8 cột tiếng Việt đúng dấu
- Đăng nhập DONVI/donvi1 → /nguoi-dung redirect về /de-an (sidebar không show menu Người dùng)
</verification>

<success_criteria>
- USER-01: List filter+sort+pagination+search hoạt động
- USER-02: Tạo user mới với 8 fields, password bcrypt
- USER-03: Edit user (trừ username)
- USER-04: Lock/unlock single + bulk với confirmation
- USER-05: Đổi vai trò (single via edit + bulk via toolbar)
- USER-06: Reset password sinh tạm 12 chars + dialog 1-time-show + copy
- USER-07: Xuất Excel với 8 cột tiếng Việt
- Mọi mutation ghi audit log → kiểm tra qua /nhat-ky (Plan 02-01)
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-04-user-management-SUMMARY.md`
</output>
