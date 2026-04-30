// /chuong-trinh/[id]/nhat-ky — tab Nhật ký (audit log scoped to this cycle).
// RSC: query prisma.auditLog directly với resource='chuong-trinh' + resourceId=id.
// Phase 3 simplification: render small custom table (CycleAuditLogTab) thay vì reuse
// full AuditLogTable từ /nhat-ky (RBAC requires audit-log:read which BANQL không có).

import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import {
  AUDIT_ACTIONS,
  type AuditAction,
} from '@/lib/audit-types';

import { getCycleDetail } from '../../_actions/get-detail';
import { CycleAuditLogTab } from '../_components/CycleAuditLogTab';
import type { CycleAuditEntry } from '../_components/CycleAuditLogTab';

const VALID_ACTIONS = new Set<AuditAction>(AUDIT_ACTIONS);

function summarizeDiff(diffJson: string | null): string {
  if (!diffJson) return 'Không có chi tiết';
  try {
    const parsed = JSON.parse(diffJson);
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as { after?: unknown; before?: unknown; metadata?: unknown };
      // Look at after diff first — most actions capture "what changed"
      if (obj.after && typeof obj.after === 'object') {
        const keys = Object.keys(obj.after as Record<string, unknown>);
        if (keys.length > 0) {
          return `Trường: ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '…' : ''}`;
        }
      }
      // Fall back to metadata
      if (obj.metadata && typeof obj.metadata === 'object') {
        const meta = obj.metadata as Record<string, unknown>;
        if (typeof meta.from === 'string' && typeof meta.to === 'string') {
          return `${meta.from} → ${meta.to}`;
        }
        if (typeof meta.subject === 'string') {
          return `Tiêu đề: ${meta.subject}`;
        }
        if (typeof meta.fileName === 'string') {
          return `Tệp: ${meta.fileName}`;
        }
      }
    }
    return 'Cập nhật';
  } catch {
    return 'Cập nhật';
  }
}

async function loadCycleAuditEntries(cycleId: string): Promise<CycleAuditEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      resource: 'chuong-trinh',
      resourceId: cycleId,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { fullName: true, role: true } },
    },
  });
  return rows.map((r) => {
    const action = (VALID_ACTIONS.has(r.action as AuditAction)
      ? (r.action as AuditAction)
      : 'UPDATE') as AuditAction;
    return {
      id: r.id,
      createdAt: r.createdAt,
      userFullName: r.user?.fullName ?? '(không rõ)',
      userRole: r.user?.role ?? '',
      action,
      resourceId: r.resourceId,
      diffSummary: summarizeDiff(r.diffJson),
      ip: r.ip,
    };
  });
}

export default async function NhatKyTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    // Validate cycle existence (RBAC inherited from layout)
    await getCycleDetail(id);
  } catch {
    notFound();
  }

  const entries = await loadCycleAuditEntries(id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Nhật ký hoạt động chu kỳ
        </h2>
        <p className="text-xs text-slate-500">
          Mọi thao tác trên chu kỳ này — gồm cập nhật cấu hình, chuyển trạng thái,
          tải lên công văn và gửi thông báo
        </p>
      </div>
      <CycleAuditLogTab entries={entries} />
    </div>
  );
}
