// KeHoachTab — Tab Kế hoạch (placeholder Batch A; full impl Batch B).

import * as React from 'react';

import type { ProjectDetail } from '../../_actions/get-detail';

export type KeHoachTabProps = {
  project: ProjectDetail;
};

export function KeHoachTab({ project: _project }: KeHoachTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Đang tải kế hoạch chi tiết…
    </div>
  );
}

export default KeHoachTab;
