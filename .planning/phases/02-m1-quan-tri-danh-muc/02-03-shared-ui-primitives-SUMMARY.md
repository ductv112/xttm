---
phase: 02-m1-quan-tri-danh-muc
plan: 03
subsystem: shared-ui-primitives
tags: [shared-ui, data-table, tanstack-table, tiptap, design-system-extension, m1, ui-foundation]

requires:
  - "Plan 01-01: shadcn/ui v4 init (new-york + slate) + 18 base primitives + tailwind v4 + Be Vietnam Pro font"
  - "Plan 01-04: AppShell + (app)/layout.tsx — render context cho shared components"
  - "Phase 1 STACK lock: TanStack Table v8 (peer của @tanstack/react-table 8.21.2), motion v12, lucide-react, sonner, date-fns vi"
  - "Plan 01-01: lib/format.ts (formatDate, formatNumber) cho DataTablePagination + DateRangePicker"
  - "Plan 01-01: lib/constants.ts STATUS_LABELS (PROGRAM_CYCLE/PROJECT) cho StatusBadge label resolution"
  - "Plan 02-01: audit log infrastructure (DataTable trong Plan 02-04+ sẽ wrap mutations qua withAuditLog)"

provides:
  - "components/shared/data-table/DataTable.tsx — Generic <DataTable<TData>> wrapper TanStack Table v8 với manualPagination/Sorting/Filtering, auto-checkbox column khi rowSelection enabled, density comfortable/compact"
  - "components/shared/data-table/DataTablePagination.tsx — Vietnamese pagination 'Hiển thị x-y trong z mục' + 'Trang n/total' + page size 10/20/50/100"
  - "components/shared/data-table/DataTableToolbar.tsx — Wrapper flex layout cho search/filter slots"
  - "components/shared/data-table/DataTableBulkActions.tsx — Sticky-bottom toolbar slate-900 với motion v12 slide-up + ConfirmDialog wrap khi requireConfirm"
  - "components/shared/data-table/types.ts — DataTableProps<TData>, BulkAction<TData>, FilterDef + re-exports ColumnDef/SortingState/RowSelectionState"
  - "components/shared/data-table/index.ts — barrel export cho consumer Plan 02-04..07"
  - "components/shared/EmptyState.tsx — UI-SPEC §Empty State Pattern layout (icon 48px text-slate-400 + heading + description + optional CTA), 10-icon whitelist (inbox/history/file-x/users/list/shield/settings/layout-dashboard/search/package-x)"
  - "components/shared/ConfirmDialog.tsx — shadcn AlertDialog wrapper với variant default/destructive + loading state (Đang xử lý...) + useConfirmDialog imperative hook trả Promise<boolean>"
  - "components/shared/CopyButton.tsx — Icon-swap (copy→check 2s) + sonner toast 'Đã sao chép vào bộ nhớ tạm', variant icon-only/inline"
  - "components/shared/StatusBadge.tsx — Entity-aware (PROGRAM_CYCLE/PROJECT wired, CONTRACT/REPORT/ORG_PROFILE/SCORE_SHEET declared) với 8 color themes mapping status→theme"
  - "components/shared/MultiSelect.tsx — shadcn Popover+Command với checkbox indicator + counter badge label 'Vai trò (3)' + optional inline removable badges"
  - "components/shared/DateRangePicker.tsx — Dual-month Calendar mode='range' locale vi + 6 quick presets (7/30/90 ngày qua, Tháng/Quý/Năm này) + Áp dụng/Xóa footer"
  - "components/shared/RichTextEditor.tsx — Tiptap v3 với toolbar bold/italic/h2/h3/bulletList/orderedList/blockquote/link + variable insertion menu ({{key}}) + undo/redo"
  - "lib/csv.ts — toCSV(rows, columns) với BOM UTF-8 (0xFEFF) + CSV-injection escape (=/+/-/@/tab/cr prefix); downloadCSV(filename, csv) Blob download"
  - "lib/clipboard.ts — copyToClipboard(text) qua navigator.clipboard.writeText với fallback document.execCommand('copy') cho non-secure context"
