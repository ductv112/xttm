---
phase: 02-m1-quan-tri-danh-muc
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - components/shared/data-table/DataTable.tsx
  - components/shared/data-table/DataTablePagination.tsx
  - components/shared/data-table/DataTableToolbar.tsx
  - components/shared/data-table/DataTableBulkActions.tsx
  - components/shared/data-table/types.ts
  - components/shared/EmptyState.tsx
  - components/shared/ConfirmDialog.tsx
  - components/shared/CopyButton.tsx
  - components/shared/RichTextEditor.tsx
  - components/shared/DateRangePicker.tsx
  - components/shared/MultiSelect.tsx
  - components/shared/StatusBadge.tsx
  - lib/csv.ts
  - lib/clipboard.ts
autonomous: true
requirements: [LOG-02, LOG-03, USER-01, USER-07, ROLE-01, ROLE-04, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08, CONFIG-02]
tags: [shared-ui, data-table, tanstack-table, tiptap, design-system-extension]

must_haves:
  truths:
    - "DataTable wrapper với props {columns, data, total, pageIndex, pageSize, onPageChange, onSortChange, onFilterChange, rowSelection, onRowSelectionChange, onRowClick} hoạt động được, type-safe via generics <TData>"
    - "DataTable hiển thị: search bar (debounced 300ms), filter slots (children prop), bulk action toolbar sticky bottom khi có rowSelection, pagination 10/20/50/100 page size, sort indicators trên column header"
    - "EmptyState component nhận {icon, heading, description, action?} render layout chuẩn UI-SPEC (icon 48px text-slate-400, heading text-base font-semibold, body text-sm text-slate-600 max-w-md, py-12)"
    - "ConfirmDialog component nhận {open, onOpenChange, title, description, confirmLabel, cancelLabel, variant: 'default'|'destructive', onConfirm, loading?} — wrap shadcn AlertDialog"
    - "RichTextEditor component nhận {value, onChange, placeholder?, variables?: VariableMenuItem[], onVariableInsert?} — Tiptap v2 với toolbar bold/italic/list/link và VariableMenu popover insert {{tenChuongTrinh}} placeholder"
    - "MultiSelect, DateRangePicker, StatusBadge, CopyButton — wrap shadcn primitives với Vietnamese labels formal tone"
    - "lib/csv.ts toCSV(rows, columns) trả string với BOM UTF-8; lib/clipboard.ts copyToClipboard(text) Promise<void> qua navigator.clipboard.writeText fallback document.execCommand"
  artifacts:
    - path: "components/shared/data-table/DataTable.tsx"
      provides: "Generic DataTable wrapper based on TanStack Table v8"
      exports: ["DataTable"]
      min_lines: 150
    - path: "components/shared/data-table/types.ts"
      provides: "DataTableProps<TData>, ColumnDef<TData> re-exports + filter slot types"
      exports: ["DataTableProps", "FilterDef"]
    - path: "components/shared/EmptyState.tsx"
      provides: "Reusable empty state pattern"
      exports: ["EmptyState"]
    - path: "components/shared/ConfirmDialog.tsx"
      provides: "Confirmation dialog wrapper với variant destructive"
      exports: ["ConfirmDialog", "useConfirmDialog"]
    - path: "components/shared/RichTextEditor.tsx"
      provides: "Tiptap v2 editor với toolbar + variable insertion"
      exports: ["RichTextEditor"]
    - path: "components/shared/MultiSelect.tsx"
      provides: "Multi-select combobox với checkbox + badge counter"
      exports: ["MultiSelect"]
    - path: "components/shared/DateRangePicker.tsx"
      provides: "Date range picker dạng popover dual-month calendar locale vi"
      exports: ["DateRangePicker"]
    - path: "components/shared/StatusBadge.tsx"
      provides: "Status badge variant theo entity (project/cycle/contract/...) với label VN từ STATUS_LABELS"
      exports: ["StatusBadge"]
    - path: "components/shared/CopyButton.tsx"
      provides: "Copy-to-clipboard button với icon swap + toast"
      exports: ["CopyButton"]
    - path: "lib/csv.ts"
      provides: "toCSV(rows, columns) helper với BOM UTF-8 + escape quotes"
      exports: ["toCSV", "downloadCSV"]
    - path: "lib/clipboard.ts"
      provides: "copyToClipboard(text) helper với fallback"
      exports: ["copyToClipboard"]
  key_links:
    - from: "components/shared/data-table/DataTable.tsx"
      to: "@tanstack/react-table"
      via: "useReactTable hook + flexRender"
      pattern: "useReactTable\\(|flexRender"
    - from: "components/shared/RichTextEditor.tsx"
      to: "@tiptap/react"
      via: "useEditor + EditorContent"
      pattern: "useEditor"
    - from: "lib/csv.ts toCSV"
      to: "Blob download"
      via: "downloadCSV(filename, csv) creates Blob + anchor click"
      pattern: "Blob|URL.createObjectURL"
