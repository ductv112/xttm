'use client';

// CatalogTable — wraps shared DataTable với config-driven columns + actions.
// Common: Mã, Tên, Mô tả, Trạng thái (Switch inline toggle), Hành động dropdown.
// Special per kind: Khu vực, Trọng số, Tiêu chí cha, Loại văn bản, ...

import * as React from 'react';
import { MoreVertical, Pencil, Trash2, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  getCatalogConfig,
  type CatalogKind,
} from '@/lib/catalog-types';
import type { Role } from '@/lib/constants';
import type { CatalogListRow } from '../_actions/list';
import { toggleCatalogItem } from '../_actions/toggle';
import { deleteCatalogItem } from '../_actions/delete';
import {
  REGION_LABELS,
  ORG_UNIT_TYPE_LABELS,
  DOC_TEMPLATE_CATEGORY_LABELS,
} from '../_actions/schemas';

const EMPTY_STATE_BY_KIND: Record<
  CatalogKind,
  { icon: 'list' | 'package-x'; heading: string; description: string }
> = {
  'project-kind': {
    icon: 'list',
    heading: 'Chưa có loại đề án',
    description: 'Thêm loại đề án để phục vụ khai báo và phân loại đề án',
  },
  'industry-sector': {
    icon: 'list',
    heading: 'Chưa có ngành hàng',
    description: 'Thêm ngành hàng để phục vụ phân loại và báo cáo',
  },
  market: {
    icon: 'list',
    heading: 'Chưa có thị trường',
    description: 'Thêm thị trường để phục vụ khai báo đề án xuất khẩu',
  },
  'promotion-type': {
    icon: 'list',
    heading: 'Chưa có loại hình XTTM',
    description: 'Thêm loại hình XTTM theo Nghị định 28',
  },
  country: {
    icon: 'list',
    heading: 'Chưa có quốc gia',
    description: 'Thêm quốc gia ISO alpha-3 để phục vụ khai báo thị trường',
  },
  'org-unit': {
    icon: 'list',
    heading: 'Chưa có đơn vị',
    description: 'Thêm đơn vị tổ chức để phục vụ khai báo người dùng',
  },
  'scoring-criterion': {
    icon: 'list',
    heading: 'Chưa có tiêu chí chấm điểm',
    description: 'Thêm tiêu chí chấm điểm để phục vụ thẩm định đề án',
  },
  'document-template': {
    icon: 'list',
    heading: 'Chưa có mẫu văn bản',
    description: 'Thêm mẫu văn bản để phục vụ tạo công văn, tờ trình, quyết định',
  },
};

const CATEGORY_BADGE_COLOR: Record<string, string> = {
  CONG_VAN_MOI: 'bg-blue-50 text-blue-700 border-blue-200',
  TO_TRINH: 'bg-amber-50 text-amber-700 border-amber-200',
  QUYET_DINH: 'bg-green-50 text-green-700 border-green-200',
  HOP_DONG: 'bg-purple-50 text-purple-700 border-purple-200',
  BIEN_BAN_NGHIEM_THU: 'bg-slate-100 text-slate-700 border-slate-300',
  THANH_LY: 'bg-rose-50 text-rose-700 border-rose-200',
};

