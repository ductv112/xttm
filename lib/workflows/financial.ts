// FinancialRecord state machine — Phase 9 (M5 Tài chính).
// Three record types: ADVANCE (tạm ứng) | PAYMENT (thanh toán) | SETTLEMENT (quyết toán).
// State machine: DRAFT → SUBMITTED → APPROVED → DISBURSED → SETTLED.
//   - DISBURSED: đã chi tiền cho đơn vị (advance/payment)
//   - SETTLED: đã quyết toán (settlement only)

export type FinancialRecordType = 'ADVANCE' | 'PAYMENT' | 'SETTLEMENT';

export const FINANCIAL_RECORD_TYPES: readonly FinancialRecordType[] = [
  'ADVANCE',
  'PAYMENT',
  'SETTLEMENT',
] as const;

export const FINANCIAL_TYPE_LABELS: Record<FinancialRecordType, string> = {
  ADVANCE: 'Tạm ứng',
  PAYMENT: 'Thanh toán',
  SETTLEMENT: 'Quyết toán',
};

export const FINANCIAL_TYPE_DESCRIPTIONS: Record<
  FinancialRecordType,
  string
> = {
  ADVANCE: 'Tạm ứng kinh phí cho đơn vị sau khi ký hợp đồng',
  PAYMENT: 'Thanh toán phần còn lại sau khi nghiệm thu',
  SETTLEMENT: 'Quyết toán chi tiết toàn bộ kinh phí cuối kỳ',
};

export type FinancialStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DISBURSED'
  | 'SETTLED';

export const FINANCIAL_STATUSES: readonly FinancialStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'DISBURSED',
  'SETTLED',
] as const;

const TRANSITIONS: Record<FinancialStatus, FinancialStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'DRAFT'], // SUBMITTED → DRAFT = trả về sửa
  APPROVED: ['DISBURSED'],
  DISBURSED: ['SETTLED'],
  SETTLED: [],
};

export function canTransitionFinancial(
  from: FinancialStatus,
  to: FinancialStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALLOWED_FINANCIAL_NEXT = (
  status: FinancialStatus,
): FinancialStatus[] => TRANSITIONS[status] ?? [];

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  DISBURSED: 'Đã chi',
  SETTLED: 'Đã quyết toán',
};

export const FINANCIAL_STATUS_BADGE: Record<FinancialStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-amber-100 text-amber-800',
  DISBURSED: 'bg-emerald-100 text-emerald-800',
  SETTLED: 'bg-slate-200 text-slate-900',
};

/**
 * Format số phiếu tài chính — format: PT-XTTM-YYYY-NNN cho thanh toán,
 * TU-XTTM-YYYY-NNN cho tạm ứng, QT-XTTM-YYYY-NNN cho quyết toán.
 */
export function formatFinancialRecordNumber(
  type: FinancialRecordType,
  year: number,
  sequence: number,
): string {
  const prefix =
    type === 'ADVANCE' ? 'TU' : type === 'PAYMENT' ? 'PT' : 'QT';
  return `${prefix}-XTTM-${year}-${String(sequence).padStart(3, '0')}`;
}
