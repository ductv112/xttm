'use client';

// Empty state for /chuong-trinh khi DB chưa có chu kỳ nào
// (rare edge case — sau khi seed sẽ có 3 chu kỳ demo).
// Wraps shared EmptyState với CTA conditional theo canCreate.

import { EmptyState } from '@/components/shared/EmptyState';

export type CycleListEmptyStateProps = {
  canCreate: boolean;
};

export function CycleListEmptyState({ canCreate }: CycleListEmptyStateProps) {
  return (
    <EmptyState
      icon="layout-dashboard"
      heading="Chưa có chu kỳ chương trình nào"
      description="Khởi tạo chu kỳ chương trình XTTM Quốc gia đầu tiên để bắt đầu vòng đời đề án — cấu hình mốc thời gian, ngân sách, tiêu chí thẩm định và danh sách đơn vị mời."
      action={
        canCreate
          ? { label: 'Tạo chu kỳ mới', href: '/chuong-trinh/new' }
          : undefined
      }
    />
  );
}

export default CycleListEmptyState;
