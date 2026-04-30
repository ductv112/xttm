# Phase 2: M1 Quản trị & Danh mục - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Auto-generated during overnight autonomous session (user authorized auto-recommended)

<domain>
## Phase Boundary

Phase 2 cung cấp foundation quản trị + master data cho mọi phase nghiệp vụ tiếp theo. Bao gồm:
- Quản lý người dùng (CRUD + lock/unlock + reset password + xuất Excel)
- Vai trò & Ma trận phân quyền cấu hình bằng UI (grid 7×phân hệ×hành động, không hardcode)
- 8 danh mục hệ thống (Loại đề án, Ngành hàng, Thị trường, Loại hình XTTM, Quốc gia, Đơn vị, Tiêu chí chấm điểm với trọng số, Mẫu văn bản với placeholder interpolation)
- Cấu hình tham số SLA (60/30/15/30/5)
- Audit log với filter + export CSV

KHÔNG nằm trong scope: hành vi nghiệp vụ (đề án, hợp đồng, thẩm định) — đó là Phase 3+.

</domain>

<decisions>
## Implementation Decisions

### Quản lý Người dùng (USER-01..07)
- **List density**: comfortable (default shadcn Table), không compact
- **Create/Edit form**: dedicated page `/nguoi-dung/new` và `/nguoi-dung/[id]/edit` (không modal — form có nhiều fields)
- **Bulk operations**: lock/unlock/role-change qua bulk action toolbar (TanStack Table row selection)
- **Reset password**: sinh password tạm random 12 chars, hiển thị 1 lần trong dialog với button "Sao chép" (copy to clipboard) + warning "Lưu lại trước khi đóng — sẽ không hiển thị lại"
- **Export**: xuất Excel (.xlsx) qua xlsx package, server action streams to response
- **Search**: debounced 300ms, search trên (fullName, username, email) với removeDiacritics
- **Filter**: vai trò (multi-select), đơn vị (multi-select), trạng thái (active/locked)
- **Pagination**: server-side, 20 records/page default

### Vai trò & Phân quyền (ROLE-01..07)
- **Custom role**: cho phép Admin tạo nhóm quyền tùy chỉnh ngoài 7 vai trò seed
- **Matrix UI**: grid với rows = vai trò (7 + custom), columns = phân hệ × hành động (Xem/Thêm/Sửa/Xóa/Phê duyệt). Cell = checkbox tick/untick
- **Phân hệ list**: hardcode 18 resources từ lib/permissions.ts (program-cycle, project, organization, evaluation, contract, ...). Actions từ enum.
- **Optimistic UI**: tick checkbox → server action async update, rollback nếu fail
- **Audit log entry**: mỗi grant/revoke ghi audit (user, role, resource, action, before/after)
- **Sidebar render**: re-fetch menu khi role permission thay đổi (TanStack Query invalidation)
- **Authoritative check**: tất cả server actions verify permission lại từ DB, KHÔNG trust session cache

### Danh mục (CAT-01..08)
- **Edit pattern**: dedicated page với DataTable + sheet/drawer cho edit row (không modal — form có thể dài)
- **Soft delete**: tất cả catalogs có `isActive: boolean` default true. Catalog item có FK reference → không cho delete cứng, chỉ deactivate
- **Activation toggle**: switch column trong DataTable, toggle inline (server action update)
- **Search/Filter**: tên (search debounced) + isActive (filter)
- **Tiêu chí chấm điểm**: form đặc biệt — có trường "trọng số" (1-100), "loại đề án áp dụng" (multi-select), "tiêu chí cha" (optional, cho hierarchy)
- **Mẫu văn bản**: editor Tiptap với placeholder variable list ({tenChuongTrinh}, {namKy}, {tenDeAn}, ...). Preview tab hiển thị render với mock data
- **Quốc gia**: cờ icon ISO + checkbox "Có thương vụ" (cho cảnh báo 30 ngày sau này)
- **Đơn vị**: dropdown loại tổ chức (Bộ/Cục/Hiệp hội/Doanh nghiệp/Viện) + parent unit (cho hierarchy)