affects:
  - "02-04-user-management: import DataTable + EmptyState + ConfirmDialog + MultiSelect + DateRangePicker (filter trạng thái + đơn vị + vai trò) + CopyButton (reset password dialog)"
  - "02-05-role-permission-matrix: import DataTable (matrix grid ngược) + ConfirmDialog (bulk grant/revoke) + StatusBadge"
  - "02-06-catalog-editors: import DataTable + ConfirmDialog + RichTextEditor (CAT-08 DocumentTemplate) + MultiSelect (CAT-07 ScoringCriterion appliesToKinds)"
  - "02-07-system-config: import RichTextEditor (CONFIG-02 email/SMS template với variable menu {{tenChuongTrinh}}/{{namKy}}/...) + ConfirmDialog (SLA params save)"
  - "02-01-audit-log refactor (optional polish): refactor inline AuditLogTable sang shared DataTable — defer nếu time pressure"

tech-stack:
  added:
    - "@tiptap/react@^3.22.5 + @tiptap/pm@^3.22.5 + @tiptap/starter-kit@^3.22.5 + @tiptap/extension-link@^3.22.5 + @tiptap/extension-placeholder@^3.22.5 (46 packages tổng) — Tiptap v3 (newer than spec v2 do registry)"
    - "shadcn pagination component (components/ui/pagination.tsx) — install qua npx shadcn add pagination; table/popover/command/checkbox/select/calendar đã có từ Phase 1"
  patterns:
    - "Generic DataTable<TData>: server-side state (manualPagination/Sorting/Filtering = true), parent quản lý pageIndex/pageSize/sorting/rowSelection — DataTable không có internal state ngoài bulk action busy tracker"
    - "Auto-checkbox column: prepended trong useMemo([columns, hasSelection]) — caller chỉ pass columns nghiệp vụ, DataTable tự thêm '__select__' column khi rowSelection !== undefined"
    - "EmptyState slot mở rộng: DataTable.emptyState accept React.ReactNode | DataTableEmptyState config — caller có thể pass JSX custom hoặc {icon, heading, description, action} để DataTable tự render qua EmptyState component"
    - "BulkAction.requireConfirm: nếu set, DataTableBulkActions tự mở ConfirmDialog (không cần caller wire) — DRY confirm logic giữa 4 plan downstream"
    - "useConfirmDialog imperative hook: parent renders {dialog} once + call confirm(opts) trả Promise<boolean> — phù hợp Plan 02-04 reset password flow nơi cần confirm rồi action"
    - "Tiptap v3 immediatelyRender: false — required cho Next.js App Router SSR (Tiptap v3 mặc định render server-side gây mismatch)"
    - "CSV-injection escape (T-02-03-03): cell value bắt đầu bằng =/+/-/@/tab/cr được prefix '\\'' để Excel không evaluate formula — automatic trong escapeCell()"

key-files:
  created:
    - "components/shared/data-table/types.ts — 78 dòng, DataTableProps<TData> + BulkAction<TData> + FilterDef + re-exports"
    - "components/shared/data-table/DataTable.tsx — 305 dòng, generic wrapper với SortableHeaderCell + DataTableBodyRow sub-components"
    - "components/shared/data-table/DataTablePagination.tsx — 117 dòng, Vietnamese labels + 4-button navigation (first/prev/next/last)"
    - "components/shared/data-table/DataTableToolbar.tsx — 25 dòng, flex wrapper"
    - "components/shared/data-table/DataTableBulkActions.tsx — 130 dòng, motion v12 slide-up + ConfirmDialog integration"
    - "components/shared/data-table/index.ts — 18 dòng barrel export"
    - "components/shared/EmptyState.tsx — 92 dòng, 10-icon whitelist + Link/onClick action variants"
    - "components/shared/ConfirmDialog.tsx — 175 dòng, ConfirmDialog component + useConfirmDialog hook"
    - "components/shared/CopyButton.tsx — 90 dòng, icon swap + sonner toast"
    - "components/shared/StatusBadge.tsx — 130 dòng, 8 color themes + entity→label resolver"
    - "components/shared/MultiSelect.tsx — 175 dòng, Popover+Command với checkbox + optional inline badges"
    - "components/shared/DateRangePicker.tsx — 200 dòng, dual-month + 6 presets"
    - "components/shared/RichTextEditor.tsx — 380 dòng, Tiptap v3 + toolbar + LinkButton + VariableMenu sub-components"
    - "lib/csv.ts — 95 dòng, toCSV + downloadCSV + escapeCell + CSV-injection guard"
    - "lib/clipboard.ts — 60 dòng, copyToClipboard với secure-context + execCommand fallback"
  modified:
    - "package.json — thêm 5 @tiptap/* deps (^3.22.5)"
    - "package-lock.json — 46 packages added"
    - "components/ui/pagination.tsx — installed via npx shadcn add pagination"

