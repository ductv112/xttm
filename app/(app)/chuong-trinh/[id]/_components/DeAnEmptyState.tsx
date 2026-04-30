// DeAnEmptyState — empty state cho tab Đề án đăng ký.
// Plan 03-06: Phase 3 chỉ render placeholder; Phase 5 (M2.3) wires submission flow thực.
// Show OPEN_REGISTRATION sub-text with hint khi cycle đang mở cổng.

import * as React from 'react';
import { FileText } from 'lucide-react';

import { formatDate } from '@/lib/format';
import type { CycleDetail } from '../../_actions/types';

export type DeAnEmptyStateProps = {
  cycle: CycleDetail;
};

export function DeAnEmptyState({ cycle }: DeAnEmptyStateProps) {
  const isOpen = cycle.status === 'OPEN_REGISTRATION';
  const closeAt = cycle.registrationCloseAt;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <FileText className="h-12 w-12 text-slate-400" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-900">
        Chưa có đề án nào đăng ký trong kỳ {cycle.year}
      </h3>
      <p className="max-w-md text-sm text-slate-600">
        Khi đơn vị chủ trì nộp đề án (Phase 5 — M2.3), danh sách sẽ xuất hiện ở đây
        với filter + actions của Ban quản lý.
      </p>
      {isOpen && closeAt ? (
        <p className="mt-2 max-w-md rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
          Đợt mời đề xuất {cycle.year} đang mở — hạn nộp{' '}
          <span className="font-semibold">{formatDate(closeAt)}</span>. Đơn vị chủ
          trì có thể tạo đề án từ trang Đề án (sẽ kích hoạt ở Phase 5).
        </p>
      ) : null}
    </div>
  );
}

export default DeAnEmptyState;