---

<objective>
Build thư viện shared UI primitives để Plan 02-04..07 (User mgmt, Role matrix, Catalog editors, System config) reuse — DRY pattern thay vì copy-paste DataTable 4 lần. Phase 1 đã có 18 shadcn UI primitives + AppShell layout; Phase 2 plan này thêm lớp shared business components specific cho admin/data-heavy screens.

Purpose: Permission matrix grid, 8 catalog list views, user list, audit log list — tất cả share cùng DataTable + filter + bulk action + pagination + search pattern. Build 1 lần, reuse 4 lần. Tiptap editor needed cho cả CAT-08 (DocumentTemplate) và CONFIG-02 (email/SMS template).

Output: 11 shared components + 2 lib utilities (csv, clipboard). All typed strict TypeScript, design-system-aligned (UI-SPEC Phase 1).
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
@.planning/research/STACK.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@components/ui/button.tsx
@components/ui/input.tsx
@components/ui/dropdown-menu.tsx
@components/ui/sheet.tsx
@components/ui/alert-dialog.tsx
@lib/format.ts
@lib/constants.ts
@lib/vi-search.ts

<interfaces>
From shadcn/ui (Phase 1 already installed):
- `@/components/ui/button` — Button, buttonVariants
- `@/components/ui/input` — Input
- `@/components/ui/popover` — Popover, PopoverTrigger, PopoverContent (install in Task 1 nếu chưa)
- `@/components/ui/command` — Command, CommandInput, CommandList, CommandItem, CommandEmpty (install nếu chưa)
- `@/components/ui/calendar` — Calendar (install nếu chưa)
- `@/components/ui/checkbox` — Checkbox
- `@/components/ui/badge` — Badge
- `@/components/ui/select` — Select (install nếu chưa)
- `@/components/ui/dropdown-menu` — DropdownMenu, DropdownMenuTrigger, DropdownMenuContent
- `@/components/ui/alert-dialog` — AlertDialog full set
- `@/components/ui/table` — Table primitives (install nếu chưa)
- `@/components/ui/pagination` — Pagination primitives (install nếu chưa)
- `@/components/ui/sonner` — toast()

From @tanstack/react-table v8 (Phase 1 installed):
```typescript
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState, type ColumnFiltersState,
  type RowSelectionState, type PaginationState, type Row
} from '@tanstack/react-table';
```

From lib/format.ts:
```typescript
export function formatDate(d: Date | string, fmt?: string): string;
```

From lib/constants.ts:
```typescript
export const STATUS_LABELS: { PROGRAM_CYCLE: {...}; PROJECT: {...} };
```

From date-fns:
```typescript
import { format, addDays, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
```

From Tiptap v2 (Phase 1 deps if installed; check package.json — if missing, install in Task 4):
```typescript
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
```
</interfaces>

