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
  'UPLOAD',
  'DISPATCH',
  'EXTEND',
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
  UPLOAD: 'Tải lên tệp',
  DISPATCH: 'Gửi thông báo',
  EXTEND: 'Gia hạn',
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

// =============================================================================
// Phase 4 (M2.2 Hồ sơ Đơn vị Chủ trì) — convenience composite type identifiers.
// Server actions in app/(app)/don-vi-cua-toi/_actions + don-vi-chu-tri/_actions
// reference these for grep-able audit semantics. Underlying log row uses
// AuditAction × AuditResource (UPDATE × don-vi-chu-tri etc.) — these constants
// are call-site documentation, NOT new resource/action enum values.
// =============================================================================

export const ORG_PROFILE_AUDIT_TYPES = {
  ORG_PROFILE_SUBMIT: { action: 'SUBMIT' as AuditAction, resource: 'don-vi-chu-tri' as AuditResource },
  ORG_PROFILE_APPROVE: { action: 'APPROVE' as AuditAction, resource: 'don-vi-chu-tri' as AuditResource },
  ORG_PROFILE_REJECT: { action: 'REJECT' as AuditAction, resource: 'don-vi-chu-tri' as AuditResource },
  ORG_PROFILE_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'don-vi-chu-tri' as AuditResource },
} as const;

// =============================================================================
// Phase 5 (M2.3 Khai báo & Nộp Đề án HERO) — composite audit type identifiers
// for project lifecycle. Same convention as ORG_PROFILE_AUDIT_TYPES — these are
// call-site documentation; underlying log row uses AuditAction × AuditResource.
// =============================================================================

export const PROJECT_AUDIT_TYPES = {
  PROJECT_SAVE_DRAFT: { action: 'UPDATE' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_SUBMIT: { action: 'SUBMIT' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_WITHDRAW: { action: 'TRANSITION' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_RESUBMIT: { action: 'SUBMIT' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_COPY_FROM_PREVIOUS: { action: 'CREATE' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_UPLOAD_DOCUMENT: { action: 'UPLOAD' as AuditAction, resource: 'de-an' as AuditResource },
  PROJECT_TRANSITION: { action: 'TRANSITION' as AuditAction, resource: 'de-an' as AuditResource },
} as const;

// =============================================================================
// Phase 6 (M2.4 Tiếp nhận & Kiểm tra hồ sơ) — composite audit type identifiers.
// Underlying log row uses AuditAction × AuditResource — these constants are
// call-site documentation for grep-able semantics across intake actions.
// Resource: 'tiep-nhan' covers BQL receive + assignment;
// 'de-an' covers chuyên viên checklist updates + transitions on the project.
// =============================================================================

export const INTAKE_AUDIT_TYPES = {
  INTAKE_RECEIVE: { action: 'TRANSITION' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_ASSIGN: { action: 'ASSIGN' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_UNASSIGN: { action: 'ASSIGN' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_REASSIGN: { action: 'ASSIGN' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_CHECKLIST_SAVE: { action: 'UPDATE' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_REQUEST_SUPPLEMENT: { action: 'TRANSITION' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_MARK_VALID: { action: 'TRANSITION' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_REJECT_FORMAL: { action: 'REJECT' as AuditAction, resource: 'tiep-nhan' as AuditResource },
  INTAKE_SCORE_SAVE: { action: 'UPDATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  INTAKE_SCORE_FINALIZE: { action: 'SUBMIT' as AuditAction, resource: 'tham-dinh' as AuditResource },
} as const;

// Color tokens for action badges (consumed by AuditLogTable)
export const AUDIT_ACTION_BADGE: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  TRANSITION: 'bg-blue-100 text-blue-800',
  SUBMIT: 'bg-blue-100 text-blue-800',
  APPROVE: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
  ASSIGN: 'bg-amber-100 text-amber-800',
  LOGIN: 'bg-slate-100 text-slate-800',
  LOGOUT: 'bg-slate-100 text-slate-800',
  EXPORT: 'bg-slate-100 text-slate-800',
  UPLOAD: 'bg-slate-100 text-slate-800',
  DISPATCH: 'bg-emerald-100 text-emerald-800',
  EXTEND: 'bg-amber-100 text-amber-800',
};
