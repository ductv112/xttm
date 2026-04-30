// /phan-cong — LĐ BQL phân công chuyên viên kiểm tra (drag-drop board).
// RBAC: 'tiep-nhan' resource × 'assign' action — BANQL.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listAssignmentBoard } from './_actions/list-staff';
import { AssignmentBoard } from './_components/AssignmentBoard';

export const metadata = { title: 'Phân công kiểm tra' };

export default async function PhanCongPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'assign'))) {
    redirect(defaultLandingPath(role));
  }

  const data = await listAssignmentBoard();

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Phân công chuyên viên kiểm tra
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Lãnh đạo Ban quản lý kéo-thả hồ sơ vào ô chuyên viên để phân công, kéo
          ngược lại cột trái để thu hồi. Có thể click vào hồ sơ để chọn chuyên
          viên qua dialog (dành cho thiết bị di động hoặc bàn phím).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Hồ sơ chờ phân công:{' '}
            <strong className="text-blue-700">
              {data.unassignedProjects.length}
            </strong>
          </span>
          <span>•</span>
          <span>
            Hồ sơ đang xử lý:{' '}
            <strong className="text-emerald-700">
              {data.assignedProjects.filter((p) => p.status === 'IN_REVIEW')
                .length}
            </strong>
          </span>
          <span>•</span>
          <span>
            Đợi bổ sung:{' '}
            <strong className="text-amber-700">
              {data.assignedProjects.filter(
                (p) => p.status === 'SUPPLEMENT_REQUIRED',
              ).length}
            </strong>
          </span>
        </div>
      </header>

      <AssignmentBoard data={data} currentUserId={session.user.id} />
    </main>
  );
}
