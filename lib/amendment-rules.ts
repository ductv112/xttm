// Amendment rules — Phase 8 (M4) Plan 08-01.
// Theo Điều 13 NĐ 28/2018/NĐ-CP: phân loại điều chỉnh đề án thành 2 nhóm:
//   - Loại NHỎ: thay đổi không làm thay đổi bản chất, BQL phê duyệt nội bộ
//   - Loại TRỌNG YẾU: thay đổi bản chất, yêu cầu thẩm định lại
//
// Hệ thống tự suy luận `isCritical` từ amendmentType — UI chỉ cho người dùng
// chọn loại điều chỉnh, không cho tick checkbox "trọng yếu" để tránh người
// dùng tự đánh giá sai.

export const AMENDMENT_TYPES = [
  'TIME', // Thời gian thực hiện
  'LOCATION', // Địa điểm tổ chức
  'UNIT_NAME', // Tên đơn vị chủ trì
  'PROJECT_NAME', // Tên đề án
  'OBJECTIVE', // Mục tiêu đề án (TRỌNG YẾU)
  'CONTENT', // Nội dung đề án (TRỌNG YẾU)
  'BUDGET', // Dự toán kinh phí (TRỌNG YẾU)
  'MARKET', // Thị trường mục tiêu (TRỌNG YẾU)
  'OTHER', // Khác (mặc định loại nhỏ)
] as const;

export type AmendmentType = (typeof AMENDMENT_TYPES)[number];

export const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  TIME: 'Thời gian thực hiện',
  LOCATION: 'Địa điểm tổ chức',
  UNIT_NAME: 'Tên đơn vị chủ trì',
  PROJECT_NAME: 'Tên đề án',
  OBJECTIVE: 'Mục tiêu đề án',
  CONTENT: 'Nội dung đề án',
  BUDGET: 'Dự toán kinh phí',
  MARKET: 'Thị trường mục tiêu',
  OTHER: 'Khác',
};

/**
 * Loại điều chỉnh TRỌNG YẾU theo Điều 13 NĐ 28/2018/NĐ-CP.
 * Yêu cầu thẩm định lại — chuyển project về EVALUATING.
 */
export const CRITICAL_AMENDMENT_TYPES: ReadonlyArray<AmendmentType> = [
  'OBJECTIVE',
  'CONTENT',
  'BUDGET',
  'MARKET',
] as const;

/**
 * Trả về true nếu loại điều chỉnh thuộc nhóm TRỌNG YẾU (yêu cầu thẩm định lại).
 * Trả về false cho loại NHỎ (BQL phê duyệt nội bộ).
 *
 * @example
 * isCriticalAmendment('TIME')      // false
 * isCriticalAmendment('OBJECTIVE') // true
 */
export function isCriticalAmendment(type: AmendmentType | string): boolean {
  return (CRITICAL_AMENDMENT_TYPES as readonly string[]).includes(type);
}

// =============================================================================
// AMENDMENT STATUS — workflow
// =============================================================================

export const AMENDMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RESUBMIT_EVALUATION',
] as const;

export type AmendmentStatus = (typeof AMENDMENT_STATUSES)[number];

export const AMENDMENT_STATUS_LABELS: Record<AmendmentStatus, string> = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
  RESUBMIT_EVALUATION: 'Chuyển thẩm định lại',
};

export const AMENDMENT_STATUS_BADGE: Record<AmendmentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  RESUBMIT_EVALUATION: 'bg-blue-100 text-blue-800 border-blue-200',
};

// =============================================================================
// CONTRACT STATUS — workflow
// =============================================================================

export const CONTRACT_STATUSES = [
  'DRAFT',
  'SIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'LIQUIDATED',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Bản nháp',
  SIGNED: 'Đã ký',
  IN_PROGRESS: 'Đang triển khai',
  COMPLETED: 'Đã nghiệm thu',
  LIQUIDATED: 'Đã thanh lý',
};

export const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800 border-slate-200',
  SIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LIQUIDATED: 'bg-slate-200 text-slate-900 border-slate-300',
};

/**
 * Generate contract number format `XTTM/YYYY/NNN` from running counter.
 *
 * @param year - Year (e.g. 2026)
 * @param sequence - Running number (1-based)
 */
export function formatContractNumber(year: number, sequence: number): string {
  const padded = String(sequence).padStart(3, '0');
  return `XTTM/${year}/${padded}`;
}

/**
 * Parse contract number into year + sequence.
 * Returns null if format invalid.
 */
export function parseContractNumber(
  contractNo: string,
): { year: number; sequence: number } | null {
  const match = contractNo.match(/^XTTM\/(\d{4})\/(\d{3,})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  };
}
