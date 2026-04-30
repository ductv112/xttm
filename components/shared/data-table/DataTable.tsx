'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Header,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableBulkActions } from './DataTableBulkActions';
import type { DataTableProps, DataTableEmptyState } from './types';

const DENSITY_PADDING = {
  comfortable: 'px-4 py-3',
  compact: 'px-3 py-2',
} as const;

function isEmptyStateConfig(value: unknown): value is DataTableEmptyState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'icon' in value &&
    'heading' in value
  );
}

/**
 * Generic DataTable wrapper based on TanStack Table v8.
 *
 * - Server-side pagination/sorting/filtering (manualPagination + manualSorting)
 * - Optional row selection (auto-prepends checkbox column)
 * - Optional sticky-bottom bulk action toolbar
 * - Optional toolbar slot above table
 * - Empty state via EmptyState component
 * - Loading skeleton rows
 *
 * @example
 *   <DataTable
 *     columns={columns}
 *     data={users}
 *     total={meta.total}
 *     pageIndex={page - 1}
 *     pageSize={20}
 *     onPageChange={(p, s) => setPage({ page: p + 1, size: s })}
 *   />
 */
export function DataTable<TData>({
  columns,
  data,
  total,
  pageIndex,
  pageSize,
  onPageChange,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  getRowId,
  isLoading,
  emptyState,
  toolbarSlot,
  bulkActions,
  density = 'comfortable',
  className,
}: DataTableProps<TData>) {
  const hasSelection = rowSelection !== undefined && onRowSelectionChange !== undefined;

  // Auto-prepend checkbox column when selection is enabled
  const finalColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!hasSelection) return columns;

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: '__select__',
      enableSorting: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Chọn tất cả các dòng trên trang này"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Chọn dòng"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [columns, hasSelection]);

  const pageCount = React.useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const table = useReactTable<TData>({
    data,
    columns: finalColumns,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      ...(sorting !== undefined ? { sorting } : {}),
      ...(rowSelection !== undefined ? { rowSelection } : {}),
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: hasSelection,
    getRowId: getRowId
      ? (row, index) => getRowId(row, index)
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      if (next.pageIndex !== pageIndex || next.pageSize !== pageSize) {
        onPageChange(next.pageIndex, next.pageSize);
      }
    },
    onSortingChange: onSortingChange
      ? (updater) => {
          const next =
            typeof updater === 'function' ? updater(sorting ?? []) : updater;
          onSortingChange(next);
        }
      : undefined,
    onRowSelectionChange: onRowSelectionChange
      ? (updater) => {
          const next =
            typeof updater === 'function'
              ? updater(rowSelection ?? {})
              : updater;
          onRowSelectionChange(next);
        }
      : undefined,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  // Selected row data — passed vào bulk actions.
  // Recompute when rowSelection changes (table reference is stable across renders);
  // include rowSelection trong deps để tránh stale closure khi parent toggles selection.
  const selectedRowsData = React.useMemo<TData[]>(() => {
    if (!hasSelection) return [];
    return table.getSelectedRowModel().rows.map((r) => r.original);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rowSelection is the trigger; table is stable
  }, [table, hasSelection, rowSelection]);

  const handleClearSelection = React.useCallback(() => {
    onRowSelectionChange?.({});
  }, [onRowSelectionChange]);

  const cellPadding = DENSITY_PADDING[density];
  const totalColumns = finalColumns.length;

  return (
    <div className={cn('space-y-4', className)} data-slot="data-table">
      {toolbarSlot ? <DataTableToolbar>{toolbarSlot}</DataTableToolbar> : null}

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {headerGroups.map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-100 hover:bg-slate-100"
              >
                {headerGroup.headers.map((header) => (
                  <SortableHeaderCell
                    key={header.id}
                    header={header}
                    cellPadding={cellPadding}
                  />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {finalColumns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={cellPadding}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className="h-auto p-0"
                >
                  {React.isValidElement(emptyState) ? (
                    emptyState
                  ) : isEmptyStateConfig(emptyState) ? (
                    <EmptyState {...emptyState} />
                  ) : (
                    <EmptyState
                      icon="inbox"
                      heading="Chưa có dữ liệu"
                      description="Hiện chưa có bản ghi nào để hiển thị"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <DataTableBodyRow
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  cellPadding={cellPadding}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        total={total}
        onChange={onPageChange}
      />

      {hasSelection && bulkActions && bulkActions.length > 0 ? (
        <DataTableBulkActions
          selected={selectedRowsData}
          actions={bulkActions}
          onClear={handleClearSelection}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header cell with sort indicator
// ---------------------------------------------------------------------------

type SortableHeaderCellProps<TData> = {
  header: Header<TData, unknown>;
  cellPadding: string;
};

function SortableHeaderCell<TData>({
  header,
  cellPadding,
}: SortableHeaderCellProps<TData>) {
  const canSort = header.column.getCanSort();
  const sortDirection = header.column.getIsSorted();

  const SortIcon =
    sortDirection === 'asc'
      ? ArrowUp
      : sortDirection === 'desc'
        ? ArrowDown
        : ArrowUpDown;

  const content = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());

  return (
    <TableHead
      className={cn(
        'h-auto text-sm font-semibold text-slate-700',
        cellPadding,
        canSort && 'cursor-pointer select-none hover:text-slate-900'
      )}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span>{content}</span>
        {canSort ? (
          <SortIcon
            className={cn(
              'h-3.5 w-3.5',
              sortDirection ? 'text-slate-700' : 'text-slate-400'
            )}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// Body row
// ---------------------------------------------------------------------------

type DataTableBodyRowProps<TData> = {
  row: Row<TData>;
  onRowClick?: (row: TData) => void;
  cellPadding: string;
};

function DataTableBodyRow<TData>({
  row,
  onRowClick,
  cellPadding,
}: DataTableBodyRowProps<TData>) {
  const clickable = typeof onRowClick === 'function';
  const selected = row.getIsSelected();

  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'border-b border-slate-200',
        clickable && 'cursor-pointer hover:bg-slate-50',
        selected && 'bg-blue-50 hover:bg-blue-50'
      )}
      onClick={clickable ? () => onRowClick(row.original) : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn('text-sm text-slate-700', cellPadding)}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default DataTable;
