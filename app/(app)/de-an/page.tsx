// /de-an — Cổng quản lý đề án.
// 2 nhánh hiển thị:
//   - DONVI: SubmissionGate + danh sách đề án của đơn vị (full create/edit flow)
//   - Non-DONVI (ADMIN/BANQL/LANHDAO/CHUYENVIEN/HOIDONG/TAICHINH): master list
//     read-only theo phạm vi role với search/filter/sort/export Excel.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { canFromDB } from '@/lib/permissions-db';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/shared/EmptyState';

import { SubmissionGate } from './_components/SubmissionGate';
import { MyProjectsList } from './_components/MyProjectsList';
import { MasterTable } from './_components/MasterTable';
import { MasterFilterBar } from './_components/MasterFilterBar';
import { listMyProjects } from './_actions/list-mine';
import { listProjectsForRole, listAvailableYears } from './_actions/list-all';

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

type SearchParams = Promise<{
  q?: string;
  status?: string;
  year?: string;
  kind?: string;
  mine?: string;
}>;

const ROLE_HEADERS: Partial<
  Record<Role, { title: string; subtitle: string }>
> = {
  ADMIN: {
    title: 'Đề án (Quản trị)',
    subtitle:
      'Chế độ quản trị toàn quyền: tra cứu mọi đề án trên hệ thống, drill-down đầy đủ vòng đời đăng ký → thẩm định → triển khai → nghiệm thu.',
  },
  BANQL: {
    title: 'Đề án — Toàn hệ thống',
    subtitle:
      'Tra cứu toàn bộ đề án thuộc các chu kỳ chương trình do Ban quản lý điều phối. Click vào đề án để xem chi tiết và xử lý theo từng giai đoạn.',
  },
  LANHDAO: {
    title: 'Đề án — Tổng quan',
    subtitle:
      'Giám sát tổng thể danh mục đề án Xúc tiến thương mại quốc gia. Phục vụ quyết định cấp cao và báo cáo điều hành.',
  },
  CHUYENVIEN: {
    title: 'Đề án',
    subtitle:
      'Tra cứu đề án trong hệ thống. Bật "Chỉ của tôi" để lọc các đề án được giao cho bạn kiểm tra hành chính.',
  },
  HOIDONG: {
    title: 'Đề án — Phạm vi thẩm định',
    subtitle:
      'Đề án đã hoàn thiện hồ sơ và đi vào giai đoạn thẩm định, phê duyệt, triển khai, nghiệm thu. Phục vụ tham khảo trong quá trình chấm điểm.',
  },
  TAICHINH: {
    title: 'Đề án — Phạm vi tài chính',
    subtitle:
      'Đề án đã được phê duyệt và đang triển khai/hoàn thành. Tra cứu thông tin để xử lý phiếu tạm ứng, thanh toán, quyết toán.',
  },
};

export default async function DeAnHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  // RBAC: must have de-an:read
  if (!(await canFromDB(role, 'de-an', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  // Non-DONVI roles: master list view với role-scoped filtering + search + export
  if (role !== ROLES.DONVI) {
    const sp = await searchParams;
    const filters = {
      search: sp.q?.trim() || undefined,
      status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
      year:
        sp.year && sp.year !== 'ALL'
          ? Number.parseInt(sp.year, 10) || undefined
          : undefined,
      kind: sp.kind && sp.kind !== 'ALL' ? sp.kind : undefined,
      mineOnly: sp.mine === '1',
    };
    const [rows, years] = await Promise.all([
      listProjectsForRole(filters),
      listAvailableYears(),
    ]);

    const header = ROLE_HEADERS[role] ?? {
      title: 'Đề án',
      subtitle: `Danh sách đề án theo phạm vi vai trò ${
        ROLE_LABELS[role] ?? role
      }.`,
    };

    return (
      <main className="container mx-auto max-w-7xl py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {header.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              {header.subtitle}
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <StatPill label="Tổng số" value={rows.length} tone="blue" />
          </div>
        </header>

        <div className="mb-4">
          <MasterFilterBar
            years={years}
            showMineOnly={role === ROLES.CHUYENVIEN}
          />
        </div>

        <MasterTable rows={rows} />
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

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'amber' | 'green' | 'red';
}) {
  const map: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div
      className={`min-w-[120px] rounded-md border px-4 py-2 text-center ${map[tone]}`}
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