### Cấu hình hệ thống (CONFIG-01..02)
- **SLA params UI**: form đơn giản với 4 number inputs (60/30/15/30 ngày), validation > 0
- **Email/SMS template**: tab cho từng loại (mời đăng ký, kết quả phê duyệt, cảnh báo SLA, ...). Tiptap editor + preview với mock data + button "Lưu" → DB
- **Honorific**: dropdown "Kính gửi" / "Kính chào" / "Trân trọng kính chào" + radio "Quý đơn vị" / "Quý ông/bà" / "Anh/chị"

### Audit Log (LOG-01..03)
- **Storage**: 1 bảng `AuditLog` với JSON `before`/`after`/`metadata`
- **Server action wrapper**: helper `withAuditLog<T>(action, fn)` wrap mọi mutation, ghi log async
- **Tra cứu UI**: DataTable virtualized (TanStack Virtual nếu >1000 rows, otherwise pagination), filter (user, entity, action, date range), expand row để xem JSON diff
- **Export CSV**: server action streams CSV với date range filter, BOM UTF-8 header for Excel compatibility

### Claude's Discretion (no decision needed)
- Form input components (chọn shadcn primitives — Input, Select, Combobox, Switch, ...)
- Validation Zod schema (basic rules — required, min/max, regex email/phone)
- Error message wording (theo UI-SPEC tone formal Vietnamese)
- Loading/empty/error states (Skeleton, EmptyState với illustration, ErrorBoundary)
- Mock data 10-15 records/loại
- Server action error handling pattern
- Optimistic UI rollback strategy
- TanStack Query staleTime/cacheTime cho mỗi resource
- Toast feedback timing
- Confirmation dialog wording

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundation (from Phase 1)
- `lib/permissions.ts` — RBAC matrix structure, 18 resources × 8 actions, getMenuItems()
- `lib/constants.ts` — TERMS dictionary lock (đề án ≠ dự án), HARDCODED_USERS, ROLES enum
- `lib/format.ts` — Vietnamese formatters (date, number, currency)
- `prisma/schema.prisma` — Models: User, Role, Permission, RolePermission, Organization, AuditLog, all 8 catalogs scaffolded

### Design Contract (from Phase 1)
- `.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md` — design system locked (colors, typography, spacing), 18 shadcn components catalog, copywriting tone

### Project Architecture
- `.planning/research/ARCHITECTURE.md` — Server Actions policy, RBAC 3 layers, hybrid components organization
- `.planning/research/STACK.md` — TanStack Table + Query patterns, xlsx library
- `.planning/research/PITFALLS.md` — RBAC over-engineering trap (avoid CASL), audit log volume management, Vietnamese sort with searchKey column

### Project Instructions
- `CLAUDE.md` — Vietnamese UI 100%, TERMS dictionary, mock data realistic (VITAS, VINATEX, ...)

</canonical_refs>

<specifics>
## Specific Ideas

- **Vietnamese search**: dùng `searchKey` column (Prisma `@@index`) với removeDiacritics khi insert/update. SQLite COLLATE NOCASE chỉ ASCII.
- **Permission matrix grid**: lấy reference từ AWS IAM Policy Editor hoặc GitHub repo settings — checkbox grid là pattern chuẩn
- **Audit log JSON diff**: dùng deep-diff library hoặc lodash isEqual + custom diff function, hiển thị trong expand row với syntax highlighting (JSON tree)
- **Catalog editor pattern**: shadcn `<Sheet>` (drawer slide-in từ phải) cho row edit — tránh modal cover toàn screen
- **Role matrix UX**: row = role, columns grouped by phân hệ (collapsible group headers), header sticky khi scroll

</specifics>

<deferred>
## Deferred Ideas

- **Permission inheritance** (parent role → child role) — defer to Phase 8+ if needed
- **Time-bound permissions** (grant expires sau N ngày) — không cần cho POC
- **Permission templates** ("copy permissions from role X to role Y") — Phase 2.x backlog
- **Audit log retention policy** (auto-delete after N days) — production concern, defer
- **Custom catalog types** (admin tạo new catalog category dynamic) — over-engineering, defer
- **Email gateway integration** (SMTP/SendGrid) — out of scope (mock only)
- **2FA / MFA** — production, out of scope
- **Permission audit/visualization** ("which users have access to X?") — Phase backlog

</deferred>

---

*Phase: 02-m1-quan-tri-danh-muc*
*Context auto-generated: 2026-04-30 during overnight autonomous session*
*Decisions: 7 categories locked, ~30 specific decisions, 8 deferred ideas captured*