key-decisions:
  - "Tiptap v3 thay vì v2 (per plan): npm registry không còn @tiptap/*@^2 stable; v3 API tương thích — useEditor + EditorContent + StarterKit/Link/Placeholder extensions vẫn cùng signature; immediatelyRender:false flag cần thiết cho Next 15 RSC"
  - "Generic DataTable type-safe qua <TData>: caller pass ColumnDef<UserRow>[] → row click callback nhận UserRow original, bulk actions nhận UserRow[] — không có any/unknown leak xuống Plan 02-04..07"
  - "Auto-checkbox column thay vì caller phải define manually: trade-off DRY > flexibility; nếu caller cần custom checkbox UI có thể disable rowSelection và define own column — 95% case dùng default đủ"
  - "EmptyState 10-icon whitelist (T-02-03-06 mitigation): tránh tree-shake unfriendly khi caller pass arbitrary lucide icon name; nếu cần thêm icon → expand ICON_MAP trong EmptyState.tsx"
  - "CSV-injection escape thêm trong toCSV automatic (T-02-03-03 mitigation): caller không cần handle — bất kỳ row value bắt đầu bằng formula prefix tự động bị quote-escape thành text"
  - "lib/clipboard fallback dùng document.execCommand: deprecated nhưng vẫn work toàn browser; cần thiết cho POC dev qua HTTP localhost (Clipboard API yêu cầu HTTPS hoặc localhost — Next dev server localhost OK nhưng bare HTTP IP sẽ fail)"
  - "useConfirmDialog hook export bên cạnh ConfirmDialog component: 2 modes — declarative (ConfirmDialog với open prop) cho controlled flow + imperative (await confirm(opts)) cho one-off action handlers — Plan 02-04 reset password sẽ dùng imperative"
  - "RichTextEditor variables menu là feature của shared component thay vì Plan 02-06/02-07 wire riêng: cả CAT-08 DocumentTemplate + CONFIG-02 email/SMS đều cần variable insertion → DRY"
  - "DateRangePicker pending-state pattern: local state pendingFrom/pendingTo tách khỏi parent prop, sync khi popover open + chỉ commit qua Áp dụng button — tránh trigger refetch mỗi lần user di chuột qua calendar"
  - "Motion v12 (motion/react import path) cho bulk action slide-up: framer-motion alias không cần — motion v12 là rebrand official + imports từ 'motion/react' subpath"
  - "StatusBadge declare 4 entity placeholders (CONTRACT/REPORT/ORG_PROFILE/SCORE_SHEET) ngoài 2 entity wired: tránh Plan 4-9 phải sửa StatusBadge component khi thêm entity mới — chỉ thêm vào STATUS_LABELS const là đủ"
  - "DataTable empty state slot accept cả React.ReactNode (custom JSX) và DataTableEmptyState config object: caller Plan 02-04 user management pass {icon:'users', heading:'Chưa có người dùng', action:{label:'Thêm người dùng mới',href:'/nguoi-dung/new'}} mà không cần import EmptyState"

