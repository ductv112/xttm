---
phase: 02-m1-quan-tri-danh-muc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/audit.ts
  - lib/audit-types.ts
  - app/(app)/nhat-ky/page.tsx
  - app/(app)/nhat-ky/_components/AuditLogTable.tsx
  - app/(app)/nhat-ky/_components/AuditLogFilterBar.tsx
  - app/(app)/nhat-ky/_components/AuditLogDetailSheet.tsx
  - app/(app)/nhat-ky/_actions/list.ts
  - app/(app)/nhat-ky/_actions/export.ts
autonomous: true
requirements: [LOG-01, LOG-02, LOG-03]
tags: [audit, server-action-wrapper, data-table, csv-export]

must_haves:
  truths:
    - "Mọi server action mutation gọi qua withAuditLog ghi 1 record AuditLog với action+resource+resourceId+diffJson+userId+ip+userAgent"
    - "Admin/Lãnh đạo (read 'audit-log') xem được trang /nhat-ky với DataTable phân trang 50/trang"
    - "Admin filter audit log theo user (combobox), entity (resource), action (multi-select), date range (from/to) — kết quả cập nhật server-side"
    - "Admin click row → mở Sheet bên phải hiển thị before/after JSON diff dạng tree pretty-print"
    - "Admin click 'Xuất CSV' → download file CSV với BOM UTF-8 chứa filtered records, mở Excel hiển thị tiếng Việt đúng dấu"
    - "Server action không có quyền `audit-log:read` (vd role DONVI) bị reject với throw 'Bạn không có quyền truy cập nhật ký'"
  artifacts:
    - path: "lib/audit-types.ts"
      provides: "AuditAction enum (CREATE/UPDATE/DELETE/TRANSITION/SUBMIT/APPROVE/REJECT/ASSIGN/LOGIN/LOGOUT/EXPORT), AuditResource enum (18 resources khớp lib/permissions.ts), AuditEntry type"
      exports: ["AuditAction", "AuditResource", "AuditEntry", "AUDIT_ACTIONS", "AUDIT_RESOURCES"]
    - path: "lib/audit.ts"
      provides: "withAuditLog<T>(meta, fn) wrapper + diffObjects(before, after) helper"
      exports: ["withAuditLog", "diffObjects", "logAudit"]
    - path: "app/(app)/nhat-ky/page.tsx"
      provides: "Audit log RSC page với DataTable virtualized + filter bar + sheet detail"
      contains: "getAuditLogs"
    - path: "app/(app)/nhat-ky/_actions/list.ts"
      provides: "Server action listAuditLogs(filter, pageIndex, pageSize) — RBAC check 'audit-log:read'"
      exports: ["listAuditLogs"]
    - path: "app/(app)/nhat-ky/_actions/export.ts"
      provides: "Server action exportAuditLogsCSV(filter) returns CSV string với BOM UTF-8"
      exports: ["exportAuditLogsCSV"]
  key_links:
    - from: "lib/audit.ts withAuditLog"
      to: "prisma.auditLog.create"
      via: "after fn() succeeds, fire-and-forget create"
      pattern: "prisma\\.auditLog\\.create"
    - from: "app/(app)/nhat-ky/_actions/list.ts"
      to: "lib/permissions.ts can(role, 'audit-log', 'read')"
      via: "first line of server action"
      pattern: "can\\([^,]+,\\s*'audit-log',\\s*'read'\\)"
    - from: "AuditLogTable.tsx"
      to: "/api/files/... or _actions/export.ts"
      via: "Button onClick → server action returns CSV → window download"
      pattern: "exportAuditLogsCSV"
---

<objective>
Hoàn thiện hạ tầng audit log cho toàn bộ project: helper `withAuditLog` để mọi server action mutation Phase 2-9 wrap được, và trang `/nhat-ky` với DataTable + filter + JSON diff sheet + xuất CSV. Phase 1 schema đã có model AuditLog (14 models lock) — Phase 2 chỉ cần build runtime layer + UI.

Purpose: LOG-01/02/03 là tiền điều kiện cho mọi mutation phase sau (Plan 02-04..07 dùng withAuditLog ngay; Plan 03 trở đi import từ thư viện này). Không có audit log = mất compliance cho gov VN demo.

