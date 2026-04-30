// NhatKyTab — Tab Nhật ký audit log scoped to project (Plan 05-03 Batch C).
// Hiển thị 50 entries gần nhất từ audit log với resource='de-an', resourceId=project.id.

import * as React from 'react';
import { Activity } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/format';

export type NhatKyTabProps = {
  entries: ReadonlyArray<{
    id: string;
    createdAt: Date;
    userFullName: string;
    actionLabel: string;
    summary: string;
  }>;
};

export function NhatKyTab({ entries }: NhatKyTabProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon="history"
            heading="Chưa có hoạt động nào"
            description="Mọi thao tác trên đề án (chỉnh sửa, nộp, rút, chuyển trạng thái) sẽ được ghi lại tại đây."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" aria-hidden="true" />
          Nhật ký hoạt động
          <span className="ml-2 text-xs font-normal text-slate-500">
            {entries.length} hoạt động gần đây
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span
                className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-200 bg-white"
                aria-hidden="true"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-slate-200 bg-slate-50 font-medium text-slate-800"
                  >
                    {e.actionLabel}
                  </Badge>
                  <span className="text-sm font-medium text-slate-900">
                    {e.userFullName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(e.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{e.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default NhatKyTab;
