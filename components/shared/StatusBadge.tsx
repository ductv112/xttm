import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Entity-aware status badge — maps status enum value sang Vietnamese label
 * (từ STATUS_LABELS) + color theme phù hợp ngữ nghĩa trạng thái.
 *
 * Phase 2 chỉ wire PROGRAM_CYCLE + PROJECT (đã có trong lib/constants).
 * Các entity còn lại (CONTRACT/REPORT/ORG_PROFILE/SCORE_SHEET) declare
 * structure để Phase 4-9 thêm vào STATUS_LABELS — fallback hiển thị raw
 * status string với theme `slate` mặc định.
 */
export type StatusBadgeEntity =
  | 'PROGRAM_CYCLE'
  | 'PROJECT'
  | 'CONTRACT'
  | 'REPORT'
  | 'ORG_PROFILE'
  | 'SCORE_SHEET';

export type StatusBadgeProps = {
  status: string;
  entity: StatusBadgeEntity;
  className?: string;
};

/**
 * Color theme mapping (Tailwind classes) theo ngữ nghĩa trạng thái —
 * lock từ UI-SPEC color palette (60/30/10 + 5 màu trạng thái).
 */
type Theme = {
  bg: string;
  text: string;
  border: string;
};

const THEMES: Record<string, Theme> = {
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  slateDark: {
    bg: 'bg-slate-200',
    text: 'text-slate-800',
    border: 'border-slate-300',
  },
  slateMuted: {
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

/**
 * Status → theme key. Bao quát mọi enum values của 6 entity (xem
 * lib/constants STATUS_LABELS + lib/workflows/* state machines).
 */
const STATUS_THEME: Record<string, keyof typeof THEMES> = {
  // Soạn thảo / chưa hoạt động
  DRAFT: 'slate',
  // Sẵn sàng / đã nộp / chờ xử lý
  READY: 'blue',
  SUBMITTED: 'blue',
  RECEIVED: 'blue',
  ASSIGNED: 'blue',
  // Mở đăng ký / đang triển khai
  OPEN_REGISTRATION: 'green',
  IN_PROGRESS: 'green',
  // Đóng đăng ký / chờ tiếp / cần bổ sung
  CLOSED_REGISTRATION: 'amber',
  RETURNED_FOR_REVISION: 'amber',
  // Đang xử lý / kiểm tra / thẩm định
  EVALUATING: 'blue',
  UNDER_REVIEW: 'blue',
  EVALUATED: 'blue',
  // Đã duyệt / hợp lệ / hoàn thành thành công
  APPROVED: 'emerald',
  VALIDATED: 'emerald',
  CONTRACTED: 'emerald',
  // Hoàn thành / kết thúc thành công
  COMPLETED: 'slateDark',
  LIQUIDATED: 'slateDark',
  // Lỗi / từ chối
  REJECTED: 'red',
  REJECTED_FINAL: 'red',
  // Hủy
  CANCELLED: 'slateMuted',
};

function resolveLabel(entity: StatusBadgeEntity, status: string): string {
  // Phase 2 wires PROGRAM_CYCLE + PROJECT only
  const entityLabels = (STATUS_LABELS as Record<string, Record<string, string> | undefined>)[
    entity
  ];
  if (entityLabels && entityLabels[status]) {
    return entityLabels[status];
  }
  // Fallback raw status string — Phase 4-9 sẽ thêm CONTRACT/REPORT/etc.
  return status;
}

export function StatusBadge({ status, entity, className }: StatusBadgeProps) {
  const themeKey = STATUS_THEME[status] ?? 'slate';
  const theme = THEMES[themeKey] ?? THEMES.slate!;
  const label = resolveLabel(entity, status);

  return (
    <Badge
      variant="outline"
      className={cn(theme.bg, theme.text, theme.border, 'font-medium', className)}
      data-entity={entity}
      data-status={status}
    >
      {label}
    </Badge>
  );
}

export default StatusBadge;
