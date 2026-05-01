// PageSkeleton — Phase 11-01 Task 2 (POLISH-09).
// Generic skeleton cho list pages: header + filter bar + table rows.
// Dùng cho `loading.tsx` route-level Suspense fallback.

import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  /** Số dòng skeleton trong bảng (default 8). */
  rows?: number;
  /** Hiển thị filter bar? (default true). */
  showFilters?: boolean;
  /** Hiển thị stat pills? (default true). */
  showStats?: boolean;
};

export function PageSkeleton({
  rows = 8,
  showFilters = true,
  showStats = true,
}: Props) {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-8">
      {/* Header: title + description + stat pills */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {showStats ? (
          <div className="flex flex-shrink-0 gap-2">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        ) : null}
      </div>

      {/* Filter bar */}
      {showFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-slate-200">
        {/* Table header */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        </div>
        {/* Table rows */}
        <div className="divide-y divide-slate-200">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="grid grid-cols-12 gap-3">
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-2 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton cho dashboard / detail pages — card grid + chart placeholder.
 */
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-md border border-slate-200 p-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-4">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton cho card-grid pages (vd /chuong-trinh).
 */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-md border border-slate-200 p-5"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
