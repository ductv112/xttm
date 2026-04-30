// /de-an/new — RSC entry cho project wizard 6 bước (PROJ-04..11).
// Pre-conditions:
//   - auth + DONVI role
//   - active ProgramCycle (OPEN_REGISTRATION) — else redirect /de-an
//   - OrganizationProfile.APPROVED — else redirect /de-an (Gate sẽ hiển thị
//     trạng thái phù hợp)
//
// Catalog options (project kinds, sectors, markets, countries, promotion types)
// + đầu mối liên hệ + previous projects → load server-side, pass props xuống
// shell client.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { ROLES, type Role } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { parseContacts } from '@/lib/workflows/orgProfile';

import { ProjectWizardShell } from './_components/ProjectWizardShell';
import { listPreviousProjects } from '../_actions/list-previous';
import type {
  CatalogOption,
  ContactOption,
  PreviousProjectOption,
  ProjectKindOption,
  WizardCatalogData,
} from './_lib/types';

export const metadata = { title: 'Tạo đề án mới' };

async function loadCatalogs(): Promise<WizardCatalogData> {
  const [kinds, sectors, markets, countries, promotions] = await Promise.all([
    prisma.projectKind.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { code: true, name: true },
    }),
    prisma.industrySector.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    }),
    prisma.market.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    }),
    prisma.country.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    }),
    prisma.promotionType.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    }),
  ]);

  return {
    projectKinds: kinds satisfies ProjectKindOption[],
    industrySectors: sectors satisfies CatalogOption[],
    markets: markets satisfies CatalogOption[],
    countries: countries satisfies CatalogOption[],
    promotionTypes: promotions satisfies CatalogOption[],
  };
}

async function loadContacts(orgId: string): Promise<ContactOption[]> {
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    select: { contactsJson: true },
  });
  if (!profile) return [];
  const contacts = parseContacts(profile.contactsJson);
  return contacts.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    role: c.role,
    email: c.email,
    phone: c.phone,
  }));
}

export default async function CreateProjectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (role !== ROLES.DONVI) {
    redirect(defaultLandingPath(role));
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect('/de-an');
  }

  // Active cycle gate
  const cycle = await prisma.programCycle.findFirst({
    where: { status: 'OPEN_REGISTRATION' },
    orderBy: { year: 'desc' },
    select: { id: true, year: true, name: true, registrationCloseAt: true },
  });
  if (!cycle) {
    redirect('/de-an');
  }

  // Profile APPROVED gate
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    select: { status: true },
  });
  if (!profile || profile.status !== 'APPROVED') {
    redirect('/de-an');
  }

  const [catalogs, contacts, previousProjectsRaw] = await Promise.all([
    loadCatalogs(),
    loadContacts(orgId),
    listPreviousProjects(),
  ]);

  const previousProjects: PreviousProjectOption[] = previousProjectsRaw.map(
    (p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      year: p.year,
      kind: p.kind,
    }),
  );

  return (
    <main className="container mx-auto py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Khai báo đề án năm {cycle.year}
        </h1>
        <p className="text-sm text-slate-600">
          Hoàn thành 6 bước để gửi đề án xúc tiến thương mại đến Ban quản lý.
          Tiến độ được lưu tự động sau mỗi 2 giây — bạn có thể tạm dừng và quay
          lại bất cứ lúc nào.
        </p>
      </header>

      <ProjectWizardShell
        userId={session.user.id}
        organizationId={orgId}
        programCycleId={cycle.id}
        year={cycle.year}
        catalogs={catalogs}
        contacts={contacts}
        previousProjects={previousProjects}
      />
    </main>
  );
}
