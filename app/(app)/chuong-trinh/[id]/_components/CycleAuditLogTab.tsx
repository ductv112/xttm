'use client';

// CycleAuditLogTab — small audit log table scoped to current cycle.
// Plan 03-06: filter where resource='chuong-trinh' AND resourceId=cycleId.
// Renders 5 columns (Thời gian, Người thực hiện, Hành động, Tóm tắt, IP).
// No pagination needed for Phase 3 scope (typically < 50 entries per cycle).

import * as React from 'react';
import { History } from 'lucide-react';

import {
  AUDIT_ACTION_BADGE,
  AUDIT_ACTION_LABELS,
  type AuditAction,
} from '@/lib/audit-types';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export type CycleAuditEntry = {
  id: string;
  createdAt: Date;
  userFullName: string;
  userRole: string;
  action: AuditAction;
  resourceId: string | null;
  diffSummary: string;
  ip: string | null;
};

export type CycleAuditLogTabProps = {
  entries: ReadonlyArray<CycleAuditEntry>;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị',
  BANQL: 'Ban quản lý',
  CHUYENVIEN: 'Chuyên viên',
  HOIDONG: 'Hội đồng',
  DONVI: 'Đơn vị chủ trì',
  TAICHINH: 'Tài chính',
  LANHDAO: 'Lãnh đạo',
};

export function CycleAuditLogTab({ entries }: CycleAuditLogTabProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <History className="h-12 w-12 text-slate-400" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900">
          Chưa có nhật ký hoạt động cho chu kỳ này
        </h3>
        <p className="max-w-md text-sm text-slate-600">
          Mọi thay đổi cấu hình, chuyển trạng thái và gửi thông báo trên chu kỳ này
          sẽ xuất hiện tại đây kèm thông tin người thực hiện và thời điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Thời gian</th>
            <th className="px-4 py-3 text-left font-medium">Người thực hiện</th>
            <th className="px-4 py-3 text-left font-medium">Hành động</th>
            <th className="px-4 py-3 text-left font-medium">Tóm tắt thay đổi</th>
            <th className="px-4 py-3 text-left font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const badgeCls = AUDIT_ACTION_BADGE[e.action] ?? 'bg-slate-100 text-slate-800';
            return (
              <tr
                key={e.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 align-top text-slate-700 whitespace-nowrap">
                  {formatDateTime(e.createdAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-slate-900">{e.userFullName}</p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABELS[e.userRole] ?? e.userRole}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      badgeCls
                    )}
                  >
                    {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-slate-700">
                  {e.diffSummary}
                </td>
                <td className="px-4 py-3 align-top text-xs text-slate-500 font-mono">
                  {e.ip ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CycleAuditLogTab;
