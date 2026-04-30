// Notification types — pure types/labels, no Prisma import.
// Used by lib/notifications.ts + future inbox UI (Phase 4) + composer (Plan 03-04).

export const NOTIFICATION_TYPES = [
  'CYCLE_INVITATION',
  'CYCLE_CONFIG_CHANGED',
  'CYCLE_EXTENDED',
  'CYCLE_OPENED',
  'CYCLE_CLOSED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  CYCLE_INVITATION: 'Mời tham gia chu kỳ',
  CYCLE_CONFIG_CHANGED: 'Cấu hình chu kỳ thay đổi',
  CYCLE_EXTENDED: 'Chu kỳ được gia hạn',
  CYCLE_OPENED: 'Chu kỳ mở cổng đăng ký',
  CYCLE_CLOSED: 'Chu kỳ đóng cổng đăng ký',
};

export const DISPATCH_STATUSES = ['PENDING', 'SENT', 'READ', 'FAILED'] as const;

export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  PENDING: 'Chờ gửi',
  SENT: 'Đã gửi',
  READ: 'Đã đọc',
  FAILED: 'Gửi lỗi',
};

export const RECIPIENT_TYPES = ['ORGANIZATION', 'USER', 'ROLE'] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];
