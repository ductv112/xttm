// DuToanTab — Tab Dự toán (placeholder Batch A; full impl Batch B).

import * as React from 'react';

import type { ProjectDetail } from '../../_actions/get-detail';

export type DuToanTabProps = {
  project: ProjectDetail;
};

export function DuToanTab({ project: _project }: DuToanTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Đang tải dự toán kinh phí…
    </div>
  );
}

export default DuToanTab;