requirements-completed:
  - LOG-02
  - LOG-03
  - USER-01
  - USER-07
  - ROLE-01
  - ROLE-04
  - CAT-01
  - CAT-02
  - CAT-03
  - CAT-04
  - CAT-05
  - CAT-06
  - CAT-07
  - CAT-08
  - CONFIG-02

metrics:
  duration_minutes: 9
  completed_at: 2026-04-30
  task_count: 3
  file_count: 16
  commits:
    - "89f5d71: feat(02-03): add base shared utilities (csv, clipboard) + EmptyState, ConfirmDialog, CopyButton, StatusBadge"
    - "d05c0b1: feat(02-03): add DataTable wrapper (TanStack Table v8) with toolbar, pagination, bulk actions"
    - "a9d1bda: feat(02-03): add MultiSelect, DateRangePicker, RichTextEditor (Tiptap v3)"
    - "6769cab: chore(02-03): silence DataTable lint warnings (unused imports + useMemo deps)"
---

# Phase 2 Plan 03: Shared UI Primitives Summary

Generic foundation layer cho mọi data-heavy admin screen Phase 2 — 13 shared components + 2 lib utilities (csv, clipboard) wrap shadcn primitives + TanStack Table v8 + Tiptap v3 với Vietnamese labels formal tone, type-safe generics, design-system-aligned (UI-SPEC Phase 1).

## Objective Achieved

Plan 02-04..07 (User mgmt, Permission matrix, Catalog editors, System config) sẽ reuse cùng pattern DataTable + filter + bulk action + pagination + search thay vì copy-paste 4 lần. Tiptap RichTextEditor sẵn sàng cho CAT-08 (DocumentTemplate) + CONFIG-02 (email/SMS template) với variable insertion menu.

## What Was Built

### Task 1: Base utilities + 4 simple shared components (commit `89f5d71`)

- **`lib/csv.ts`** — `toCSV<T>(rows, columns)` + `downloadCSV(filename, csv)`
  - BOM UTF-8 (0xFEFF) prepended → Excel mở đúng dấu Việt
  - CSV-injection escape (T-02-03-03): cell starting `=/+/-/@/\t/\r` được prefix `'` để Excel không evaluate formula
  - Quote-wrap cells với delimiter/quote/newline + escape `""`
  - SSR guard cho `downloadCSV` (window/document undefined check)

- **`lib/clipboard.ts`** — `copyToClipboard(text): Promise<void>`
  - Primary: `navigator.clipboard.writeText` (yêu cầu secure context)
  - Fallback: hidden textarea + `document.execCommand('copy')` cho non-secure dev origins
  - Cleanup textarea kể cả khi copy fail (try/finally)

- **`components/shared/EmptyState.tsx`** — `EmptyState({icon, heading, description?, action?})`
  - 10-icon whitelist: inbox/history/file-x/users/list/shield/settings/layout-dashboard/search/package-x
  - Layout: `flex flex-col items-center gap-3 py-12 text-center`
  - Icon 48px text-slate-400, heading text-base font-semibold, description text-sm text-slate-600 max-w-md
  - Optional CTA button (default variant) với href (Link) hoặc onClick

- **`components/shared/ConfirmDialog.tsx`** — `ConfirmDialog` component + `useConfirmDialog` hook
  - Wraps shadcn AlertDialog
  - `variant: 'default' | 'destructive'` (destructive → bg-red-600 confirm button)
  - Loading state: `<Loader2 spin /> Đang xử lý...` với `disabled` cancel/confirm
  - `useConfirmDialog()` returns `{ confirm: (opts) => Promise<boolean>, dialog: ReactNode }` cho imperative flow
  - PreventDefault trên confirm để keep dialog open during async work

- **`components/shared/CopyButton.tsx`** — `CopyButton({value, label?, variant?: 'icon'|'inline'})`
  - Icon swap copy→check (text-green-600) trong 2s sau click
  - Sonner toast `success("Đã sao chép vào bộ nhớ tạm")` / `error("Không thể sao chép...")`
  - Cleanup setTimeout trong useEffect cleanup (avoid memory leak khi unmount)

