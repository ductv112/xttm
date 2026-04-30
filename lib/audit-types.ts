// Audit types — pure types/enums, no Prisma import (consumed at edge + Node)
// Resources khớp với lib/permissions.ts Resource type (18 entries)

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'TRANSITION',
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  TRANSITION: 'Chuyển trạng thái',
  SUBMIT: 'Nộp',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  ASSIGN: 'Phân công',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  EXPORT: 'Xuất dữ liệu',
};

// 18 resources khớp lib/permissions.ts Resource type
export const AUDIT_RESOURCES = [
  'chuong-trinh',
  'don-vi-chu-tri',
  'de-an',
  'tiep-nhan',
  'tham-dinh',
  'phe-duyet',
  'hop-dong',
  'trien-khai',
  'bao-cao',
  'nghiem-thu',
  'tai-chinh',
  'danh-muc',
  'nguoi-dung',
  'vai-tro',
  'cau-hinh',
  'audit-log',
  'thong-bao',
  'dashboard',
] as const;
export type AuditResource = (typeof AUDIT_RESOURCES)[number];

export const AUDIT_RESOURCE_LABELS: Record<AuditResource, string> = {
  'chuong-trinh': 'Chu kỳ chương trình',
  'don-vi-chu-tri': 'Đơn vị chủ trì',
  'de-an': 'Đề án',
  'tiep-nhan': 'Tiếp nhận hồ sơ',
  'tham-dinh': 'Thẩm định',
  'phe-duyet': 'Phê duyệt',
  'hop-dong': 'Hợp đồng',
  'trien-khai': 'Triển khai',
  'bao-cao': 'Báo cáo',
  'nghiem-thu': 'Nghiệm thu',
  'tai-chinh': 'Tài chính',
  'danh-muc': 'Danh mục',
  'nguoi-dung': 'Người dùng',
  'vai-tro': 'Vai trò',
  'cau-hinh': 'Cấu hình',
  'audit-log': 'Nhật ký',
  'thong-bao': 'Thông báo',
  dashboard: 'Bảng điều khiển',
};

export type AuditEntry = {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

// Color tokens for action badges (consumed by AuditLogTable)
export const AUDIT_ACTION_BADGE: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  TRANSITION: 'bg-slate-100 text-slate-800',
  SUBMIT: 'bg-blue-100 text-blue-800',
  APPROVE: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
  ASSIGN: 'bg-amber-100 text-amber-800',
  LOGIN: 'bg-slate-100 text-slate-800',
  LOGOUT: 'bg-slate-100 text-slate-800',
  EXPORT: 'bg-slate-100 text-slate-800',
};
