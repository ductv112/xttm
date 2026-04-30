import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { listAuditLogs } from './_actions/list';
import { AuditLogFilterBar } from './_components/AuditLogFilterBar';
import { AuditLogTable } from './_components/AuditLogTable';
import type { AuditAction, AuditResource } from '@/lib/audit-types';
import type { AuditFilter } from './_actions/types';

export const metadata = { title: 'Nhật ký truy cập' };

type SearchParams = Promise<{
  userId?: string;
  resources?: string;
  actions?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
}>;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  // Defense-in-depth — middleware Plan 01-03 already guards, layer 2 against config drift
  if (!can(session.user.role as Role, 'audit-log', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const sp = await searchParams;

  const filter: AuditFilter = {
    userId: sp.userId || undefined,
    resources: sp.resources
      ? (sp.resources.split(',').filter(Boolean) as AuditResource[])
      : undefined,
    actions: sp.actions
      ? (sp.actions.split(',').filter(Boolean) as AuditAction[])
      : undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    keyword: sp.q || undefined,
  };

  const pageIndex = Math.max(0, Number(sp.page ?? '0') || 0);
  const pageSize = 50;

  const initial = await listAuditLogs(filter, pageIndex, pageSize);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Nhật ký truy cập
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Theo dõi mọi thay đổi nghiệp vụ trong hệ thống
        </p>
      </header>

      <AuditLogFilterBar />

      <AuditLogTable
        initialFilter={filter}
        initialPageIndex={pageIndex}
        initialData={initial}
      />
    </div>
  );
}
