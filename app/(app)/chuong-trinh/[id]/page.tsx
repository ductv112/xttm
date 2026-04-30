// /chuong-trinh/[id] — default tab content = Tổng quan.
// Plan 03-06 layout-based tab routing: layout.tsx renders header + nav, this page
// renders Tổng quan content. RSC fetches cycle (Next 15 dedups in same render with layout)
// + recent audit entries scoped to this cycle.

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import { AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';

import { getCycleDetail } from '../_actions/get-detail';
import { TongQuanTab } from './_components/TongQuanTab';

type RecentAuditEntry = {
  id: string;
  createdAt: Date;
  userFullName: string;
  actionLabel: string;
  summary: string;
};

async function loadRecentAuditEntries(cycleId: string): Promise<RecentAuditEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      resource: 'chuong-trinh',
      resourceId: cycleId,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { fullName: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    userFullName: r.user?.fullName ?? '(không rõ)',
    actionLabel: AUDIT_ACTION_LABELS[r.action as AuditAction] ?? r.action,
    summary: summarizeDiff(r.diffJson),
  }));
}

function summarizeDiff(diffJson: string | null): string {
  if (!diffJson) return 'Không có chi tiết';
  try {
    const parsed = JSON.parse(diffJson);
    if (parsed && typeof parsed === 'object' && 'after' in parsed) {
      const after = (parsed as { after?: unknown }).after;
      if (after && typeof after === 'object') {
        const keys = Object.keys(after as Record<string, unknown>);
        if (keys.length === 0) return 'Cập nhật';
        return `Trường: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}`;
      }
    }
    return 'Cập nhật';
  } catch {
    return 'Cập nhật';
  }
}

export default async function CycleDetailDefaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  const { id } = await params;
  let cycle;
  try {
    cycle = await getCycleDetail(id);
  } catch {
    notFound();
  }

  const canEdit = await canFromDB(role, 'chuong-trinh', 'update');
  const recentAuditEntries = await loadRecentAuditEntries(id);

  return (
    <TongQuanTab
      cycle={cycle}
      canEdit={canEdit}
      recentAuditEntries={recentAuditEntries}
    />
  );
}
