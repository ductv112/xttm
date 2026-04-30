import type {
  ColumnDef,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  Row,
} from '@tanstack/react-table';
import type * as React from 'react';

import type { EmptyStateIcon } from '@/components/shared/EmptyState';

/**
 * Re-exports for downstream callers — Plan 02-04..07 chỉ import từ
 * @/components/shared/data-table thay vì pull trực tiếp tanstack/react-table.
 */
export type {
  ColumnDef,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  Row,
};

/**
 * Bulk action descriptor — render trong sticky bottom toolbar khi
 * có row selection.
 */
export type BulkAction<TData> = {
  /** Stable id (used as React key) */
  id: string;
  label: string;
  /** Lucide icon name (string) — render qua dynamic registry phía consumer */
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  /** Async callback — receives selected row data array */
  onClick: (selectedRows: TData[]) => Promise<void> | void;
  /** Nếu set, mở ConfirmDialog trước khi gọi onClick */
  requireConfirm?: {
    title: string;
    description: string;
    confirmLabel?: string;
  };
  /** Optional disable predicate — hide/disable action based on selection */
  disabled?: boolean | ((selectedRows: TData[]) => boolean);
};

/**
 * Filter slot definition — caller renders own filter UI và pass children
 * vào toolbarSlot. FilterDef là helper type cho consistency Plan 02-04..07.
 */
export type FilterDef = {
  id: string;
  type: 'select' | 'multi-select' | 'date-range' | 'text';
  label: string;
  options?: { value: string; label: string }[];
};

export type DataTableEmptyState = {
  icon: EmptyStateIcon;
  heading: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
};

export type DataTableProps<TData> = {
  /** TanStack Table column definitions */
  columns: ColumnDef<TData, unknown>[];
  /** Current page rows (server-side paginated) */
  data: TData[];
  /** Server-side total record count — used for pageCount calculation */
  total: number;
  /** 0-based page index */
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number, pageSize: number) => void;

  /** Optional sorting — server-side khi onSortingChange được provide */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  /** Optional row selection — checkbox column tự prepended khi defined */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  /** Click handler khi user click 1 row (cursor-pointer + hover) */
  onRowClick?: (row: TData) => void;

  /** Override row id resolver — default dùng index. Cần cho stable selection. */
  getRowId?: (row: TData, index: number) => string;

  /** Hiển thị skeleton rows khi đang fetch */
  isLoading?: boolean;

  /** Custom empty state — override default "Chưa có dữ liệu" */
  emptyState?: DataTableEmptyState | React.ReactNode;

  /** Toolbar children — search input + filter components rendered above table */
  toolbarSlot?: React.ReactNode;

  /** Bulk actions rendered in sticky bottom toolbar */
  bulkActions?: BulkAction<TData>[];

  /** Visual density — comfortable (default per CONTEXT.md) hoặc compact */
  density?: 'comfortable' | 'compact';

  /** Optional className cho outer wrapper */
  className?: string;
};