type Props = {
  kind: CatalogKind;
  data: CatalogListRow[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  isLoading: boolean;
  userRole: Role;
  onEdit: (row: CatalogListRow) => void;
  onAfterMutation: () => void;
};

export function CatalogTable({
  kind,
  data,
  total,
  pageIndex,
  pageSize,
  onPageChange,
  isLoading,
  userRole,
  onEdit,
  onAfterMutation,
}: Props) {
  const config = getCatalogConfig(kind);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [pendingToggleIds, setPendingToggleIds] = React.useState<Set<string>>(
    new Set(),
  );
  const canMutate = userRole === 'ADMIN';

  const handleToggle = React.useCallback(
    async (row: CatalogListRow, next: boolean) => {
      setPendingToggleIds((prev) => new Set(prev).add(row.id));
      try {
        await toggleCatalogItem(kind, row.id, next);
        toast.success(
          next
            ? `Đã kích hoạt "${row.name}"`
            : `Đã ngừng hoạt động "${row.name}"`,
        );
        onAfterMutation();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Không thể thay đổi trạng thái',
        );
      } finally {
        setPendingToggleIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [kind, onAfterMutation],
  );

  const handleDelete = React.useCallback(
    async (row: CatalogListRow) => {
      const ok = await confirm({
        title: `Xác nhận xóa ${config.label.toLowerCase()}`,
        description: `Bạn có chắc chắn muốn xóa "${row.name}"? Thao tác này không thể hoàn tác.`,
        confirmLabel: 'Xóa',
        variant: 'destructive',
      });
      if (!ok) return;
      try {
        await deleteCatalogItem(kind, row.id);
        toast.success(`Đã xóa "${row.name}"`);
        onAfterMutation();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Không thể xóa mục này',
        );
      }
    },
    [kind, confirm, config.label, onAfterMutation],
  );

  const columns = React.useMemo<ColumnDef<CatalogListRow, unknown>[]>(() => {
    const cols: ColumnDef<CatalogListRow, unknown>[] = [
      {
        id: 'code',
        header: 'Mã',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-slate-700">
            {row.original.code}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Tên',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <div className="font-medium text-slate-900">{r.name}</div>
              {kind === 'market' && r.nameEn ? (
                <div className="text-xs text-slate-500">{r.nameEn}</div>
              ) : null}
              {kind === 'country' && r.nameEn ? (
                <div className="text-xs text-slate-500">{r.nameEn}</div>
              ) : null}
            </div>
          );
        },
      },
    ];

    // Region column for market + country
    if (kind === 'market' || kind === 'country') {
      cols.push({
        id: 'region',
        header: 'Khu vực',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 font-normal text-slate-700"
          >
            {row.original.region
              ? REGION_LABELS[
                  row.original.region as keyof typeof REGION_LABELS
                ] ?? row.original.region
              : '—'}
          </Badge>
        ),
      });
    }

    // Country: hasTradeOffice column
    if (kind === 'country') {
      cols.push({
        id: 'hasTradeOffice',
        header: 'Có thương vụ',
        size: 120,
        cell: ({ row }) =>
          row.original.hasTradeOffice ? (
            <Check className="h-4 w-4 text-green-700" aria-label="Có" />
          ) : (
            <Minus className="h-4 w-4 text-slate-300" aria-label="Không" />
          ),
      });
    }

    // OrgUnit: type + parent
    if (kind === 'org-unit') {
      cols.push({
        id: 'type',
        header: 'Loại',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 font-normal text-slate-700"
          >
            {row.original.type
              ? ORG_UNIT_TYPE_LABELS[
                  row.original.type as keyof typeof ORG_UNIT_TYPE_LABELS
                ] ?? row.original.type
              : '—'}
          </Badge>
        ),
      });
      cols.push({
        id: 'parent',
        header: 'Đơn vị cha',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.parent?.name ?? '—'}
          </span>
        ),
      });
    }

    // ScoringCriterion: weight + parent
    if (kind === 'scoring-criterion') {
      cols.push({
        id: 'weight',
        header: 'Trọng số',
        size: 120,
        cell: ({ row }) => {
          const w = row.original.weight ?? 0;
          return (
            <Badge
              className={cn(
                'font-mono font-semibold',
                w >= 30
                  ? 'border-blue-200 bg-blue-100 text-blue-800'
                  : w >= 10
                    ? 'border-amber-200 bg-amber-100 text-amber-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700',
              )}
            >
              {w.toFixed(1)}%
            </Badge>
          );
        },
      });
      cols.push({
        id: 'parent',
        header: 'Tiêu chí cha',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.parent?.name ?? (
              <span className="italic text-slate-500">Tiêu chí gốc</span>
            )}
          </span>
        ),
      });
    }

    // DocumentTemplate: category + variables count
    if (kind === 'document-template') {
      cols.push({
        id: 'category',
        header: 'Loại văn bản',
        cell: ({ row }) => {
          const cat = row.original.category ?? '';
          const cls =
            CATEGORY_BADGE_COLOR[cat] ??
            'bg-slate-50 text-slate-700 border-slate-200';
          return (
            <Badge
              variant="outline"
              className={cn('font-normal', cls)}
            >
              {DOC_TEMPLATE_CATEGORY_LABELS[
                cat as keyof typeof DOC_TEMPLATE_CATEGORY_LABELS
              ] ?? cat}
            </Badge>
          );
        },
      });
      cols.push({
        id: 'variables',
        header: 'Biến',
        size: 100,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.variables?.length ?? 0} biến
          </span>
        ),
      });
    }

    // Description (common, after special columns)
    cols.push({
      id: 'description',
      header: 'Mô tả',
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm text-slate-600">
          {row.original.description ?? '—'}
        </div>
      ),
    });

    // Status — Switch inline toggle
    cols.push({
      id: 'isActive',
      header: 'Đang hoạt động',
      size: 140,
      cell: ({ row }) => {
        const r = row.original;
        const pending = pendingToggleIds.has(r.id);
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={r.isActive}
              disabled={!canMutate || pending}
              onCheckedChange={(v) => void handleToggle(r, v)}
              aria-label={`Trạng thái ${r.name}`}
            />
            <span
              className={cn(
                'text-xs',
                r.isActive ? 'text-green-700' : 'text-slate-500',
              )}
            >
              {r.isActive ? 'Đang hoạt động' : 'Đã ngừng'}
            </span>
          </div>
        );
      },
    });

    // Actions dropdown
    cols.push({
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const r = row.original;
        if (!canMutate) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Hành động cho ${r.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={() => onEdit(r)}>
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void handleDelete(r)}
                className="text-red-600 focus:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    return cols;
  }, [
    kind,
    canMutate,
    handleToggle,
    handleDelete,
    onEdit,
    pendingToggleIds,
  ]);

  return (
    <>
      <DataTable<CatalogListRow>
        columns={columns}
        data={data}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={(next) => onPageChange(next)}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyState={EMPTY_STATE_BY_KIND[kind]}
      />
      {confirmDialog}
    </>
  );
}
