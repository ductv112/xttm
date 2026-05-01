// Report state machine — Phase 9 (M5 Báo cáo kết quả).
// State machine: DRAFT → SUBMITTED → APPROVED | RETURNED → SUBMITTED.

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';

export const REPORT_STATUSES: readonly ReportStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'RETURNED',
] as const;

const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'RETURNED'],
  RETURNED: ['SUBMITTED'],
  APPROVED: [],
};

export function canTransitionReport(
  from: ReportStatus,
  to: ReportStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  RETURNED: 'Trả bổ sung',
};

export const REPORT_STATUS_BADGE: Record<ReportStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  RETURNED: 'bg-amber-100 text-amber-800',
};

// =============================================================================
// QUANTITATIVE INDICATORS — chỉ tiêu định lượng kết quả
// =============================================================================

export type QuantitativeRow = {
  id: string;
  name: string; // tên chỉ tiêu (vd: số DN tham gia)
  unit: string; // đơn vị tính (vd: doanh nghiệp)
  planned: number | null; // số kế hoạch
  actual: number | null; // số thực tế
  note?: string;
};

export type QuantitativePayload = {
  rows: QuantitativeRow[];
};

export function parseQuantitative(
  raw: string | null | undefined,
): QuantitativePayload {
  if (!raw) return { rows: [] };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const p = v as QuantitativePayload;
      if (!Array.isArray(p.rows)) p.rows = [];
      return p;
    }
    return { rows: [] };
  } catch {
    return { rows: [] };
  }
}

// Default rows seeded khi tạo Report mới — chỉ tiêu thường gặp
export const DEFAULT_QUANTITATIVE_ROWS: QuantitativeRow[] = [
  {
    id: 'qr-companies',
    name: 'Số doanh nghiệp tham gia',
    unit: 'doanh nghiệp',
    planned: null,
    actual: null,
  },
  {
    id: 'qr-contracts',
    name: 'Số hợp đồng/biên bản ghi nhớ ký kết',
    unit: 'hợp đồng',
    planned: null,
    actual: null,
  },
  {
    id: 'qr-revenue',
    name: 'Doanh thu/giá trị giao dịch dự kiến',
    unit: 'triệu USD',
    planned: null,
    actual: null,
  },
  {
    id: 'qr-buyers',
    name: 'Số đối tác/khách hàng tiếp xúc',
    unit: 'lượt',
    planned: null,
    actual: null,
  },
];
