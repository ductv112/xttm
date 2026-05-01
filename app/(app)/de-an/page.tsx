// /de-an — Cổng tiếp nhận đề án (PROJ-01, PROJ-03, PROJ-12).
// RSC: auth check + role gate + active cycle + orgProfile lookup + projects list.
//
// Audience: tất cả role có thể xem (DONVI / BANQL / LANHDAO etc), nhưng:
//   - DONVI: thấy SubmissionGate (3 states) + danh sách đề án của đơn vị mình
//   - BANQL/LANHDAO/HOIDONG/CHUYENVIEN: redirect tới list cấp hệ thống (Phase 6)
//                                       — POC: hiển thị empty state với hint
//
// Phase 5 scope chỉ implement DONVI flow đầy đủ; non-DONVI fallback empty state.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { canFromDB } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/shared/EmptyState';

import { SubmissionGate } from './_components/SubmissionGate';
import { MyProjectsList } from './_components/MyProjectsList';
import { listMyProjects } from './_actions/list-mine';

export const metadata = { title: 'Đề án' };

async function loadActiveCycle() {
  const cycle = await prisma.programCycle.findFirst({
    where: { status: 'OPEN_REGISTRATION' },
    orderBy: { year: 'desc' },
    select: {
      id: true,
      year: true,
      name: true,
      registrationCloseAt: true,
    },
  });
  return cycle;
}

async function loadProfileStatus(orgId: string) {
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    select: { status: true },
  });
  return profile?.status as
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'REJECTED'
    | undefined;
}

export default async function DeAnHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  // RBAC: must have de-an:read
  if (!(await canFromDB(role, 'de-an', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  // ADMIN bypass: full data access — show all projects across ALL orgs
  if (role === ROLES.ADMIN) {
    const projects = await listMyProjects();
    return (
      <main className="container mx-auto py-8 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Đề án (Quản trị)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Chế độ quản trị: hiển thị toàn bộ đề án trong hệ thống, bao gồm tất
            cả đơn vị chủ trì.
          </p>
        </header>

        <section aria-labelledby="all-projects-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2
              id="all-projects-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Tất cả đề án
            </h2>
            <p className="text-sm text-slate-500">
              {projects.length > 0
                ? `${projects.length} đề án`
                : 'Chưa có đề án nào'}
            </p>
          </div>
          <MyProjectsList projects={projects} />
        </section>
      </main>
    );
  }

  // Non-DONVI roles: Phase 5 scope chỉ DONVI flow → fallback friendly screen
  if (role !== ROLES.DONVI) {
    return (
      <main className="container mx-auto py-8 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Đề án</h1>
          <p className="mt-1 text-sm text-slate-600">
            Danh sách đề án theo phạm vi vai trò của bạn.
          </p>
        </header>
        <EmptyState
          icon="inbox"
          heading="Phạm vi đề án theo vai trò chưa được cấu hình"
          description="Phân hệ tiếp nhận, kiểm tra, thẩm định đề án dành cho Ban quản lý / Chuyên viên / Hội đồng sẽ được kích hoạt trong các phase tiếp theo."
        />
      </main>
    );
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return (
      <main className="container mx-auto py-8 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Đề án</h1>
        </header>
        <EmptyState
          icon="shield"
          heading="Tài khoản chưa được gán đơn vị"
          description="Vui lòng liên hệ Quản trị viên để được gán vào một đơn vị chủ trì."
        />
      </main>
    );
  }

  const [cycle, profileStatus, projects] = await Promise.all([
    loadActiveCycle(),
    loadProfileStatus(orgId),
    listMyProjects(),
  ]);

  return (
    <main className="container mx-auto py-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Đề án</h1>
        <p className="mt-1 text-sm text-slate-600">
          Khai báo, theo dõi và quản lý đề án xúc tiến thương mại của đơn vị
          bạn. Mọi đề án sẽ được Ban quản lý tiếp nhận và thẩm định theo chu kỳ
          chương trình hiện hành.
        </p>
      </header>

      <div className="mb-8">
        <SubmissionGate
          cycle={cycle}
          profile={{ status: profileStatus ?? null }}
        />
      </div>

      <section aria-labelledby="my-projects-heading">
        <div className="mb-4 flex items-baseline justify-between">
          <h2
            id="my-projects-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Danh sách đề án của đơn vị
          </h2>
          <p className="text-sm text-slate-500">
            {projects.length > 0
              ? `${projects.length} đề án`
              : 'Chưa có đề án nào'}
          </p>
        </div>
        <MyProjectsList projects={projects} />
      </section>
    </main>
  );
}
