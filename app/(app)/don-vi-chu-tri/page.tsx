// /don-vi-chu-tri — RSC list page cho BQL phê duyệt hồ sơ đơn vị.
// RBAC defense-in-depth (3 layers):
//   1. auth() session
//   2. canFromDB(role, 'don-vi-chu-tri', 'view') -- but read action; also redirect DONVI to self page
//   3. listOrgProfiles re-checks RBAC internally
// URL search params drive filter (status default SUBMITTED, search optional).

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import { ROLES, type Role } from '@/lib/constants';
import {
  ORG_PROFILE_STATUSES,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

import { listOrgProfiles } from './_actions/list';
import { OrgProfileTable } from './_components/OrgProfileTable';

export const metadata = { title: 'Đơn vị chủ trì — Phê duyệt hồ sơ' };

type SearchParams = {
  status?: string;
  search?: string;
};

const STATUS_SET = new Set<OrgProfileStatus>(ORG_PROFILE_STATUSES);

function parseStatus(raw: string | undefined): OrgProfileStatus | 'ALL' {
  if (!raw) return 'SUBMITTED';
  if (raw === 'ALL') return 'ALL';
  return STATUS_SET.has(raw as OrgProfileStatus) ? (raw as OrgProfileStatus) : 'SUBMITTED';
}

export default async function OrgProfileListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // RBAC layer 1: auth
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  // DONVI users see their own profile, not the admin list
  if (role === ROLES.DONVI) {
    redirect('/don-vi-cua-toi');
  }

  // RBAC layer 2: read check (viewing org-profile list)
  if (!(await canFromDB(role, 'don-vi-chu-tri', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const search = sp.search?.trim() || undefined;

  // RBAC layer 3: listOrgProfiles internally re-checks
  const profiles = await listOrgProfiles({ status, search });

  return (
    <main className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Đơn vị chủ trì — Hồ sơ tổ chức
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tiếp nhận, xem xét và phê duyệt hồ sơ tổ chức do các đơn vị chủ trì gửi lên. Hồ sơ đã phê duyệt cho phép đơn vị nộp đề án trong các chu kỳ XTTM.
        </p>
      </div>

      <OrgProfileTable data={profiles} currentStatus={status} />
    </main>
  );
}
