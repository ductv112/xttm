// TaiLieuTab — Tab Tài liệu (placeholder Batch A; full impl Batch B).

import * as React from 'react';

import type { ProjectDetail } from '../../_actions/get-detail';

export type TaiLieuTabProps = {
  project: ProjectDetail;
};

export function TaiLieuTab({ project: _project }: TaiLieuTabProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Đang tải danh sách tài liệu…
    </div>
  );
}

export default TaiLieuTab;
