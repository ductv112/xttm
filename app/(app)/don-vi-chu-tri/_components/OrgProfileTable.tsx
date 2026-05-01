'use client';

// OrgProfileTable — DataTable client wrapper hiển thị danh sách OrganizationProfile
// cho BQL inbox. Click row → mở ProfileDetailSheet drawer 640px.

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/format';

import { ProfileDetailSheet } from './ProfileDetailSheet';
import type { OrgProfileListItem } from '../../don-vi-cua-toi/_actions/types';

export type OrgProfileTableProps = {
  data: OrgProfileListItem[];
  currentStatus: string;
};

const TABS: Array<{ value: string; label: string }> = [
  { value: 'SUBMITTED', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Yêu cầu bổ sung' },
  { value: 'DRAFT', label: 'Đang khai báo' },
  { value: 'ALL', label: 'Tất cả' },
];

export function OrgProfileTable({ data, currentStatus }: OrgProfileTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openProfileId, setOpenProfileId] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') ?? '');

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`/don-vi-chu-tri?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    router.push(`/don-vi-chu-tri?${params.toString()}`);
  };

  const columns = React.useMemo<ColumnDef<OrgProfileListItem>[]>(
    () => [
      {
        accessorKey: 'organizationName',
        header: 'Đơn vị',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">
              {row.original.organizationName}
            </div>
            <div className="text-xs text-slate-500">
              {row.original.organizationCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'taxCode',
        header: 'MST',
        cell: ({ row }) => row.original.taxCode || '—',
      },
      {
        accessorKey: 'representativeName',
        header: 'Người đại diện',
        cell: ({ row }) => row.original.representativeName || '—',
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} entity="ORG_PROFILE" />
        ),
      },
      {
        accessorKey: 'submittedAt',
        header: 'Ngày gửi',
        cell: ({ row }) =>
          row.original.submittedAt ? formatDate(row.original.submittedAt) : '—',
      },
      {
        id: 'docs',
        header: 'Tài liệu',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.documentCount} tệp · {row.original.contactCount} đầu mối
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpenProfileId(row.original.id);
            }}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Xem chi tiết
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div
          role="tablist"
          aria-label="Lọc trạng thái hồ sơ"
          className="flex flex-wrap items-center gap-1 border-b border-slate-200"
        >
          {TABS.map((tab) => {
            const active = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(tab.value)}
                className={
                  'px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ' +
                  (active
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300')
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            placeholder="Tìm theo tên đơn vị..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="default">
            Tìm
          </Button>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        pageIndex={0}
        pageSize={50}
        onPageChange={() => {
          /* server-side filter — no client pagination */
        }}
        onRowClick={(row) => setOpenProfileId(row.id)}
        emptyState={{
          icon: 'inbox',
          heading: 'Chưa có hồ sơ nào',
          description:
            currentStatus === 'SUBMITTED'
              ? 'Hiện không có hồ sơ đang chờ phê duyệt. Khi đơn vị gửi hồ sơ, danh sách sẽ tự động cập nhật.'
              : 'Không có hồ sơ trong trạng thái này.',
        }}
      />

      <ProfileDetailSheet
        profileId={openProfileId}
        onOpenChange={(open) => {
          if (!open) setOpenProfileId(null);
        }}
      />
    </>
  );
}

export default OrgProfileTable;
