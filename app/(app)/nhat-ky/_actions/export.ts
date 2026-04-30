'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';
import type { Role } from '@/lib/constants';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  type AuditAction,
  type AuditResource,
} from '@/lib/audit-types';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { buildAuditWhere } from './list';
import type { AuditFilter } from './types';

// Cap export size to avoid OOM on Node side and keep CSV download time reasonable.
// 5000 rows × ~250 bytes ≈ 1.2MB CSV — opens in Excel within seconds.
const EXPORT_MAX_ROWS = 5000;

const CSV_HEADER = [
  'Thời gian',
  'Người dùng',
  'Vai trò',
  'Hành động',
  'Phân hệ',
  'ID đối tượng',
  'Địa chỉ IP',
];

/**
 * Export filtered audit log to CSV string with UTF-8 BOM (Excel-compatible).
 * RBAC: requires 'audit-log:read'. Self-audits as EXPORT/audit-log on success.
 */
export async function exportAuditLogsCSV(
  filter: AuditFilter = {},
): Promise<{ filename: string; csv: string; count: number }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'audit-log', 'read')) {
    throw new Error('Bạn không có quyền truy cập nhật ký');
  }

  const where = await buildAuditWhere(filter);

  // No pagination — capped at EXPORT_MAX_ROWS to bound memory + CSV size
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: EXPORT_MAX_ROWS,
    include: {
      user: { select: { fullName: true, role: true } },
    },
  });

  const lines: string[] = [];
  lines.push(CSV_HEADER.map(csvCell).join(','));

  for (const r of rows) {
    const action = r.action as AuditAction;
    const resource = r.resource as AuditResource;
    const userRole = (r.user?.role ?? '') as Role;
    const roleLabel = ROLE_LABELS[userRole] ?? r.user?.role ?? '';
    lines.push(
      [
        formatDateTime(r.createdAt),
        r.user?.fullName ?? '',
        roleLabel,
        AUDIT_ACTION_LABELS[action] ?? action,
        AUDIT_RESOURCE_LABELS[resource] ?? resource,
        r.resourceId ?? '',
        // Truncate IP only — userAgent NOT exported (T-02-01-03 fingerprint mitigation)
        r.ip ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }

  // Prepend UTF-8 BOM ﻿ so Excel renders Vietnamese diacritics correctly
  const csv = '﻿' + lines.join('\r\n');

  const stamp = formatTimestamp(new Date());
  const filename = `nhat-ky-${stamp}.csv`;

  // Self-audit: log the export action (fire-and-forget; auth errors already thrown above)
  try {
    const h = await headers();
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
    const userAgent = h.get('user-agent');
    void logAudit(
      {
        action: 'EXPORT',
        resource: 'audit-log',
        metadata: {
          filename,
          rowCount: rows.length,
          filter,
        },
      },
      session.user.id,
      ip,
      userAgent,
    );
  } catch {
    // headers() may fail outside request scope — ignore
  }

  return { filename, csv, count: rows.length };
}

/** Escape a CSV cell: wrap in quotes, double internal quotes, normalize newlines. */
function csvCell(value: unknown): string {
  if (value == null) return '""';
  const s = String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${s}"`;
}

/** YYYYMMDD-HHmmss in local time for filename suffix. */
function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}
