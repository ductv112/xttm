// AcceptanceRecord helpers — Phase 9 (M5 Nghiệm thu + Thanh lý).
// AcceptanceRecord không có complex state machine — đơn giản:
//   - tạo (BQL) sau khi báo cáo APPROVED
//   - upload bản scan đã ký
//   - liquidationDate set khi thanh lý HĐ → project COMPLETED + contract LIQUIDATED

export type AcceptanceResult = 'PASS' | 'PARTIAL' | 'FAIL';

export const ACCEPTANCE_RESULTS: readonly AcceptanceResult[] = [
  'PASS',
  'PARTIAL',
  'FAIL',
] as const;

export const ACCEPTANCE_RESULT_LABELS: Record<AcceptanceResult, string> = {
  PASS: 'Đạt yêu cầu',
  PARTIAL: 'Đạt một phần',
  FAIL: 'Không đạt',
};

export const ACCEPTANCE_RESULT_BADGE: Record<AcceptanceResult, string> = {
  PASS: 'bg-emerald-100 text-emerald-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  FAIL: 'bg-red-100 text-red-800',
};

/**
 * Generate biên bản nghiệm thu number — format: NNN/BB-NT-XTTM/YYYY
 */
export function formatAcceptanceNumber(
  year: number,
  sequence: number,
): string {
  return `${String(sequence).padStart(3, '0')}/BB-NT-XTTM/${year}`;
}
