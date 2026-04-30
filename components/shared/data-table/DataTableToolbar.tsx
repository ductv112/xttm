'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type DataTableToolbarProps = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Toolbar wrapper rendered above the table.
 * Caller passes search input + filter components as children.
 */
export function DataTableToolbar({ children, className }: DataTableToolbarProps) {
  return (
    <div
      data-slot="data-table-toolbar"
      className={cn('flex flex-wrap items-end gap-3', className)}
    >
      {children}
    </div>
  );
}

export default DataTableToolbar;
