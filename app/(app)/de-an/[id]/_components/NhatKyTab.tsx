// NhatKyTab — Tab Nhật ký audit log scoped to project (placeholder Batch A; full impl Batch C).

import * as React from 'react';

export type NhatKyTabProps = {
  entries: ReadonlyArray<{
    id: string;
    createdAt: Date;
    userFullName: string;
    actionLabel: string;
    summary: string;
  }>;
};

export function NhatKyTab({ entries: _entries }: NhatKyTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Đang tải nhật ký…
    </div>
  );
}

export default NhatKyTab;