Output: 1 helper file (`lib/audit.ts`), 1 types file (`lib/audit-types.ts`), trang /nhat-ky đầy đủ filter + virtualized table + sheet detail + CSV export.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/research/SUMMARY.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-SUMMARY.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-02-prisma-schema-seed-SUMMARY.md
@CLAUDE.md
@prisma/schema.prisma
@lib/permissions.ts
@lib/constants.ts
@lib/prisma.ts

<interfaces>
<!-- Contracts from Phase 1 — executor uses directly, no codebase exploration needed -->

From prisma/schema.prisma (already exists, do NOT modify):
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | TRANSITION | SUBMIT | APPROVE
  resource   String   // Project | ProgramCycle | Contract | Report | User | ...
  resourceId String?
  diffJson   String?  // before/after JSON
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
  @@index([resource, resourceId])
}
```

From lib/permissions.ts (already exists):
```typescript
export type Resource = 'chuong-trinh' | 'don-vi-chu-tri' | 'de-an' | 'tiep-nhan'
  | 'tham-dinh' | 'phe-duyet' | 'hop-dong' | 'trien-khai' | 'bao-cao' | 'nghiem-thu'
  | 'tai-chinh' | 'danh-muc' | 'nguoi-dung' | 'vai-tro' | 'cau-hinh' | 'audit-log'
  | 'thong-bao' | 'dashboard';
