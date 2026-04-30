// LichSuTab — Tab Lịch sử versions (placeholder Batch A; full impl Batch C).

import * as React from 'react';

import type { ProjectDetail } from '../../_actions/get-detail';

export type LichSuTabProps = {
  project: ProjectDetail;
};

export function LichSuTab({ project: _project }: LichSuTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Đang tải lịch sử phiên bản…
    </div>
  );
}

export default LichSuTab;