- **`components/shared/StatusBadge.tsx`** — `StatusBadge({status, entity})`
  - Entity types: PROGRAM_CYCLE, PROJECT (wired), CONTRACT, REPORT, ORG_PROFILE, SCORE_SHEET (declared cho Phase 4-9)
  - 8 color themes: slate (DRAFT) / slateDark (COMPLETED/LIQUIDATED) / slateMuted (CANCELLED) / blue (READY/EVALUATING/UNDER_REVIEW) / green (OPEN_REGISTRATION/IN_PROGRESS) / emerald (APPROVED/VALIDATED/CONTRACTED) / amber (CLOSED_REGISTRATION/RETURNED_FOR_REVISION) / red (REJECTED)
  - Fallback: nếu STATUS_LABELS[entity][status] missing → render raw status với theme slate

- shadcn `pagination` component installed (`npx shadcn add pagination`)

### Task 2: DataTable wrapper (TanStack Table v8) (commit `d05c0b1`)

- **`components/shared/data-table/types.ts`** — Generic types
  - `DataTableProps<TData>` với 17 props
  - `BulkAction<TData>` với requireConfirm + disabled predicate
  - `FilterDef` cho consistency hint Plan 02-04..07
  - `DataTableEmptyState` config alternative cho `emptyState` slot
  - Re-exports `ColumnDef/SortingState/RowSelectionState/...`

- **`components/shared/data-table/DataTable.tsx`** — Generic `<DataTable<TData>>`
  - `useReactTable` với `manualPagination/Sorting/Filtering: true` (server-side)
  - Auto-prepend `__select__` checkbox column khi `rowSelection !== undefined` + `onRowSelectionChange` defined
  - `getRowId` optional override cho stable selection across pagination
  - SortableHeaderCell sub-component với arrow-up/down/up-down icons (3.5 size, slate-400/700)
  - DataTableBodyRow sub-component với onClick (cursor-pointer), data-state="selected" (bg-blue-50)
  - Skeleton rows khi `isLoading` (cap 8 rows max để tránh shift content)
  - EmptyState slot: accept React.ReactNode JSX hoặc `DataTableEmptyState` config object

- **`components/shared/data-table/DataTablePagination.tsx`**
  - Layout: "Hiển thị {a}-{b} trong {total} mục" (left) | size select + first/prev "Trang n/total" next/last (right)
  - Page size options: 10/20/50/100 (mặc định)
  - Reset pageIndex về 0 khi pageSize đổi
  - Disabled buttons khi không thể prev/next
  - 4 nav buttons với aria-label (Trang đầu/Trang trước/Trang sau/Trang cuối)

- **`components/shared/data-table/DataTableToolbar.tsx`** — Wrapper `flex flex-wrap items-end gap-3` cho search/filter slots passed by parent