<ui_design_contract>
REUSE Phase 1 UI-SPEC.md design system. New patterns added by this plan:

### DataTable visual:
- Header row: `bg-slate-100 text-slate-700 text-sm font-semibold`, sticky top khi scroll
- Body rows: `hover:bg-slate-50` cursor-pointer khi onRowClick có; `aria-selected:bg-blue-50` khi rowSelection
- Cell padding: `px-4 py-3`
- Border: `border-b border-slate-200` giữa rows
- Sort indicator: lucide `arrow-up`/`arrow-down`/`arrows-up-down` 14px next to header label
- Pagination footer: `flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-white`

### Bulk action toolbar (sticky bottom):
- Position: `fixed bottom-6 left-1/2 -translate-x-1/2`, z-index 50
- Background: `bg-slate-900 text-white`, `rounded-md shadow-lg px-6 py-3`
- Flex layout: `[N] đã chọn | actions buttons | × close`
- Show animation: slide-up khi rowSelection.length > 0 (motion v12)

### EmptyState:
- Layout: `flex flex-col items-center text-center gap-3 py-12`
- Icon: `lucide:[provided]` 48px `text-slate-400`
- Heading: `text-base font-semibold text-slate-900`
- Description: `text-sm text-slate-600 max-w-md`
- CTA button (optional): `Button variant="default" mt-4`

### ConfirmDialog:
- Title `text-lg font-semibold` (uses shadcn AlertDialogTitle)
- Variant `destructive`: confirm button `bg-red-600 hover:bg-red-700`
- Variant `default`: confirm button `bg-blue-700`
- Cancel auto-focus, ESC = cancel
- Loading state: spinner + "Đang xử lý..."

### RichTextEditor:
- Toolbar height `h-12 border-b bg-slate-50`, buttons icon-only `lucide:bold|italic|list|link|paragraph` 16px
- Editor area `min-h-[200px] p-4 prose prose-sm max-w-none`
- Variable menu trigger button `<lucide:braces /> Chèn biến` opens popover with searchable list
- Border: `border border-slate-200 rounded-md`

### MultiSelect:
- Trigger: `<Button variant="outline">{selectedCount > 0 ? `${label} (${selectedCount})` : label}</Button>`
- Popover content: Command list với CommandInput search + CommandItem + Checkbox left side
- Selected items hiển thị inline as Badge X-removable bên dưới trigger (optional)

### DateRangePicker:
- Trigger: `<Button variant="outline"><lucide:calendar />{from && to ? formatRange(from,to) : 'Chọn khoảng ngày'}</Button>`
- Popover: 2-month calendar side-by-side (Calendar mode="range")
- Locale: vi (date-fns)
- Quick presets dropdown: "7 ngày qua", "30 ngày qua", "Tháng này", "Năm này"

