// /de-an/[id]/edit — Plan 05-03 Task 3: edit + resubmit entry point.
// RSC: auth + getProjectDetail (cross-tenant guard) + status check (DRAFT or
// SUPPLEMENT_REQUIRED only) → load wizard data → ProjectEditEntry client
// component hydrates store + redirects /de-an/new để tiếp tục soạn thảo.
//
// Resubmit flow (PROJ-21):
//   - Status SUPPLEMENT_REQUIRED → user click "Chỉnh sửa và nộp lại" trong header
//   - This page loads existing project vào wizard store
//   - User chỉnh sửa, click "Nộp lại" tại Step6 → submitProject server action
//   - submit.ts đã handle SUPPLEMENT_REQUIRED → RESUBMITTED transition + version snapshot
//
// RBAC:
//   - DONVI ownership required (cross-tenant guard via getProjectDetail null-on-deny)
//   - status must be DRAFT or SUPPLEMENT_REQUIRED — otherwise redirect tới detail page

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { ROLES, type Role } from '@/lib/constants';
import { defaultLandingPath } from '@/lib/permissions';
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/lib/workflows/project';

import { getProjectDetail } from '../../_actions/get-detail';
import type {
  ProjectWizardData,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step5DocumentEntry,
  Step6Data,
} from '../../new/_lib/types';
import { ProjectEditEntry } from './_components/ProjectEditEntry';

export const metadata = { title: 'Chỉnh sửa đề án' };

const EDITABLE_STATUSES: ProjectStatus[] = ['DRAFT', 'SUPPLEMENT_REQUIRED'];

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (role !== ROLES.DONVI) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;

  let project;
  try {
    project = await getProjectDetail(id);
  } catch {
    notFound();
  }
  if (!project) notFound();

  // Owner check (defense-in-depth — getProjectDetail also checks)
  if (
    !session.user.organizationId ||
    session.user.organizationId !== project.organizationId
  ) {
    redirect(`/de-an/${id}`);
  }

  // Status gate: only DRAFT or SUPPLEMENT_REQUIRED can be edited
  if (!EDITABLE_STATUSES.includes(project.status)) {
    redirect(`/de-an/${id}`);
  }

  // Build wizard initial data từ project shape
  const step1: Step1Data = {
    name: project.name,
    kind: project.kind,
    industrySectorIds: project.generalInfo.industrySectorIds ?? [],
    marketIds: project.generalInfo.marketIds ?? [],
    countryIds: project.generalInfo.countryIds ?? [],
    promotionTypeIds: project.generalInfo.promotionTypeIds ?? [],
    timeRange: project.generalInfo.timeRange ?? null,
    isTwoYear: project.generalInfo.isTwoYear ?? false,
    nextYear: project.generalInfo.nextYear ?? null,
  };
  const step2: Step2Data = {
    objective: project.objectives.objective ?? '',
    content: project.objectives.content ?? '',
    planRows: (project.plan.rows ?? []).map((r, idx) => ({
      id: r.id ?? `plan-${idx}`,
      task: r.task ?? '',
      deliverable: r.deliverable ?? '',
      dueDate: r.dueDate ?? null,
      owner: r.owner ?? '',
    })),
  };
  const step3: Step3Data = {
    rows: (project.budget.rows ?? []).map((r, idx) => ({
      id: r.id ?? `budget-${idx}`,
      item: r.item ?? '',
      unit: r.unit ?? '',
      quantity: r.quantity ?? 0,
      unitPrice: r.unitPrice ?? 0,
      amount:
        r.amount ?? (r.quantity ?? 0) * (r.unitPrice ?? 0),
      source: r.source === 'SELF' ? 'SELF' : 'STATE',
      note: r.note ?? '',
    })),
    totalState: project.budget.totalState ?? 0,
    totalSelf: project.budget.totalSelf ?? 0,
    total: project.budget.total ?? 0,
    proposedTotalReference: null,
  };
  const step4: Step4Data = { pmContactId: project.pmContactId };
  // Documents: map ProjectDetail.documents → Step5DocumentEntry shape
  const VALID_CATEGORIES = ['PLAN', 'CAPABILITY', 'EVIDENCE', 'OTHER'] as const;
  type Cat = (typeof VALID_CATEGORIES)[number];
  const step5: Step5Data = {
    documents: project.documents.map<Step5DocumentEntry>((d) => ({
      attachmentId: d.id,
      fileName: d.fileName,
      category:
        d.category && (VALID_CATEGORIES as readonly string[]).includes(d.category)
          ? (d.category as Cat)
          : 'OTHER',
      fileSize: d.fileSize,
      fileUrl: d.fileUrl,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  };
  const step6: Step6Data = { declarationConfirmed: false };

  const initialData: Partial<ProjectWizardData> = {
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
  };

  const hintLabel =
    project.status === 'SUPPLEMENT_REQUIRED'
      ? 'Chỉnh sửa và nộp lại đề án'
      : `Tiếp tục soạn thảo (${PROJECT_STATUS_LABELS[project.status]})`;

  return (
    <ProjectEditEntry
      userId={session.user.id}
      projectId={project.id}
      projectCode={project.code}
      status={project.status}
      initialData={initialData}
      hintLabel={hintLabel}
    />
  );
}