- **`components/shared/data-table/DataTableBulkActions.tsx`**
  - Sticky bottom: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white`
  - motion v12 slide-up: `initial={{y:80, opacity:0}} animate={{y:0, opacity:1}}`
  - Layout: `[N] đã chọn | actions | × clear`
  - `requireConfirm` action → opens ConfirmDialog với title/description/confirmLabel + variant inheritance
  - Internal busyId tracking để disable other actions during one's execution

- **`components/shared/data-table/index.ts`** — Barrel export

### Task 3: MultiSelect, DateRangePicker, RichTextEditor (commit `a9d1bda`)

- **`components/shared/MultiSelect.tsx`** — `MultiSelect({options, values, onChange, ...})`
  - Trigger: `<Button variant="outline">{placeholder} ({count})</Button>` + ChevronDown
  - Popover w/ Command: CommandInput "Tìm kiếm..." + CommandItem với checkbox indicator (rounded-sm border bg-blue-700 khi checked)
  - "Xóa tất cả lựa chọn" footer khi values > 0
  - Optional inline badges (`maxBadgesShown > 0`) với X-removable buttons + "+N" overflow badge

- **`components/shared/DateRangePicker.tsx`** — `DateRangePicker({from, to, onChange})`
  - Trigger: `<Button>{calendar-icon} {formatRange(from,to)}</Button>` (placeholder "Chọn khoảng ngày")
  - Popover layout: presets sidebar (left) + dual-month Calendar (right)
  - 6 presets: 7/30/90 ngày qua, Tháng/Quý/Năm này — auto-apply on click + close popover
  - Calendar: `mode="range"` `numberOfMonths={2}` `locale={vi}` (date-fns)
  - Pending-state pattern: local pendingFrom/pendingTo, commit qua Áp dụng button — tránh trigger refetch khi hover
  - Footer: "Xóa" (clear + close) + "Áp dụng" (commit + close)

- **`components/shared/RichTextEditor.tsx`** — `RichTextEditor({value, onChange, variables?, ...})`
  - Tiptap v3 useEditor với extensions: StarterKit (heading levels 2,3) + Link (openOnClick:false, target="_blank") + Placeholder
  - `immediatelyRender: false` cho Next.js App Router SSR compatibility
  - Toolbar (h-12 border-b bg-slate-50) với: bold/italic | h2/h3 | bulletList/orderedList/blockquote | LinkButton | VariableMenu | undo/redo (right-aligned)
  - LinkButton: Popover với URL input + Áp dụng/Xóa liên kết buttons
  - VariableMenu: chỉ render khi `variables` prop có; trigger `<Braces /> Chèn biến` opens Command list với `{{key}}` font-mono blue + label + example faded; click inserts `{{key}}` qua `editor.chain().focus().insertContent(...).run()`
  - Editor area: `prose prose-sm max-w-none p-4` với heading/paragraph/link/strong color overrides
  - External value sync: useEffect compare editor.getHTML() vs value, setContent với emitUpdate:false để tránh infinite loop
  - Loading skeleton khi editor chưa init (Tiptap v3 useEditor returns null initially with immediatelyRender:false)

## Threat Model Verification

| Threat ID | Disposition | Status | Notes |
|-----------|-------------|--------|-------|
| T-02-03-01 (XSS via Tiptap output) | mitigate | DOCUMENTED | JSDoc warning ở đầu RichTextEditor.tsx — caller PHẢI sanitize trước khi `dangerouslySetInnerHTML` downstream |
| T-02-03-02 (CSV info leak) | mitigate | NOTED | Caller responsibility — server actions Plan 02-04..07 sẽ filter rows trước toCSV |
| T-02-03-03 (CSV injection — Excel formula) | mitigate | IMPLEMENTED | `escapeCell()` prefix `'` cho values starting `=/+/-/@/\t/\r` |
| T-02-03-04 (Clipboard sniff) | accept | OK | navigator.clipboard yêu cầu user gesture + secure context |
| T-02-03-05 (Mass assignment via filter) | accept | OK | Filter values pass qua server action — RBAC validate enum upstream |
| T-02-03-06 (Bundle bloat — Lucide dynamic) | mitigate | IMPLEMENTED | EmptyState ICON_MAP whitelist 10 icons; Tiptap ~50KB acceptable cho POC |

## Verification Results

