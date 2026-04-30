// KeHoachTab — Tab Kế hoạch (Plan 05-03 Batch B).
// Hiển thị bảng kế hoạch readonly từ planJson (PROJ-04 step 2 plan rows).
// Format: Số thứ tự / Hạng mục công việc / Sản phẩm bàn giao / Hạn / Phụ trách.

import * as React from 'react';
import { ListChecks } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/format';

import type { ProjectDetail } from '../../_actions/get-detail';

export type KeHoachTabProps = {
  project: ProjectDetail;
};

export function KeHoachTab({ project }: KeHoachTabProps) {
  const rows = project.plan.rows ?? [];

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon="file-x"
            heading="Chưa có kế hoạch chi tiết"
            description="Đề án chưa khai báo các hạng mục công việc và sản phẩm bàn giao."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Kế hoạch chi tiết
          <span className="ml-2 text-xs font-normal text-slate-500">
            {rows.length} hạng mục
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead>Hạng mục công việc</TableHead>
                <TableHead>Sản phẩm bàn giao</TableHead>
                <TableHead className="w-32">Thời hạn</TableHead>
                <TableHead className="w-48">Phụ trách</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.id ?? idx}>
                  <TableCell className="text-center text-sm text-slate-500">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {r.task || <span className="text-slate-400">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {r.deliverable || <span className="text-slate-400">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {r.dueDate ? (
                      formatDate(r.dueDate)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {r.owner || <span className="text-slate-400">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default KeHoachTab;
