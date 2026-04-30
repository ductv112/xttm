export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'ACCEPTED';

const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['RETURNED', 'ACCEPTED'],
  RETURNED: ['SUBMITTED'],
  ACCEPTED: [],
};

export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  RETURNED: 'Trả bổ sung',
  ACCEPTED: 'Đã duyệt',
};
