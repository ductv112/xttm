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

// =============================================================================
// Phase 7 (M3 Thẩm định & Phê duyệt HERO) — composite audit type identifiers.
// COUNCIL_* (Plan 07-01): hội đồng thẩm định lifecycle.
// EVALUATION_* (Plan 07-01): hội đồng thành viên chấm điểm.
// SUBMISSION_* / DECISION_* / NOTIFY_* (Plan 07-02): tờ trình + quyết định + thông báo.
// =============================================================================

export const COUNCIL_AUDIT_TYPES = {
  COUNCIL_CREATE: { action: 'CREATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_ADD_MEMBER: { action: 'UPDATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_REMOVE_MEMBER: { action: 'UPDATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_ASSIGN_PROJECT: { action: 'ASSIGN' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_UNASSIGN_PROJECT: { action: 'ASSIGN' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_LOCK: { action: 'TRANSITION' as AuditAction, resource: 'tham-dinh' as AuditResource },
  COUNCIL_UNLOCK: { action: 'TRANSITION' as AuditAction, resource: 'tham-dinh' as AuditResource },
  EVALUATION_SAVE_SCORE: { action: 'UPDATE' as AuditAction, resource: 'tham-dinh' as AuditResource },
  EVALUATION_SUBMIT_SCORE: { action: 'SUBMIT' as AuditAction, resource: 'tham-dinh' as AuditResource },
  EVALUATION_DECLINE_COI: { action: 'REJECT' as AuditAction, resource: 'tham-dinh' as AuditResource },
} as const;

export const APPROVAL_AUDIT_TYPES = {
  SUBMISSION_CREATE: { action: 'CREATE' as AuditAction, resource: 'phe-duyet' as AuditResource },
  SUBMISSION_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'phe-duyet' as AuditResource },
  SUBMISSION_FINALIZE: { action: 'SUBMIT' as AuditAction, resource: 'phe-duyet' as AuditResource },
  DECISION_SAVE: { action: 'APPROVE' as AuditAction, resource: 'phe-duyet' as AuditResource },
  DECISION_REJECT_PROJECT: { action: 'REJECT' as AuditAction, resource: 'phe-duyet' as AuditResource },
  NOTIFY_RESULT: { action: 'DISPATCH' as AuditAction, resource: 'phe-duyet' as AuditResource },
} as const;

// =============================================================================
// Phase 8 (M4 Hợp đồng + Triển khai + Điều chỉnh) — composite audit types.
// CONTRACT_*: hợp đồng lifecycle (auto-create, edit terms, upload scan, sign,
//   complete, liquidate).
// IMPL_*: triển khai theo dõi (kế hoạch, tiến độ, liên hệ thương vụ).
// AMENDMENT_*: điều chỉnh đề án (Điều 13 NĐ 28).
// =============================================================================

export const CONTRACT_AUDIT_TYPES = {
  CONTRACT_CREATE: { action: 'CREATE' as AuditAction, resource: 'hop-dong' as AuditResource },
  CONTRACT_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'hop-dong' as AuditResource },
  CONTRACT_UPLOAD_SCAN: { action: 'UPLOAD' as AuditAction, resource: 'hop-dong' as AuditResource },
  CONTRACT_SIGN: { action: 'TRANSITION' as AuditAction, resource: 'hop-dong' as AuditResource },
  CONTRACT_COMPLETE: { action: 'TRANSITION' as AuditAction, resource: 'hop-dong' as AuditResource },
  CONTRACT_LIQUIDATE: { action: 'TRANSITION' as AuditAction, resource: 'hop-dong' as AuditResource },
} as const;

export const IMPL_AUDIT_TYPES = {
  IMPL_UPDATE_PLAN: { action: 'UPDATE' as AuditAction, resource: 'trien-khai' as AuditResource },
  IMPL_UPDATE_PROGRESS: { action: 'UPDATE' as AuditAction, resource: 'trien-khai' as AuditResource },
  IMPL_CONTACT_CONSULATE: { action: 'UPDATE' as AuditAction, resource: 'trien-khai' as AuditResource },
} as const;

export const AMENDMENT_AUDIT_TYPES = {
  AMENDMENT_REQUEST: { action: 'CREATE' as AuditAction, resource: 'de-an' as AuditResource },
  AMENDMENT_APPROVE: { action: 'APPROVE' as AuditAction, resource: 'de-an' as AuditResource },
  AMENDMENT_REJECT: { action: 'REJECT' as AuditAction, resource: 'de-an' as AuditResource },
  AMENDMENT_ROUTE_TO_EVALUATION: { action: 'TRANSITION' as AuditAction, resource: 'de-an' as AuditResource },
} as const;

// =============================================================================
// Phase 9 (M5 Báo cáo + Nghiệm thu + Tài chính) — composite audit type identifiers.
// REPORT_*: báo cáo kết quả (đơn vị nộp + BQL review).
// ACCEPT_*: biên bản nghiệm thu (BQL lập + upload bản scan ký).
// FIN_*: hồ sơ tài chính (tạm ứng / thanh toán / quyết toán).
// =============================================================================

export const REPORT_AUDIT_TYPES = {
  REPORT_SAVE_DRAFT: { action: 'UPDATE' as AuditAction, resource: 'bao-cao' as AuditResource },
  REPORT_SUBMIT: { action: 'SUBMIT' as AuditAction, resource: 'bao-cao' as AuditResource },
  REPORT_REVIEW: { action: 'APPROVE' as AuditAction, resource: 'bao-cao' as AuditResource },
  REPORT_RETURN: { action: 'REJECT' as AuditAction, resource: 'bao-cao' as AuditResource },
} as const;

export const ACCEPTANCE_AUDIT_TYPES = {
  ACCEPT_CREATE: { action: 'CREATE' as AuditAction, resource: 'nghiem-thu' as AuditResource },
  ACCEPT_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'nghiem-thu' as AuditResource },
  ACCEPT_UPLOAD_RECORD: { action: 'UPLOAD' as AuditAction, resource: 'nghiem-thu' as AuditResource },
  ACCEPT_FINALIZE: { action: 'TRANSITION' as AuditAction, resource: 'nghiem-thu' as AuditResource },
  ACCEPT_LIQUIDATE: { action: 'TRANSITION' as AuditAction, resource: 'nghiem-thu' as AuditResource },
} as const;

export const FINANCE_AUDIT_TYPES = {
  FIN_CREATE_ADVANCE: { action: 'CREATE' as AuditAction, resource: 'tai-chinh' as AuditResource },
  FIN_CREATE_PAYMENT: { action: 'CREATE' as AuditAction, resource: 'tai-chinh' as AuditResource },
  FIN_CREATE_SETTLEMENT: { action: 'CREATE' as AuditAction, resource: 'tai-chinh' as AuditResource },
  FIN_TRANSITION: { action: 'TRANSITION' as AuditAction, resource: 'tai-chinh' as AuditResource },
  FIN_UPDATE: { action: 'UPDATE' as AuditAction, resource: 'tai-chinh' as AuditResource },
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
