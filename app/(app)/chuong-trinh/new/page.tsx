// RSC page cho wizard /chuong-trinh/new — RBAC redirect + load catalog data + render shell.
// Plan 03-04 CYCLE-01..04 entry point.
//
// Catalog options (scoring criteria, organizations, email templates) load server-side
// và pass via prop để Step components không cần client-fetch. ProgramCycle list (year-exists
// pre-check) load lazily client-side qua listCycles() server action.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

import { CycleWizardShell } from './_components/CycleWizardShell';
import type {
  ScoringCriterionOption,
  OrganizationOption,
  EmailTemplateOption,
} from './_lib/types';

export const metadata = { title: 'Tạo chu kỳ chương trình mới' };

async function loadCatalogData(): Promise<{
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
}> {
  // Load active scoring criteria with parent name for label display.
  // Children + parents both come back; we filter parents (no parentId) into a name lookup.
  const allCriteria = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, weight: true, parentId: true },
  });
  const parentNameById = new Map<string, string>();
  for (const c of allCriteria) {
    if (!c.parentId) parentNameById.set(c.id, c.name);
  }
  // Children only — parents thường là nhóm header, không nên chọn trực tiếp.
  // Nhưng cho POC, expose tất cả để admin có flexibility. Children có parentName,
  // parents có parentName=null.
  const scoringCriteria: ScoringCriterionOption[] = allCriteria.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    parentName: c.parentId ? (parentNameById.get(c.parentId) ?? null) : null,
  }));

  const organizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, type: true },
  });

  const emailTemplates = await prisma.documentTemplate.findMany({
    where: { isActive: true, category: 'CONG_VAN_MOI' },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, category: true },
  });

  return {
    scoringCriteria,
    organizations: organizations.map((o) => ({ id: o.id, name: o.name, type: o.type })),
    emailTemplates: emailTemplates.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
    })),
  };
}

export default async function CreateCyclePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'chuong-trinh', 'create'))) {
    redirect(defaultLandingPath(role));
  }

  const { scoringCriteria, organizations, emailTemplates } = await loadCatalogData();

  return (
    <main className="container mx-auto py-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Tạo chu kỳ chương trình mới
        </h1>
        <p className="text-sm text-slate-600">
          Hoàn thành 5 bước để khởi tạo chu kỳ chương trình XTTM năm. Tiến độ được lưu
          tự động — bạn có thể tạm dừng và quay lại bất cứ lúc nào.
        </p>
      </header>
      <CycleWizardShell
        scoringCriteria={scoringCriteria}
        organizations={organizations}
        emailTemplates={emailTemplates}
      />
    </main>
  );
}