export type Action = 'read' | 'create' | 'update' | 'delete' | 'submit' | 'approve' | 'assign' | 'score';
export function can(role: Role, resource: Resource, action: Action): boolean;
```

From lib/auth.ts (Plan 01-03):
```typescript
export const auth: () => Promise<Session | null>; // session.user has { id, role, fullName, organizationId }
```

From lib/prisma.ts (Plan 01-01):
```typescript
export const prisma: PrismaClient; // singleton
```

From lib/format.ts (Plan 01-01):
```typescript
export function formatDateTime(d: Date | string): string; // "HH:mm 'ngày' dd/MM/yyyy"
```

From lib/vi-search.ts (Plan 01-01):
```typescript
export function removeDiacritics(s: string): string;
```
</interfaces>

<ui_design_contract>
REUSE Phase 1 UI-SPEC.md (`.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md`) — design system locked:
- shadcn new-york + slate + CSS vars
- Be Vietnam Pro 14/16/24/36, weights 400/600/700
- Color 60/30/10 (slate-50 / white / blue-700)
- Spacing scale 4/8/16/24/32/48/64
- Light mode only
- Tone: formal Vietnamese, "Vui lòng nhập..." not "Required"

This plan adds reusable patterns:
- DataTable virtualized (TanStack Table v8 + TanStack Virtual)
- Sheet drawer cho detail view JSON diff
- Filter bar pattern (combobox user, multi-select action, date range picker)
- Empty state khi 0 records (icon `lucide:history` + "Chưa có nhật ký nào trong khoảng thời gian này")
- CSV export button (icon `lucide:download` + "Xuất CSV")
</ui_design_contract>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Audit types + withAuditLog helper</name>
  <files>lib/audit-types.ts, lib/audit.ts</files>
  <read_first>
    - prisma/schema.prisma (xem AuditLog model, fields đã có)
    - lib/prisma.ts (PrismaClient singleton — import qua "@/lib/prisma")
    - lib/permissions.ts (Resource type — AuditResource phải khớp 18 resources)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (LOG-01..03 decisions)
    - .planning/research/ARCHITECTURE.md grep "withAuditLog" và "audit log volume" (pitfall)
  </read_first>
  <action>
    Tạo 2 files:

    **`lib/audit-types.ts`** — pure types/enums file (không import prisma):
    ```typescript
    export const AUDIT_ACTIONS = [
      'CREATE', 'UPDATE', 'DELETE', 'TRANSITION', 'SUBMIT',
      'APPROVE', 'REJECT', 'ASSIGN', 'LOGIN', 'LOGOUT', 'EXPORT'
    ] as const;
    export type AuditAction = (typeof AUDIT_ACTIONS)[number];

    export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
      CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa',
      TRANSITION: 'Chuyển trạng thái', SUBMIT: 'Nộp', APPROVE: 'Phê duyệt',
      REJECT: 'Từ chối', ASSIGN: 'Phân công', LOGIN: 'Đăng nhập',
      LOGOUT: 'Đăng xuất', EXPORT: 'Xuất dữ liệu',
    };

    // 18 resources khớp lib/permissions.ts Resource type
    export const AUDIT_RESOURCES = [
      'chuong-trinh', 'don-vi-chu-tri', 'de-an', 'tiep-nhan', 'tham-dinh',
      'phe-duyet', 'hop-dong', 'trien-khai', 'bao-cao', 'nghiem-thu',
      'tai-chinh', 'danh-muc', 'nguoi-dung', 'vai-tro', 'cau-hinh',
      'audit-log', 'thong-bao', 'dashboard'
    ] as const;
    export type AuditResource = (typeof AUDIT_RESOURCES)[number];

    export const AUDIT_RESOURCE_LABELS: Record<AuditResource, string> = {
      'chuong-trinh': 'Chu kỳ chương trình', 'don-vi-chu-tri': 'Đơn vị chủ trì',
      'de-an': 'Đề án', 'tiep-nhan': 'Tiếp nhận hồ sơ', 'tham-dinh': 'Thẩm định',
      'phe-duyet': 'Phê duyệt', 'hop-dong': 'Hợp đồng', 'trien-khai': 'Triển khai',
      'bao-cao': 'Báo cáo', 'nghiem-thu': 'Nghiệm thu', 'tai-chinh': 'Tài chính',
      'danh-muc': 'Danh mục', 'nguoi-dung': 'Người dùng', 'vai-tro': 'Vai trò',
      'cau-hinh': 'Cấu hình', 'audit-log': 'Nhật ký', 'thong-bao': 'Thông báo',
      'dashboard': 'Bảng điều khiển',
    };

    export type AuditEntry = {
      action: AuditAction;
      resource: AuditResource;
      resourceId?: string | null;
      before?: unknown;
      after?: unknown;
      metadata?: Record<string, unknown>;
    };
    ```

    **`lib/audit.ts`** — helper với 3 exports per CONTEXT.md decision LOG-01:
    1. `diffObjects(before: unknown, after: unknown): { changed: Record<string, {from, to}> }` — shallow diff for top-level keys (nested objects compared by JSON.stringify equality, không cần lodash). Skip keys: `updatedAt`, `searchKey` (system-managed).
    2. `logAudit(entry, userId, ip?, userAgent?)` — fire-and-forget `prisma.auditLog.create`; wrap trong `try/catch` log lỗi ra console.error nhưng KHÔNG throw (audit failure không nên break business action).
    3. `withAuditLog<TArgs extends unknown[], TReturn>(meta: { action, resource, resourceIdFromArgs?, resourceIdFromResult?, captureBefore?, captureAfter? }, fn: (...args: TArgs) => Promise<TReturn>)` returns wrapped fn. Wrapped fn:
       - call `auth()` from `@/lib/auth` để lấy userId; nếu null → throw new Error('Yêu cầu đăng nhập')
       - capture `headers()` from `next/headers` để lấy `x-forwarded-for` (ip) + `user-agent`
       - if `captureBefore`: call captureBefore(args) trước khi run fn → store
       - run `result = await fn(...args)`
       - if `captureAfter`: call captureAfter(result, args) → store; else use result
       - resolve resourceId qua `resourceIdFromResult(result)` hoặc `resourceIdFromArgs(args)`
       - call `logAudit({ ...meta, before, after, resourceId }, userId, ip, userAgent)` (fire-and-forget — không await để không slow down user response)
       - return result

    Comment WHY: "Audit log volume per PITFALLS — fire-and-forget create để không block server action latency; failure không reject user action (graceful degradation)."

    Note: cycle dependency với `lib/auth.ts` — dùng dynamic import trong withAuditLog: `const { auth } = await import('@/lib/auth')` để tránh import cycle (lib/audit imported by mọi server action, lib/auth import từ next-auth → next-auth không nên load tại type level).
  </action>
  <acceptance_criteria>
    - File `lib/audit-types.ts` tồn tại; `grep "AUDIT_ACTIONS = \\[" lib/audit-types.ts` returns 1 match
    - File `lib/audit-types.ts` exports `AUDIT_RESOURCES` với đúng 18 phần tử (count `'` pairs in array)
    - File `lib/audit.ts` exports đúng 3 names: `withAuditLog`, `diffObjects`, `logAudit` (`grep -E "^export (function|const) (withAuditLog|diffObjects|logAudit)" lib/audit.ts` returns 3 lines)
    - `lib/audit.ts` có pattern `prisma.auditLog.create` (`grep "prisma\\.auditLog\\.create" lib/audit.ts` returns ≥1)
    - `lib/audit.ts` có dynamic import `await import('@/lib/auth')` để tránh circular dep
    - `npx tsc --noEmit` exit 0
    - Smoke test viết tay (xóa sau): tạo `scripts/smoke-audit.ts` chạy `tsx scripts/smoke-audit.ts` → call `logAudit({action:'CREATE', resource:'nguoi-dung', resourceId:'test1'}, 'admin-user-id-from-seed')` → verify `prisma.auditLog.findFirst({where:{resourceId:'test1'}})` trả record. Sau verify xóa file scripts/smoke-audit.ts và record trong DB (`prisma.auditLog.deleteMany({where:{resourceId:'test1'}})`).
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "^export" lib/audit.ts && grep -c "AUDIT_ACTIONS\|AUDIT_RESOURCES" lib/audit-types.ts</automated>
  </verify>
  <done>3 exports trong lib/audit.ts, 18 resources trong AUDIT_RESOURCES, withAuditLog typed generic ràng buộc đúng, smoke test create record AuditLog thành công và đã clean up.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Server actions list + export CSV cho audit log</name>
  <files>app/(app)/nhat-ky/_actions/list.ts, app/(app)/nhat-ky/_actions/export.ts, app/(app)/nhat-ky/_actions/types.ts</files>
  <read_first>
    - lib/audit.ts, lib/audit-types.ts (đã tạo task 1)
    - lib/permissions.ts (can() function)
    - lib/auth.ts (auth() returns session)
    - lib/format.ts (formatDateTime)
    - prisma/schema.prisma (AuditLog index `[userId, createdAt]` và `[resource, resourceId]` để biết query nào fast)
  </read_first>
  <action>
    Tạo 3 files:

    **`app/(app)/nhat-ky/_actions/types.ts`** — shared filter/result types:
    ```typescript
    export type AuditFilter = {
      userId?: string;
      resources?: AuditResource[]; // multi-select
      actions?: AuditAction[];
      from?: string; // ISO date
      to?: string;
      keyword?: string; // search trong resourceId hoặc fullName
    };

    export type AuditLogRow = {
      id: string;
      createdAt: Date;
      userId: string;
      userFullName: string;
      userRole: string;
      action: AuditAction;
      resource: AuditResource;
      resourceId: string | null;
      diffJson: string | null;
      ip: string | null;
      userAgent: string | null;
    };

    export type AuditListResult = { rows: AuditLogRow[]; total: number };
    ```

    **`app/(app)/nhat-ky/_actions/list.ts`** — `'use server'` directive at top:
    - Export `listAuditLogs(filter: AuditFilter, pageIndex: number, pageSize: number): Promise<AuditListResult>`
    - First line: `const session = await auth(); if (!session) throw new Error('Yêu cầu đăng nhập');`
    - Second: `if (!can(session.user.role, 'audit-log', 'read')) throw new Error('Bạn không có quyền truy cập nhật ký');`
    - Build prisma `where`: combine userId, resource (in), action (in), createdAt gte/lte. If keyword: `OR: [{user: {fullName: {contains: kw}}}, {resourceId: {contains: kw}}]`
    - `prisma.auditLog.findMany({ where, orderBy: {createdAt: 'desc'}, skip: pageIndex*pageSize, take: pageSize, include: {user: {select: {fullName: true, role: true}}} })`
    - Total: `prisma.auditLog.count({ where })`
    - Map to AuditLogRow shape
    - Cast `row.action` to AuditAction, `row.resource` to AuditResource (string from DB)

    **`app/(app)/nhat-ky/_actions/export.ts`** — `'use server'`:
    - Export `exportAuditLogsCSV(filter: AuditFilter): Promise<{ filename: string; csv: string }>`
    - Same RBAC check
    - Same query nhưng KHÔNG paginate (cap `take: 5000` để tránh OOM, comment WHY)
    - Build CSV với header row tiếng Việt: `"Thời gian","Người dùng","Vai trò","Hành động","Phân hệ","ID đối tượng","Địa chỉ IP"`
    - Each row: escape `"` thành `""`, wrap in `"..."`. Format datetime với `formatDateTime`.
    - Prepend BOM UTF-8 `\uFEFF` để Excel mở đúng dấu Việt
    - Filename: `nhat-ky-${YYYYMMDD-HHmmss}.csv`
    - Log audit (EXPORT, audit-log) qua withAuditLog cho chính action này
    - Return `{ filename, csv }` — client download via Blob
  </action>
  <acceptance_criteria>
    - File `app/(app)/nhat-ky/_actions/list.ts` bắt đầu với `'use server';`
    - `grep "can(.*'audit-log'.*'read')" app/(app)/nhat-ky/_actions/*.ts` returns ≥2 matches (cả list và export)
    - File `app/(app)/nhat-ky/_actions/export.ts` chứa `\\uFEFF` BOM (`grep "uFEFF" app/(app)/nhat-ky/_actions/export.ts` returns 1)
    - `npx tsc --noEmit` exit 0
    - Smoke test: gọi từ Node (server-side) `listAuditLogs({}, 0, 50)` → trả `{rows:[], total:0}` (DB chưa có audit log) hoặc records nếu task 1 đã ghi.
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "'use server'" "app/(app)/nhat-ky/_actions/list.ts" "app/(app)/nhat-ky/_actions/export.ts"</automated>
  </verify>
  <done>2 server actions (list, export) RBAC-checked, CSV có BOM UTF-8, filter đầy đủ 6 fields (user, resource, action, from, to, keyword).</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Audit log page + components (DataTable + filter bar + JSON diff sheet)</name>
  <files>app/(app)/nhat-ky/page.tsx, app/(app)/nhat-ky/_components/AuditLogTable.tsx, app/(app)/nhat-ky/_components/AuditLogFilterBar.tsx, app/(app)/nhat-ky/_components/AuditLogDetailSheet.tsx</files>
  <read_first>
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (Empty State pattern, color tokens, typography)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (LOG-03 decisions: virtualized DataTable, expand row JSON tree, BOM UTF-8)
    - app/(app)/dashboard/page.tsx (xem pattern RSC page hiện có)
    - components/layout/AppShell.tsx (xem layout đã wired)
    - app/(app)/nhat-ky/_actions/types.ts, list.ts, export.ts (Task 2)
    - lib/format.ts (formatDateTime)
    - lib/audit-types.ts (labels)
  </read_first>
  <action>
    Cài thêm shadcn components nếu chưa có (run lần lượt):
    ```bash
    npx shadcn add data-table table tabs select popover command calendar checkbox dialog
    ```
    Note: `data-table` block từ shadcn không tồn tại — `table` đã đủ; xây custom DataTable trong Task này (sẽ refactor ra shared trong Plan 02-03).

    **`app/(app)/nhat-ky/page.tsx`** — Server Component:
    - Import `auth` from `@/lib/auth`, redirect nếu không đăng nhập hoặc không có quyền `audit-log:read` (defense-in-depth — middleware Plan 1-03 đã guard rồi nhưng layer 2)
    - Search params parsing với `searchParams: Promise<{...}>` (Next 15 async)
    - Page heading "Nhật ký truy cập" `text-2xl font-semibold` + subtitle "Theo dõi mọi thay đổi nghiệp vụ trong hệ thống" `text-sm text-slate-600`
    - Render `<AuditLogFilterBar />` (client) + `<AuditLogTable />` (client) — initial data fetched server-side, hydrate
    - Layout: `container mx-auto py-6 space-y-6`

    **`AuditLogFilterBar.tsx`** — `'use client'`:
    - Bar layout: flex flex-wrap gap-3 items-end p-4 bg-white border border-slate-200 rounded-md
    - Components: 
      - Combobox "Người dùng" (fetch users qua server action stub — gắn `loadUsers` action sau Plan 02-04 có; cho task này hardcode tạm 8 users từ HARDCODED_USERS để render đủ — note TODO khi Plan 04 ready)
      - MultiSelect "Phân hệ" — values từ AUDIT_RESOURCES + AUDIT_RESOURCE_LABELS
      - MultiSelect "Hành động" — values từ AUDIT_ACTIONS + AUDIT_ACTION_LABELS
      - Date range picker "Từ ngày — Đến ngày" qua shadcn `Calendar` + `Popover`
      - Input search keyword với icon `lucide:search`
      - Button "Áp dụng" (variant default) + "Xóa bộ lọc" (variant ghost)
      - Button "Xuất CSV" (`lucide:download`) ở góc phải `ml-auto`
    - State qua URL search params (use `useRouter` + `useSearchParams` của Next 15) — keep filter trong URL để bookmarkable
    - Khi click "Xuất CSV": call `exportAuditLogsCSV(filter)` → blob download:
      ```typescript
      const { filename, csv } = await exportAuditLogsCSV(filter);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      ```
    - Toast success "Đã xuất {n} bản ghi" qua sonner

    **`AuditLogTable.tsx`** — `'use client'`:
    - Use `@tanstack/react-table` v8 + `@tanstack/react-virtual` v3 (cài nếu chưa)
    - Columns:
      1. "Thời gian" — `formatDateTime(row.createdAt)` text-sm
      2. "Người dùng" — `<div>{fullName}</div><div class="text-xs text-slate-500">{ROLE_LABELS[role]}</div>` (note: text-xs là exception cho secondary metadata — chấp nhận theo UI-SPEC inline error inheritance)
      3. "Hành động" — Badge với màu theo action: CREATE=green-100, UPDATE=blue-100, DELETE=red-100, APPROVE/SUBMIT=blue-100, others=slate-100; label `AUDIT_ACTION_LABELS[action]`
      4. "Phân hệ" — `AUDIT_RESOURCE_LABELS[resource]` text-sm
      5. "Đối tượng" — resourceId truncate `text-sm font-mono text-slate-600`
      6. "" — Button icon `lucide:eye` size-icon ghost, click mở DetailSheet
    - Virtualization: nếu `total > 200` dùng `useVirtualizer` row 56px height. Otherwise dùng paginated 50/page với `<Pagination>` shadcn.
    - TanStack Query: `useQuery({ queryKey: ['audit-log', filter, pageIndex], queryFn: () => listAuditLogs(filter, pageIndex, 50), placeholderData: keepPreviousData, staleTime: 30_000 })`
    - Empty state khi `data.total === 0`: `<EmptyState icon="history" heading="Chưa có nhật ký" description="..." />` — viết inline component đơn giản (sẽ refactor sang shared trong 02-03)
    - Loading state: `<Skeleton h-14 />` x 8 rows

    **`AuditLogDetailSheet.tsx`** — `'use client'`:
    - shadcn `Sheet` slide-in từ phải, `w-[600px]`
    - Header: "{AUDIT_ACTION_LABELS[action]} {AUDIT_RESOURCE_LABELS[resource]}" + timestamp formatDateTime
    - Body sections:
      - "Người thực hiện": fullName + role + IP + userAgent (ngắn gọn — chỉ phần browser)
      - "Đối tượng": resourceId
      - "Thay đổi": JSON pretty-print 2 cột (trước / sau) — parse `diffJson` (string) thành object, cho mỗi key thay đổi hiển thị `<div class="grid grid-cols-2 gap-2"><div>{key}: <s class="text-red-600">{from}</s></div><div>{key}: <span class="text-green-700">{to}</span></div></div>`. Nếu CREATE: chỉ hiển thị "after". Nếu DELETE: chỉ "before". Nếu diffJson null: "Không có thay đổi chi tiết".
    - Footer: Button "Đóng" + "Sao chép JSON" (copy diffJson raw to clipboard)

    Vietnamese copy strict: tone formal "Người thực hiện" / "Đối tượng" / "Thay đổi" / "Đóng" / "Sao chép JSON".
  </action>
  <acceptance_criteria>
    - File `app/(app)/nhat-ky/page.tsx` tồn tại và là Server Component (no `'use client'` directive ở top)
    - 3 client components có `'use client'` directive ở dòng 1
    - `grep "AUDIT_RESOURCES\\|AUDIT_ACTIONS\\|AUDIT_ACTION_LABELS" app/(app)/nhat-ky/_components/*.tsx` returns ≥3 matches (filter bar dùng cả 3)
    - `grep "exportAuditLogsCSV" app/(app)/nhat-ky/_components/AuditLogFilterBar.tsx` returns 1
    - Page render heading "Nhật ký truy cập" — `grep "Nhật ký truy cập" app/(app)/nhat-ky/page.tsx` returns 1
    - `npm run typecheck` exit 0
    - `npm run lint` exit 0 (no ESLint errors)
    - `npm run build` exit 0 — page builds without runtime error
    - Smoke test manual (Task verification): `npm run dev` → đăng nhập admin → visit `/nhat-ky` → page render với "Chưa có nhật ký" empty state (DB chưa có log; sẽ có ngay khi Plan 02-04+ chạy mutation đầu tiên)
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <done>Trang /nhat-ky render được với filter bar đầy đủ 6 controls + DataTable virtualized + Sheet detail JSON diff + nút xuất CSV. RBAC enforced authoritative trong server action (admin/lãnh đạo only).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → Server Action | Admin/lãnh đạo gửi filter input (untrusted: keyword string, resource/action enum, date range) qua server action; chỉ admin/lãnh đạo có quyền |
| Server Action → Prisma | Filter dùng để build `where` clause; risk SQL injection nếu raw query |
| Server Action → AuditLog write | Mọi mutation phase 2-9 wrap qua withAuditLog → fire-and-forget create; risk log tampering nếu append-not-only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01-01 | E (Privilege escalation) | listAuditLogs / exportAuditLogsCSV | mitigate | Authoritative `can(role, 'audit-log', 'read')` ở dòng 2 mọi server action; throw lỗi VN trước khi query DB |
| T-02-01-02 | T (Tampering) | AuditLog table | mitigate | Schema không expose UPDATE/DELETE — withAuditLog chỉ gọi `prisma.auditLog.create`, không có server action nào update/delete audit log entry; comment WHY trong lib/audit.ts |
| T-02-01-03 | I (Info disclosure) | CSV export | mitigate | Cap take: 5000 records; chỉ admin/lãnh đạo xuất; không export raw `userAgent` đầy đủ (truncate browser portion) để giảm fingerprint leakage |
| T-02-01-04 | T (Injection) | filter.keyword in `contains` | mitigate | Prisma `contains` parameterized — không phải raw query; safe by default |
| T-02-01-05 | D (Denial) | withAuditLog blocking | mitigate | Fire-and-forget create — `void prisma.auditLog.create(...)` không await trong wrapped action; failure log console.error nhưng không throw |
| T-02-01-06 | R (Repudiation) | mutation không qua withAuditLog | mitigate | Convention enforce trong code review + naming (server action MUST `'use server'` + import withAuditLog); không có cơ chế tự động Phase 2 (defer immutable WORM Phase 11) |
| T-02-01-07 | I (XSS in diff display) | AuditLogDetailSheet JSON render | accept | React tự escape JSX; KHÔNG dùng `dangerouslySetInnerHTML`; diffJson parse qua JSON.parse safe; POC scope |
</threat_model>

