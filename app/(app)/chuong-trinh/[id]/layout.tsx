// RSC layout cho /chuong-trinh/[id] — shared header + tabs nav across 6 sub-routes.
// Plan 03-06 hero detail page entry point. Each sub-route page re-fetches getCycleDetail
// via Next 15 dedup; this layout fetches once cho header + tabs visibility.
//
// RBAC chain (defense-in-depth):
//   1. auth() — redirect /login nếu chưa đăng nhập
//   2. canFromDB('chuong-trinh','read') — redirect defaultLandingPath nếu thiếu quyền
//   3. getCycleDetail() throws khi cycle null → notFound() 404
//
// canEdit precomputed lần khi layout render và pass tới CycleDetailHeader (header có
// thể hiển thị action buttons gated theo canEdit ở Plan 03-07).

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { getCycleDetail } from '../_actions/get-detail';
import { CycleDetailHeader } from './_components/CycleDetailHeader';
import { CycleTabsNav } from './_components/CycleTabsNav';

export const metadata = { title: 'Chi tiết chu kỳ chương trình XTTM' };

export default async function CycleDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'chuong-trinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;

  let cycle;
  try {
    cycle = await getCycleDetail(id);
  } catch {
    notFound();
  }

  const canEdit = await canFromDB(role, 'chuong-trinh', 'update');

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <CycleDetailHeader cycle={cycle} canEdit={canEdit} />
      <CycleTabsNav cycleId={id} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