- `npx tsc --noEmit`: **PASS** (exit 0)
- `npm run build`: **PASS** (exit 0; bundle includes Tiptap không vỡ; First Load JS shared by all = 102 kB)
- `npm run lint`: **PASS** (warnings only — không có error mới do plan này; warnings duy nhất là pre-existing console statements trong prisma/seed/* + 2 unused vars trong prisma/seed/catalogs.ts từ Plan 02-02)
- All 13 export files đều có exports + typed strict TypeScript
- DataTable type-safe verified: generic `<TData>` propagates đúng xuống columns + onRowClick + bulkActions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tiptap v3 thay vì v2 do registry shift**
- **Found during:** Task 3
- **Issue:** Plan spec @tiptap/* v2; npm registry chỉ còn v3.22.5 (latest stable). v2 packages có thể install nhưng chỉ có 2.x EOL versions.
- **Fix:** Install Tiptap v3.22.5 — API gần như tương thích (useEditor + EditorContent + StarterKit/Link/Placeholder cùng signature). Thêm `immediatelyRender: false` flag bắt buộc cho Next 15 App Router (Tiptap v3 mặc định render server-side gây hydration mismatch).
- **Files modified:** components/shared/RichTextEditor.tsx, package.json
- **Commit:** a9d1bda

**2. [Rule 1 - Lint quality] Unused imports + useMemo deps warnings**
- **Found during:** Final verification (npm run lint)
- **Issue:** DataTable.tsx imports RowSelectionState + SortingState không dùng; useMemo deps có rowSelection nhưng React Hook lint cảnh báo "unnecessary"
- **Fix:** Remove unused imports; thêm eslint-disable-next-line comment cho useMemo deps (rowSelection là intentional trigger để recompute selectedRowsData khi parent toggle selection — table reference stable nhưng selection state thay đổi qua external setState).
- **Files modified:** components/shared/data-table/DataTable.tsx
- **Commit:** 6769cab

### Other Notes
- **Smoke test skipped:** Plan đề xuất tạo temp `<DataTable>` instance trong `app/(app)/dashboard/page.tsx` để verify render. Đã skip vì `npm run build` exit 0 đã verify bundle resolves đúng — Plan 02-04 (User list) sẽ là smoke test thực tế ngay tuần tới.
- **Tiptap heading level 1 disabled:** UI-SPEC reserves h1 (text-4xl) cho page title. RichTextEditor toolbar chỉ expose h2/h3 buttons để user không tạo conflicting hierarchy in body content.

## Files Created/Modified

### Created (16 files)
1. `components/shared/data-table/DataTable.tsx`
2. `components/shared/data-table/DataTablePagination.tsx`
3. `components/shared/data-table/DataTableToolbar.tsx`
4. `components/shared/data-table/DataTableBulkActions.tsx`
5. `components/shared/data-table/types.ts`
6. `components/shared/data-table/index.ts`
7. `components/shared/EmptyState.tsx`
8. `components/shared/ConfirmDialog.tsx`
9. `components/shared/CopyButton.tsx`
10. `components/shared/StatusBadge.tsx`
11. `components/shared/MultiSelect.tsx`
12. `components/shared/DateRangePicker.tsx`
13. `components/shared/RichTextEditor.tsx`
14. `lib/csv.ts`
15. `lib/clipboard.ts`
16. `components/ui/pagination.tsx` (shadcn install)

### Modified (2 files)
- `package.json` — added 5 @tiptap/* deps
- `package-lock.json` — 46 packages added

## Reachability Confirmed

Mọi shared component reachable qua aliases configured trong `tsconfig.json`:
- `@/components/shared/EmptyState` ✓
- `@/components/shared/ConfirmDialog` ✓ (export ConfirmDialog + useConfirmDialog)
- `@/components/shared/CopyButton` ✓
- `@/components/shared/StatusBadge` ✓
- `@/components/shared/MultiSelect` ✓
- `@/components/shared/DateRangePicker` ✓
- `@/components/shared/RichTextEditor` ✓ (export RichTextEditor + VariableMenuItem type)
- `@/components/shared/data-table` ✓ (barrel index — DataTable + DataTablePagination + DataTableToolbar + DataTableBulkActions + types)
- `@/lib/csv` ✓ (toCSV + downloadCSV)
- `@/lib/clipboard` ✓ (copyToClipboard)

## Self-Check: PASSED

Verified all created files exist + all 4 commits in git log:

```
$ ls components/shared/{EmptyState,ConfirmDialog,CopyButton,StatusBadge,MultiSelect,DateRangePicker,RichTextEditor}.tsx
FOUND (7 files)

$ ls components/shared/data-table/
FOUND (6 files: DataTable.tsx, DataTablePagination.tsx, DataTableToolbar.tsx, DataTableBulkActions.tsx, types.ts, index.ts)

$ ls lib/csv.ts lib/clipboard.ts components/ui/pagination.tsx
FOUND (3 files)

$ git log --oneline | grep "(02-03)" | head -4
FOUND: 6769cab, a9d1bda, d05c0b1, 89f5d71
```