<verification>
- `npm run typecheck` exit 0
- `npm run lint` exit 0
- `npm run build` exit 0
- Đăng nhập admin → visit `/nhat-ky` → page load < 2s, hiển thị empty state hoặc bảng (nếu Plan 02-04+ đã ghi log)
- Đăng nhập DONVI/donvi1 → visit `/nhat-ky` → middleware Plan 01-03 redirect về landing path (sidebar không render link nhật ký do `can('DONVI', 'audit-log', 'read') === false`)
- Filter bar combobox/multi-select/date picker tương tác được, "Áp dụng" gọi server action qua TanStack Query
- Click row → Sheet mở phía phải, hiển thị JSON diff
- Click "Xuất CSV" → file `nhat-ky-{timestamp}.csv` download, mở Excel hiển thị header tiếng Việt + dấu đúng
</verification>

<success_criteria>
- LOG-01: `withAuditLog` wrapper sẵn sàng để Plan 02-04..07 dùng — every mutation trong các plan sau import `withAuditLog` từ `@/lib/audit`
- LOG-02: Trang `/nhat-ky` filter user/entity/action/date range hoạt động
- LOG-03: Xuất CSV với BOM UTF-8 dấu Việt đúng trong Excel
- Reachability: route `/nhat-ky` reachable qua sidebar menu (đã có trong `lib/permissions.ts` ALL_MENU_ITEMS với `resource: 'audit-log'` — admin/lãnh đạo thấy)
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-01-audit-log-infrastructure-SUMMARY.md`
</output>
