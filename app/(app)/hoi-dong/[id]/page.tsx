// /hoi-dong/[id] — Trang chi tiết hội đồng (BQL).
// Tabs: Thành viên / Đề án phân công / Kết quả tổng hợp / Báo cáo.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { getAggregateScores } from '../_actions/aggregate';
import { listEligibleUsers } from '../_actions/manage-members';
import { listAssignableProjects } from '../_actions/assign-projects';
import { CouncilDetail } from './_components/CouncilDetail';

export const metadata = { title: 'Chi tiết hội đồng' };

export default async function CouncilDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;
  const aggregate = await getAggregateScores(id);
  if (!aggregate) {
    notFound();
  }

  const canManage = await canFromDB(role, 'tham-dinh', 'create');
  const [eligibleUsers, assignableProjects] = canManage
    ? await Promise.all([listEligibleUsers(id), listAssignableProjects(id)])
    : [[], []];

  return (
    <main className="container mx-auto max-w-7xl py-6">
      <div className="mb-4">
        <Link
          href="/hoi-dong"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách hội đồng
        </Link>
      </div>

      <CouncilDetail
        aggregate={aggregate}
        eligibleUsers={eligibleUsers}
        assignableProjects={assignableProjects}
        canManage={canManage}
      />
    </main>
  );
}