### Tone Vietnamese:
- "Tìm kiếm..." (search), "Áp dụng" (apply), "Xóa bộ lọc" (clear filter)
- "Trang {n}/{total}" (pagination), "Hiển thị {a}-{b} trong {total}"
- "Đã chọn {n} mục" (bulk selection), "Bỏ chọn" (deselect)
- "Chưa có dữ liệu" (empty state default)
</ui_design_contract>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install missing shadcn primitives + base utilities (csv, clipboard, EmptyState, ConfirmDialog, CopyButton, StatusBadge)</name>
  <files>lib/csv.ts, lib/clipboard.ts, components/shared/EmptyState.tsx, components/shared/ConfirmDialog.tsx, components/shared/CopyButton.tsx, components/shared/StatusBadge.tsx</files>
  <read_first>
    - components.json (verify shadcn config)
    - components/ui/* directory listing — xác định components nào cần install thêm
    - lib/constants.ts STATUS_LABELS để StatusBadge map
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (Empty State Pattern + Confirmation patterns)
  </read_first>
  <action>
    Install shadcn components còn thiếu (chạy lệnh, idempotent — đã có thì skip):
    ```bash
    npx shadcn add table pagination popover command checkbox select calendar
    ```

    **`lib/csv.ts`**:
    ```typescript
    type CSVColumn<T> = { key: keyof T | string; header: string; format?: (row: T) => string };
    
    export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: CSVColumn<T>[]): string {
      const escape = (v: unknown): string => {
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = columns.map(c => escape(c.header)).join(',');
      const lines = rows.map(row =>
        columns.map(c => escape(c.format ? c.format(row) : row[c.key as keyof T])).join(',')
      );
      // BOM UTF-8 cho Excel mở đúng dấu Việt
      const BOM = String.fromCharCode(0xFEFF);
      return BOM + [header, ...lines].join('\n');
    }
    
    export function downloadCSV(filename: string, csv: string): void {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
    ```

    **`lib/clipboard.ts`**:
    ```typescript
    export async function copyToClipboard(text: string): Promise<void> {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text); return;
      }
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); }
      finally { document.body.removeChild(ta); }
    }
    ```

    **`components/shared/EmptyState.tsx`** — `'use client'` (uses lucide icon dynamic):
    ```typescript
    type Props = {
      icon: keyof typeof iconMap; // 'inbox' | 'history' | 'file-x' | 'users' | 'list' | 'shield' | 'settings'
      heading: string;
      description?: string;
      action?: { label: string; onClick?: () => void; href?: string };
    };
    ```
    Use `dynamic` icon registry from lucide-react với 7-10 icons whitelist (avoid bundle bloat). Layout per UI-SPEC.

    **`components/shared/ConfirmDialog.tsx`** — wrap shadcn AlertDialog:
    Props: `{ open, onOpenChange, title, description, confirmLabel, cancelLabel?, variant?: 'default'|'destructive', onConfirm: () => Promise<void> | void, loading?: boolean }`. Default cancelLabel "Hủy". When `loading`, confirm button shows `<Loader2 className="animate-spin" /> Đang xử lý...`. Auto-focus cancel button (defensive).
    Also export `useConfirmDialog()` hook returns `{ confirm: (opts) => Promise<boolean>, dialog: ReactNode }` for imperative usage.

    **`components/shared/CopyButton.tsx`** — `'use client'`:
    Props: `{ value: string; label?: string; variant?: 'icon'|'inline' }`. Inline shows `lucide:copy` + label "Sao chép". Icon-only mode shows just lucide:copy. After click: swap icon to `lucide:check` 2s + sonner toast "Đã sao chép vào bộ nhớ tạm".

    **`components/shared/StatusBadge.tsx`**:
    Props: `{ status: string; entity: 'PROJECT' | 'PROGRAM_CYCLE' | 'CONTRACT' | 'REPORT' | 'ORG_PROFILE' | 'SCORE_SHEET' }`.
    Maps status to:
    - Color theme: DRAFT=slate, READY/SUBMITTED=blue, OPEN_REGISTRATION=green, CLOSED_REGISTRATION=amber, EVALUATING/UNDER_REVIEW=blue, APPROVED/VALIDATED=emerald, REJECTED=red, COMPLETED=slate-700, CANCELLED=slate-400
    - Label tiếng Việt từ STATUS_LABELS[entity][status]
    Render: `<Badge className={...}>{label}</Badge>`. Phase 2 chỉ implement PROGRAM_CYCLE + PROJECT (đã có trong constants); 4 entity còn lại declare structure để Phase 4-9 thêm vào.
  </action>
  <acceptance_criteria>
    - `lib/csv.ts` exports `toCSV`, `downloadCSV` (`grep "^export" lib/csv.ts | wc -l` ≥ 2)
    - `lib/csv.ts` chứa `0xFEFF` (BOM) (`grep "0xFEFF" lib/csv.ts` returns 1)
    - `lib/clipboard.ts` exports `copyToClipboard` với cả `navigator.clipboard` path và `document.execCommand` fallback
    - 4 components/shared/*.tsx files đều có `'use client'` directive khi cần (EmptyState/ConfirmDialog/CopyButton/StatusBadge)
    - shadcn Table, Pagination, Popover, Command, Checkbox, Select, Calendar đều tồn tại trong components/ui/ (`ls components/ui/ | grep -E "table|pagination|popover|command|checkbox|select|calendar" | wc -l` ≥ 7)
    - `npx tsc --noEmit` exit 0
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && ls lib/csv.ts lib/clipboard.ts components/shared/EmptyState.tsx components/shared/ConfirmDialog.tsx components/shared/CopyButton.tsx components/shared/StatusBadge.tsx</automated>
  </verify>
  <done>2 lib utilities + 4 base shared components, shadcn primitives đầy đủ, typecheck pass.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: DataTable wrapper (TanStack Table v8) + sub-components (toolbar, pagination, bulk actions)</name>
  <files>components/shared/data-table/types.ts, components/shared/data-table/DataTable.tsx, components/shared/data-table/DataTablePagination.tsx, components/shared/data-table/DataTableToolbar.tsx, components/shared/data-table/DataTableBulkActions.tsx</files>
  <read_first>
    - .planning/research/STACK.md §2 (TanStack Table v8 patterns) + §11 (data-table component note)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (USER list comfortable density, server-side pagination, debounced search 300ms, bulk action toolbar)
    - components/ui/table.tsx (shadcn Table primitives)
    - app/(app)/nhat-ky/_components/AuditLogTable.tsx (Plan 02-01 inline DataTable — refactor pattern hiểu sau)
  </read_first>
  <action>
    **`components/shared/data-table/types.ts`**:
    ```typescript
    import type { ColumnDef, RowSelectionState, SortingState, ColumnFiltersState } from '@tanstack/react-table';
    
    export type DataTableProps<TData> = {
      columns: ColumnDef<TData, unknown>[];
      data: TData[];
      total: number;                    // server-side total
      pageIndex: number;                // 0-based
      pageSize: number;
      onPageChange: (pageIndex: number, pageSize: number) => void;
      sorting?: SortingState;
      onSortingChange?: (s: SortingState) => void;
      rowSelection?: RowSelectionState;
      onRowSelectionChange?: (s: RowSelectionState) => void;
      onRowClick?: (row: TData) => void;
      getRowId?: (row: TData) => string;
      isLoading?: boolean;
      emptyState?: React.ReactNode;
      toolbarSlot?: React.ReactNode;    // search bar + filter chips
      bulkActions?: BulkAction<TData>[];
      density?: 'comfortable' | 'compact'; // default 'comfortable' per CONTEXT
    };
    
    export type BulkAction<TData> = {
      id: string;
      label: string;
      icon?: string; // lucide name
      variant?: 'default' | 'destructive';
      onClick: (selectedRows: TData[]) => Promise<void> | void;
      requireConfirm?: { title: string; description: string };
    };
    
    export type FilterDef = {
      id: string;
      type: 'select' | 'multi-select' | 'date-range' | 'text';
      label: string;
      options?: { value: string; label: string }[];
    };
    ```

    **`components/shared/data-table/DataTable.tsx`** — `'use client'`:
    - Generic `<TData>` component
    - useReactTable với `manualPagination: true`, `manualSorting: true`, `manualFiltering: true` (server-side)
    - `pageCount: Math.ceil(total / pageSize)`
    - Render:
      ```tsx
      <div className="space-y-4">
        {toolbarSlot && <DataTableToolbar>{toolbarSlot}</DataTableToolbar>}
        <div className="rounded-md border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-100 sticky top-0 z-10">
              {/* render headerGroups + sort indicators */}
            </TableHeader>
            <TableBody>
              {isLoading ? <SkeletonRows count={pageSize} /> :
                rows.length === 0 ? <EmptyRow>{emptyState ?? <EmptyState ... />}</EmptyRow> :
                rows.map(row => <DataTableRow ... onClick={onRowClick} />)}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination pageIndex={pageIndex} pageSize={pageSize} total={total} onChange={onPageChange} />
        {selectedRowsCount > 0 && bulkActions?.length > 0 && (
          <DataTableBulkActions selected={selectedRowsObjects} actions={bulkActions} onClear={() => onRowSelectionChange?.({})} />
        )}
      </div>
      ```
    - Sort: click header cell triggers `onSortingChange([{id, desc: !current.desc}])`
    - Selection: checkbox column auto-prepended nếu `rowSelection !== undefined`

    **`DataTablePagination.tsx`**:
    - Layout: `flex items-center justify-between text-sm text-slate-600`
    - Left: "Hiển thị {pageIndex*pageSize + 1}-{Math.min((pageIndex+1)*pageSize, total)} trong {formatNumber(total)} mục"
    - Right: page size Select (10/20/50/100) + button prev/first/last/next + "Trang {pageIndex+1}/{Math.ceil(total/pageSize)}"
    - Khi pageSize đổi: reset pageIndex về 0

    **`DataTableToolbar.tsx`** — wrapper `<div className="flex flex-wrap items-end gap-3">{children}</div>`. Children là search Input + filter components (passed by parent).

    **`DataTableBulkActions.tsx`** — sticky bottom toolbar với motion v12 slide-up:
    ```tsx
    <motion.div initial={{y: 80, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 80, opacity: 0}}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-md shadow-lg px-6 py-3 flex items-center gap-4">
      <span>Đã chọn {selected.length} mục</span>
      {actions.map(a => <Button variant={a.variant} onClick={...}>{a.icon}{a.label}</Button>)}
      <Button variant="ghost" size="icon" onClick={onClear}><X /></Button>
    </motion.div>
    ```
    Khi action có `requireConfirm`: mở ConfirmDialog (Task 1) trước khi run onClick.

    Smoke test (xóa sau): tạo `app/(app)/dashboard/page.tsx` thêm tạm 1 instance `<DataTable columns=[{id:'name', header:'Tên', accessorKey:'name'}] data=[{name:'A'},{name:'B'}] total={2} pageIndex={0} pageSize={20} onPageChange={()=>{}} />` → verify render → revert sau khi test.
  </action>
  <acceptance_criteria>
    - 4 files tạo xong + types.ts (5 files total)
    - `grep "useReactTable" components/shared/data-table/DataTable.tsx` returns 1
    - `grep "manualPagination: true" components/shared/data-table/DataTable.tsx` returns 1
    - `grep "manualSorting: true" components/shared/data-table/DataTable.tsx` returns 1
    - `grep "Đã chọn" components/shared/data-table/DataTableBulkActions.tsx` returns 1 (Vietnamese label)
    - `grep "Hiển thị" components/shared/data-table/DataTablePagination.tsx` returns 1 (Vietnamese label)
    - `npx tsc --noEmit` exit 0
    - `npm run build` exit 0 — DataTable bundle resolves
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>DataTable wrapper TanStack Table v8 generic typed, pagination Vietnamese, bulk action sticky bottom với motion slide-up, empty state slot, type-safe props.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: MultiSelect, DateRangePicker, RichTextEditor (Tiptap)</name>
  <files>components/shared/MultiSelect.tsx, components/shared/DateRangePicker.tsx, components/shared/RichTextEditor.tsx</files>
  <read_first>
    - .planning/research/STACK.md §8 (Tiptap setup + extensions list)
    - components/ui/popover.tsx, command.tsx, calendar.tsx, checkbox.tsx (verify shadcn primitives sẵn sàng)
    - package.json (verify Tiptap deps; if missing install in this task)
  </read_first>
  <action>
    Install Tiptap nếu chưa có (Phase 1 SUMMARY không list Tiptap → install):
    ```bash
    npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
    ```

    **`MultiSelect.tsx`** — `'use client'`:
    Props: `{ options: {value:string; label:string}[]; values: string[]; onChange: (v:string[])=>void; placeholder?: string; searchPlaceholder?: string; emptyText?: string; maxBadgesShown?: number; }`.
    Uses shadcn `Popover` + `Command` (CommandInput, CommandList, CommandGroup, CommandItem with Checkbox indicator).
    Trigger button: `<Button variant="outline" className="justify-between">{values.length === 0 ? placeholder : `${placeholder} (${values.length})`} <ChevronDown /></Button>`.
    Selected items hiển thị inline below trigger as removable Badge X (chỉ khi maxBadgesShown > 0).
    Defaults: placeholder="Chọn...", searchPlaceholder="Tìm kiếm...", emptyText="Không tìm thấy kết quả".

    **`DateRangePicker.tsx`** — `'use client'`:
    Props: `{ from?: Date; to?: Date; onChange: (range: {from?: Date; to?: Date}) => void; placeholder?: string; align?: 'start'|'end'; }`.
    Uses shadcn `Popover` + `Calendar` mode="range" với locale `vi` from date-fns.
    Trigger button shows "Chọn khoảng ngày" hoặc `${formatDate(from)} → ${formatDate(to)}` (or "Từ ${formatDate(from)}" if only from).
    Popover content has 2 sections:
      1. Quick presets (vertical list buttons): "7 ngày qua", "30 ngày qua", "90 ngày qua", "Tháng này", "Quý này", "Năm nay" — onClick set range theo computed dates
      2. Calendar dual-month mode="range" với locale vi
    Footer: button "Xóa" (clear) + "Áp dụng" (close popover).

    **`RichTextEditor.tsx`** — `'use client'`:
    Props: `{ value: string; onChange: (html: string) => void; placeholder?: string; variables?: VariableMenuItem[]; minHeight?: number; readOnly?: boolean; }`.
    Type `VariableMenuItem = { key: string; label: string; example?: string; }`.
    Setup useEditor với extensions: `StarterKit`, `Link.configure({openOnClick: false})`, `Placeholder.configure({placeholder: placeholder || 'Nhập nội dung...'})`.
    Toolbar (border-b bg-slate-50 h-12 flex items-center px-2 gap-1):
    - Button bold (lucide:bold)
    - Button italic (lucide:italic)
    - Button bullet list (lucide:list)
    - Button ordered list (lucide:list-ordered)
    - Button link (lucide:link — toggleLink with prompt)
    - Separator
    - VariableMenu (Popover): trigger button `<lucide:braces /> Chèn biến` — nếu `variables` prop có
      - Popover Command list with CommandInput "Tìm biến..."
      - CommandItem mỗi variable: hiển thị `{{${key}}}` + label + example (faded)
      - Click → `editor.commands.insertContent('{{${key}}}')`
    - Toggle active state cho mỗi button qua `editor.isActive('bold')` etc.
    Editor area: `<EditorContent editor={editor} className="min-h-[200px] p-4 prose prose-sm max-w-none" />`.
    Wrap container: `<div className="border border-slate-200 rounded-md">{toolbar}{content}</div>`.
    onChange: `editor.on('update', () => onChange(editor.getHTML()))`.

    Acceptance: editor renders, type "test" → onChange fires với HTML; click bold → wraps selection; click variable → inserts `{{var}}`.
  </action>
  <acceptance_criteria>
    - `package.json` có `@tiptap/react` (`grep '"@tiptap/react"' package.json` returns 1)
    - 3 files tạo, mỗi file `'use client'` đầu file
    - `grep "useEditor" components/shared/RichTextEditor.tsx` returns 1
    - `grep "StarterKit" components/shared/RichTextEditor.tsx` returns 1
    - `grep "mode=\"range\"\\|mode={'range'}" components/shared/DateRangePicker.tsx` returns ≥1
    - `grep "Chèn biến\\|braces" components/shared/RichTextEditor.tsx` returns ≥1
    - `npx tsc --noEmit` exit 0
    - `npm run build` exit 0
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>MultiSelect (Combobox + Checkbox), DateRangePicker (dual-month + presets), RichTextEditor (Tiptap toolbar + variable insertion) — all tiếng Việt, design-system-aligned.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser DOM → React state | DataTable receives data từ Server Action — already RBAC-filtered upstream; client component không có direct DB access |
| RichTextEditor HTML output | Tiptap output là HTML string lưu DB; risk XSS nếu render qua `dangerouslySetInnerHTML` ở downstream component |
| Clipboard API | navigator.clipboard chỉ hoạt động trong secure context (HTTPS hoặc localhost); fallback document.execCommand cho dev fallback |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-03-01 | T (XSS via Tiptap output) | RichTextEditor → bodyHtml DB | mitigate | Tiptap output là HTML safe by default (StarterKit không expose `<script>`); downstream render PHẢI sanitize hoặc dùng iframe sandbox cho preview; điểm này document trong RichTextEditor JSDoc warning |
| T-02-03-02 | I (Info leak via CSV export) | lib/csv.ts toCSV/downloadCSV | mitigate | Caller chịu trách nhiệm filter rows trước khi pass vào toCSV; toCSV pure function không có DB access |
| T-02-03-03 | T (CSV injection — Excel formula) | lib/csv.ts toCSV | mitigate | Escape `=`/`+`/`-`/`@` ở đầu cell value bằng prefix tab `\t` để Excel không evaluate formula; thêm trong toCSV escape function |
| T-02-03-04 | I (Clipboard sniff) | lib/clipboard.ts | accept | navigator.clipboard yêu cầu user gesture + secure context; fallback execCommand cũng cần user click; POC scope acceptable |
| T-02-03-05 | T (Mass assignment via DataTable filter) | DataTable filter slot | accept | Filter values pass qua server action — server action validate enum values (Plan 02-04..07); DataTable chỉ là UI |
| T-02-03-06 | D (Bundle bloat) | Lucide icon dynamic | mitigate | Whitelist 7-10 icons trong EmptyState (icon-map enum), tree-shake friendly; Tiptap gzipped ~50KB, acceptable |
</threat_model>

<verification>
- `npx tsc --noEmit` exit 0
- `npm run lint` exit 0
- `npm run build` exit 0 — bundle bao gồm Tiptap không vỡ
- Smoke test thủ công: tạo `app/(app)/dashboard/page.tsx` instance tạm `<DataTable>` + `<EmptyState>` + `<RichTextEditor>` → verify render trên `/dashboard` → revert
- All 13 export files (data-table 5 + 6 shared + 2 lib) đều có exports + typed strict
- DataTable type-safe: thử pass wrong type column → tsc complain
</verification>

<success_criteria>
- Plan 02-04 (User list) sẽ import DataTable + EmptyState + ConfirmDialog + MultiSelect → render user list trong < 50 dòng code component
- Plan 02-05 (Permission matrix) sẽ import DataTable + ConfirmDialog
- Plan 02-06 (Catalog editors) sẽ import DataTable + ConfirmDialog + RichTextEditor (cho DocumentTemplate) + MultiSelect (cho ScoringCriterion appliesToKinds)
- Plan 02-07 (System config) sẽ import RichTextEditor (email template) + ConfirmDialog
- 02-01 audit log sẽ refactor inline DataTable sang shared DataTable trong follow-up (Plan 02-01 ship trước, 02-04 trở đi dùng shared — refactor 02-01 là optional polish nếu thời gian)
- Reachability: shared components reachable qua `@/components/shared/...` import alias đã set tsconfig
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-03-shared-ui-primitives-SUMMARY.md`
</output>
