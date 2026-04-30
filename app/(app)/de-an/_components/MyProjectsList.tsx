'use client';

// MyProjectsList — DataTable hiển thị đề án của đơn vị (PROJ-12 — danh sách đề án đã nộp).
// POC mode: client-side display, không server pagination (≤50 rows expected).

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatVNDCompact } from '@/lib/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { MyProjectListItem } from '../_actions/list-mine';

export type MyProjectsListProps = {
  projects: MyProjectListItem[];
};

export function MyProjectsList({ projects }: MyProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white">
        <EmptyState
          icon="file-x"
          heading="Chưa có đề án nào"
          description="Khi đợt mời mở, hãy bắt đầu khai báo đề án mới. Mọi đề án đã tạo sẽ hiển thị tại đây với trạng thái xử lý từ Ban quản lý."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Mã đề án</TableHead>
              <TableHead>Tên đề án</TableHead>
              <TableHead className="w-20">Năm</TableHead>
              <TableHead className="w-40">Trạng thái</TableHead>
              <TableHead className="w-36">Ngày nộp</TableHead>
              <TableHead className="w-36 text-right">Ngân sách</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-xs text-slate-700">
                  {p.code}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-900 line-clamp-2">
                      {p.name}
                    </span>
                    {p.parentProjectId ? (
                      <Badge
                        variant="secondary"
                        className="w-fit gap-1 text-xs"
                      >
                        Tiếp nối từ đề án trước
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-slate-700">{p.year}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} entity="PROJECT" />
                </TableCell>
                <TableCell className="text-sm text-slate-700">
                  {p.submittedAt ? formatDate(p.submittedAt) : '—'}
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-slate-900">
                  {p.totalBudget ? formatVNDCompact(p.totalBudget) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-blue-700 hover:text-blue-800"
                  >
                    <Link href={`/de-an/${p.id}`} aria-label="Xem chi tiết đề án">
                      Xem
                      <ExternalLink
                        className="ml-1 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default MyProjectsList;
