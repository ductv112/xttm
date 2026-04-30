'use server';

// exportUsersExcel — server action returns base64 buffer of .xlsx file.
// Client decodes base64 → Blob → triggers download. Includes self-audit EXPORT entry.

import * as XLSX from 'xlsx';
import { format as formatDate } from 'date-fns';

import { auth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { listUsers } from './list';
import type { ListUsersFilter } from './schemas';

const EXPORT_CAP = 5000; // bound memory + match audit log export cap convention

export type ExportUsersResult = {
  filename: string;
  base64: string;
  count: number;
};

async function exportUsersExcelImpl(
  filter?: ListUsersFilter,
): Promise<ExportUsersResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'read')) {
    throw new Error('Bạn không có quyền xuất danh sách người dùng');
  }

  const { rows, total } = await listUsers(filter, 0, EXPORT_CAP);

  // 8 columns Vietnamese — order matches spec
  const data = rows.map((u) => ({
    'Họ tên': u.fullName,
    'Tên đăng nhập': u.username,
    Email: u.email ?? '',
    'Số điện thoại': u.phone ?? '',
    'Vai trò': ROLE_LABELS[u.role as Role] ?? u.role,
    'Đơn vị': u.organization?.name ?? '',
    'Trạng thái': u.isActive ? 'Đang hoạt động' : 'Đã khóa',
    'Ngày tạo': formatDateTime(u.createdAt),
  }));

  const ws = XLSX.utils.json_to_sheet(data, {
    header: [
      'Họ tên',
      'Tên đăng nhập',
      'Email',
      'Số điện thoại',
      'Vai trò',
      'Đơn vị',
      'Trạng thái',
      'Ngày tạo',
    ],
  });

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 28 }, // Họ tên
    { wch: 18 }, // Tên đăng nhập
    { wch: 30 }, // Email
    { wch: 16 }, // Số điện thoại
    { wch: 22 }, // Vai trò
    { wch: 32 }, // Đơn vị
    { wch: 18 }, // Trạng thái
    { wch: 22 }, // Ngày tạo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Người dùng');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const base64 = buf.toString('base64');

  const filename = `nguoi-dung-${formatDate(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`;

  return {
    filename,
    base64,
    count: total,
  };
}

export const exportUsersExcel = withAuditLog<
  [ListUsersFilter | undefined] | [],
  ExportUsersResult
>(
  {
    action: 'EXPORT',
    resource: 'nguoi-dung',
    captureAfter: (result) => ({
      filename: result.filename,
      count: result.count,
    }),
  },
  exportUsersExcelImpl,
);
