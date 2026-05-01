'use server';

// exportProjectsExcel — server action xuất Excel danh sách đề án theo phạm vi role.
// Returns base64 buffer; client decode → download.

import * as XLSX from 'xlsx';
import { format as formatDateFn } from 'date-fns';

import { auth } from '@/lib/auth';
import { withAuditLog } from '@/lib/audit';
import { formatDate, formatVND } from '@/lib/format';
import {
  PROJECT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/lib/workflows/project';

import { listProjectsForRole, type MasterFilters } from './list-all';

export type ExportProjectsResult = {
  filename: string;
  base64: string;
  count: number;
};

async function exportProjectsExcelImpl(
  filters: MasterFilters = {},
): Promise<ExportProjectsResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const rows = await listProjectsForRole(filters);

  const data = rows.map((r) => ({
    'Mã đề án': r.code,
    'Tên đề án': r.name,
    'Đơn vị chủ trì': r.organizationName,
    'Loại đề án': PROJECT_KIND_LABELS[r.kind] ?? r.kind,
    'Năm chu kỳ': r.programCycleYear,
    'Trạng thái':
      PROJECT_STATUS_LABELS[r.status as ProjectStatus] ?? r.status,
    'Ngân sách đề xuất (VND)': r.totalBudget !== null
      ? formatVND(r.totalBudget)
      : '',
    'Ngân sách duyệt (VND)':
      r.approvedBudget !== null ? formatVND(r.approvedBudget) : '',
    'Ngày nộp': r.submittedAt ? formatDate(r.submittedAt) : '',
    'Ngày tiếp nhận': r.receivedAt ? formatDate(r.receivedAt) : '',
    'Ngày ký HĐ': r.approvedAt ? formatDate(r.approvedAt) : '',
    'Chuyên viên kiểm tra': r.assignedReviewerName ?? '',
    'Có hợp đồng': r.hasContract ? 'Có' : '',
    'Có báo cáo': r.hasReport ? 'Có' : '',
    'Có nghiệm thu': r.hasAcceptance ? 'Có' : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data, {
    header: [
      'Mã đề án',
      'Tên đề án',
      'Đơn vị chủ trì',
      'Loại đề án',
      'Năm chu kỳ',
      'Trạng thái',
      'Ngân sách đề xuất (VND)',
      'Ngân sách duyệt (VND)',
      'Ngày nộp',
      'Ngày tiếp nhận',
      'Ngày ký HĐ',
      'Chuyên viên kiểm tra',
      'Có hợp đồng',
      'Có báo cáo',
      'Có nghiệm thu',
    ],
  });

  ws['!cols'] = [
    { wch: 16 },
    { wch: 50 },
    { wch: 32 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Đề án');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const base64 = buf.toString('base64');
  const filename = `de-an-${formatDateFn(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`;

  return {
    filename,
    base64,
    count: rows.length,
  };
}

export const exportProjectsExcel = withAuditLog<
  [MasterFilters | undefined] | [],
  ExportProjectsResult
>(
  {
    action: 'EXPORT',
    resource: 'de-an',
    captureAfter: (result) => ({
      filename: result.filename,
      count: result.count,
    }),
  },
  exportProjectsExcelImpl,
);
