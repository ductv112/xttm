'use server';

// exportDashboardExcel — generates Excel summary report cho dashboard.
// Returns base64 buffer for client decode + download (pattern: same as nguoi-dung export).

import * as XLSX from 'xlsx';
import { format as formatDate } from 'date-fns';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { type Role } from '@/lib/constants';
import { formatVNDCompact } from '@/lib/format';
import { getDashboardSummary } from '@/lib/dashboard-aggregations';

export type ExportDashboardExcelResult = {
  filename: string;
  base64: string;
};

async function exportDashboardExcelImpl(
  year: number,
): Promise<ExportDashboardExcelResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'dashboard', 'read'))) {
    throw new Error('Bạn không có quyền xuất báo cáo dashboard');
  }
  const summary = await getDashboardSummary(
    year,
    role,
    session.user.organizationId,
  );

  const wb = XLSX.utils.book_new();

  // Sheet 1: Tổng quan
  const overviewRows = [
    ['Báo cáo tổng quan Dashboard XTTMQG'],
    [`Năm: ${year}`],
    [`Xuất bởi: ${session.user.fullName ?? session.user.username}`],
    [`Thời điểm xuất: ${formatDate(new Date(), 'HH:mm dd/MM/yyyy')}`],
    [],
    ['Chỉ số', 'Giá trị'],
    ['Tổng số đề án', summary.stats.projectCount],
    ['Đề án đã đăng ký', summary.stats.registeredProjectCount],
    ['Đề án đã phê duyệt', summary.stats.approvedProjectCount],
    ['Đề án đang triển khai', summary.stats.inProgressProjectCount],
    ['Đề án đã nghiệm thu', summary.stats.completedProjects],
    ['Tỷ lệ hoàn thành', `${summary.stats.completionPercent}%`],
    [],
    ['Kinh phí đăng ký', formatVNDCompact(summary.stats.registeredBudget)],
    ['Kinh phí phê duyệt', formatVNDCompact(summary.stats.approvedBudget)],
    ['Kinh phí hợp đồng', formatVNDCompact(summary.stats.signedBudget)],
    ['Kinh phí giải ngân', formatVNDCompact(summary.stats.disbursedBudget)],
    [],
    ['Số đơn vị tham gia', summary.stats.orgCount],
    ['Đơn vị có hồ sơ duyệt', summary.stats.orgApprovedCount],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

  // Sheet 2: Cảnh báo sai lệch ngân sách
  const budgetRows = summary.alertBudgetVariance.map((a) => ({
    'Mã đề án': a.code,
    'Tên đề án': a.name,
    'Đơn vị': a.organizationName,
    'Đăng ký (VND)': a.registered,
    'Phê duyệt (VND)': a.approved,
    'Sai lệch (VND)': a.variance,
  }));
  const wsBudget = XLSX.utils.json_to_sheet(
    budgetRows.length
      ? budgetRows
      : [{ 'Mã đề án': 'Không có cảnh báo', 'Tên đề án': '', 'Đơn vị': '' }],
  );
  wsBudget['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBudget, 'Sai lệch ngân sách');

  // Sheet 3: Chậm ký HĐ
  const contractRows = summary.alertContractDelay.map((a) => ({
    'Mã đề án': a.code,
    'Tên đề án': a.name,
    'Đơn vị': a.organizationName,
    'Ngày phê duyệt': a.approvedDate
      ? formatDate(a.approvedDate, 'dd/MM/yyyy')
      : '',
    'Số ngày quá hạn': a.daysOverdue,
  }));
  const wsContract = XLSX.utils.json_to_sheet(
    contractRows.length
      ? contractRows
      : [{ 'Mã đề án': 'Không có cảnh báo', 'Tên đề án': '', 'Đơn vị': '' }],
  );
  wsContract['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsContract, 'Chậm ký HĐ');

  // Sheet 4: Báo cáo trễ
  const reportRows = summary.alertReportOverdue.map((a) => ({
    'Mã đề án': a.code,
    'Tên đề án': a.name,
    'Đơn vị': a.organizationName,
    'Ngày kết thúc': a.endDate ? formatDate(a.endDate, 'dd/MM/yyyy') : '',
    'Số ngày quá hạn': a.daysOverdue,
  }));
  const wsReport = XLSX.utils.json_to_sheet(
    reportRows.length
      ? reportRows
      : [{ 'Mã đề án': 'Không có cảnh báo', 'Tên đề án': '', 'Đơn vị': '' }],
  );
  wsReport['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReport, 'Báo cáo trễ');

  // Sheet 5: Liên hệ thương vụ
  const consulateRows = summary.alertConsulate.map((a) => ({
    'Mã đề án': a.code,
    'Tên đề án': a.name,
    'Đơn vị': a.organizationName,
    'Quốc gia': a.countryName ?? '',
    'Ngày diễn ra': a.startDate ? formatDate(a.startDate, 'dd/MM/yyyy') : '',
    'Còn lại (ngày)': a.daysToEvent,
  }));
  const wsConsulate = XLSX.utils.json_to_sheet(
    consulateRows.length
      ? consulateRows
      : [{ 'Mã đề án': 'Không có cảnh báo', 'Tên đề án': '', 'Đơn vị': '' }],
  );
  wsConsulate['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 30 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsConsulate, 'Liên hệ thương vụ');

  // Sheet 6: Đề án theo loại
  const kindRows = summary.chartByKind.map((k) => ({
    'Loại đề án': k.kindLabel,
    'Số lượng': k.count,
  }));
  const wsKind = XLSX.utils.json_to_sheet(
    kindRows.length
      ? kindRows
      : [{ 'Loại đề án': 'Không có dữ liệu', 'Số lượng': 0 }],
  );
  wsKind['!cols'] = [{ wch: 28 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsKind, 'Đề án theo loại');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const base64 = buf.toString('base64');
  const filename = `dashboard-xttmqg-${year}-${formatDate(
    new Date(),
    'yyyyMMdd-HHmmss',
  )}.xlsx`;

  return { filename, base64 };
}

export const exportDashboardExcel = withAuditLog<
  [number],
  ExportDashboardExcelResult
>(
  {
    action: 'EXPORT',
    resource: 'dashboard',
    captureAfter: (r, [year]) => ({ filename: r.filename, year }),
  },
  exportDashboardExcelImpl,
);
