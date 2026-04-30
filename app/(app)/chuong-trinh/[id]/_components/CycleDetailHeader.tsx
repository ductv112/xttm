// CycleDetailHeader — sticky header đầu detail page.
// Plan 03-06 layout component: row 1 back button → row 2 cycle name + status badge + meta.
// Plan 03-07: wire CycleActionBar (client component) vào right-side cho action buttons
// theo trạng thái cycle (Hoàn thành cấu hình / Mở cổng / Đóng cổng / Gia hạn / Chuyển thẩm định).

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatVNDCompact } from '@/lib/format';
import type { CycleDetail } from '../../_actions/types';
import { CycleActionBar } from './CycleActionBar';

export type CycleDetailHeaderProps = {
  cycle: CycleDetail;
  canEdit: boolean;
};

export function CycleDetailHeader({ cycle, canEdit }: CycleDetailHeaderProps) {
  const invitedOrgCount = cycle.invitedOrganizations.length;
  const projectCount = cycle.projectCount;

  const budgetLabel =
    cycle.totalBudget != null ? formatVNDCompact(cycle.totalBudget) : 'Chưa cấu hình ngân sách';

  return (
    <header className="sticky top-14 z-10 -mx-4 mb-2 border-b border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="mb-2">
        <Link
          href="/chuong-trinh"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Danh sách chu kỳ
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{cycle.name}</h1>
            <StatusBadge entity="PROGRAM_CYCLE" status={cycle.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-medium">Năm {cycle.year}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{budgetLabel}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>
              {invitedOrgCount} đơn vị mời
              <span className="mx-2 text-slate-300">·</span>
              {projectCount} đề án
            </span>
          </p>
        </div>
        {/* Right-side action buttons — Plan 03-07 CycleActionBar contextual theo status + canEdit */}
        <div className="shrink-0">
          <CycleActionBar cycle={cycle} canEdit={canEdit} />
        </div>
      </div>
    </header>
  );
}

export default CycleDetailHeader;
