'use client';

// CatalogPage — shared config-driven template cho 8 catalogs.
// Layout: heading + filter bar (search debounced 300ms + isActive Select)
//   + DataTable (CatalogTable) + Sheet drawer (CatalogEditSheet).

import * as React from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCatalogConfig,
  type CatalogKind,
} from '@/lib/catalog-types';
import type { Role } from '@/lib/constants';
import {
  listCatalogItems,
  type CatalogListRow,
  type ListCatalogResult,
} from '../_actions/list';
import type { ListCatalogFilter } from '../_actions/schemas';
import { CatalogTable } from './CatalogTable';
import { CatalogEditSheet } from './CatalogEditSheet';

const PAGE_SIZE = 50;

type Props = {
  kind: CatalogKind;
  initialData: ListCatalogResult;
  userRole: Role;
};

export function CatalogPage({ kind, initialData, userRole }: Props) {
  const config = getCatalogConfig(kind);

  const [keyword, setKeyword] = React.useState('');
  const [debouncedKeyword, setDebouncedKeyword] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<CatalogListRow | null>(
    null,
  );

  // Debounce keyword 300ms
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  // Reset page khi filter changes
  React.useEffect(() => {
    setPageIndex(0);
  }, [debouncedKeyword, statusFilter]);

  const filter: ListCatalogFilter = React.useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      isActive: statusFilter,
    }),
    [debouncedKeyword, statusFilter],
  );

  const isInitialQuery =
    pageIndex === 0 && debouncedKeyword === '' && statusFilter === 'all';

  const { data, isFetching, isError, error, refetch } =
    useQuery<ListCatalogResult>({
      queryKey: ['catalog', kind, filter, pageIndex],
      queryFn: () => listCatalogItems(kind, filter, pageIndex, PAGE_SIZE),
      placeholderData: keepPreviousData,
      initialData: isInitialQuery ? initialData : undefined,
      staleTime: 15_000,
    });

  const handleNew = () => {
    setSelectedItem(null);
    setSheetOpen(true);
  };

  const handleEdit = (row: CatalogListRow) => {
    setSelectedItem(row);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    // Defer clearing selection để animation hoàn tất
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleSaved = () => {
    setSheetOpen(false);
    void refetch();
  };

  const canCreate = userRole === 'ADMIN';

  return (
    <div className="space-y-4">
      {/* Heading + action */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {config.labelPlural}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý {config.label.toLowerCase()} dùng chung cho toàn bộ hệ thống
          </p>
        </div>
        {canCreate ? (
          <Button onClick={handleNew}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Thêm {config.label.toLowerCase()}
          </Button>
        ) : null}
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo mã hoặc tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
            aria-label="Tìm kiếm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as 'all' | 'active' | 'inactive')
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Đã ngừng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Đã xảy ra lỗi khi tải danh sách:{' '}
          {error instanceof Error ? error.message : 'Vui lòng thử lại'}
        </div>
      ) : null}

      {/* Table */}
      <CatalogTable
        kind={kind}
        data={data?.rows ?? []}
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
        isLoading={isFetching && !data}
        userRole={userRole}
        onEdit={handleEdit}
        onAfterMutation={() => void refetch()}
      />

      {/* Edit sheet */}
      <CatalogEditSheet
        kind={kind}
        open={sheetOpen}
        onOpenChange={(o) => (o ? setSheetOpen(true) : handleSheetClose())}
        item={selectedItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
