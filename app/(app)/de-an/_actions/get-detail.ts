'use server';

// getProjectDetail — return full project with parent + children + versions + documents.
// RBAC (T-05-01-02 cross-tenant):
//   - DONVI: only own organization's projects
//   - BANQL/CHUYENVIEN/HOIDONG/LANHDAO/ADMIN: all projects (canFromDB de-an:read)
//
// Returns null if not found OR caller has no permission to view (avoid leaking existence).

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import {
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
  type ProjectStatus,
} from '@/lib/workflows/project';

export type ProjectDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  category: string | null;
  uploadedAt: Date;
  uploaderName: string | null;
};

export type ProjectVersionEntry = {
  id: string;
  versionNumber: number;
  reason: string | null;
  createdAt: Date;
  createdByName: string | null;
};

export type ProjectChildSummary = {
  id: string;
  code: string;
  name: string;
  year: number;
  status: ProjectStatus;
};

export type ProjectDetail = {
  id: string;
  code: string;
  name: string;
  year: number;
  kind: string;
  status: ProjectStatus;
  programCycleId: string;
  programCycleYear: number;
  programCycleName: string;
  programCycleStatus: string;
  organizationId: string;
  organizationName: string;
  parentProjectId: string | null;
  parent: ProjectChildSummary | null;
  children: ProjectChildSummary[];
  generalInfo: ReturnType<typeof parseGeneralInfo>;
  objectives: ReturnType<typeof parseObjectives>;
  plan: ReturnType<typeof parsePlan>;
  budget: ReturnType<typeof parseBudget>;
  pmContactId: string | null;
  pmContactSnapshot: { name: string; title: string; role: string; email: string; phone: string } | null;
  submittedAt: Date | null;
  assignedToUserId: string | null;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  documents: ProjectDocument[];
  versions: ProjectVersionEntry[];
  // Phase 8 (M4) — Triển khai + Điều chỉnh
  implementationJson: string | null;
  contactedConsulate: boolean;
  consulateContactJson: string | null;
  contractId: string | null;
  contractNo: string | null;
  contractStatus: string | null;
};

export async function getProjectDetail(
  projectId: string,
): Promise<ProjectDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      programCycle: { select: { year: true, name: true, status: true } },
      organization: { select: { name: true } },
      parent: { select: { id: true, code: true, name: true, year: true, status: true } },
      childProjects: {
        select: { id: true, code: true, name: true, year: true, status: true },
        orderBy: { year: 'asc' },
      },
      versions: {
        orderBy: { versionNumber: 'asc' },
      },
      contract: {
        select: { id: true, contractNo: true, status: true },
      },
    },
  });

  if (!project || project.deletedAt) return null;

  // Authorization
  // ADMIN bypass: full data access — admin can view any project
  const isAdmin = session.user.role === 'ADMIN';
  const isOwnOrg =
    session.user.organizationId &&
    session.user.organizationId === project.organizationId;
  const canRead = await canFromDB(session.user.role, 'de-an', 'read');
  if (!isAdmin && !isOwnOrg && !canRead) {
    return null; // do not leak existence
  }

  // Resolve documents
  const attachments = await prisma.attachment.findMany({
    where: { entityType: 'Project', entityId: project.id },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { fullName: true } } },
  });
  const documents: ProjectDocument[] = attachments.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    category: a.signedNumber, // repurposed col stores category code
    uploadedAt: a.createdAt,
    uploaderName: a.uploader?.fullName ?? null,
  }));

  // Resolve version createdBy names in batch
  const creatorIds = Array.from(
    new Set(
      project.versions
        .map((v) => v.createdById)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const creators = creatorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const creatorMap = new Map(creators.map((c) => [c.id, c.fullName]));
  const versions: ProjectVersionEntry[] = project.versions.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    reason: v.reason,
    createdAt: v.createdAt,
    createdByName: v.createdById ? creatorMap.get(v.createdById) ?? null : null,
  }));

  // Resolve PM contact snapshot from OrganizationProfile contactsJson
  let pmContactSnapshot: ProjectDetail['pmContactSnapshot'] = null;
  if (project.pmContactId) {
    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { organizationId: project.organizationId },
      select: { contactsJson: true },
    });
    if (orgProfile?.contactsJson) {
      try {
        const arr = JSON.parse(orgProfile.contactsJson);
        if (Array.isArray(arr)) {
          const found = arr.find(
            (c: { id?: string }) => c?.id === project.pmContactId,
          );
          if (found) {
            pmContactSnapshot = {
              name: found.name ?? '',
              title: found.title ?? '',
              role: found.role ?? '',
              email: found.email ?? '',
              phone: found.phone ?? '',
            };
          }
        }
      } catch {
        pmContactSnapshot = null;
      }
    }
  }

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    year: project.year,
    kind: project.kind,
    status: project.status as ProjectStatus,
    programCycleId: project.programCycleId,
    programCycleYear: project.programCycle.year,
    programCycleName: project.programCycle.name,
    programCycleStatus: project.programCycle.status,
    organizationId: project.organizationId,
    organizationName: project.organization.name,
    parentProjectId: project.parentProjectId,
    parent: project.parent
      ? {
          id: project.parent.id,
          code: project.parent.code,
          name: project.parent.name,
          year: project.parent.year,
          status: project.parent.status as ProjectStatus,
        }
      : null,
    children: project.childProjects.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      year: c.year,
      status: c.status as ProjectStatus,
    })),
    generalInfo: parseGeneralInfo(project.generalInfoJson),
    objectives: parseObjectives(project.objectivesJson),
    plan: parsePlan(project.planJson),
    budget: parseBudget(project.budgetJson),
    pmContactId: project.pmContactId,
    pmContactSnapshot,
    submittedAt: project.submittedAt,
    assignedToUserId: project.assignedReviewerId,
    currentVersion: project.currentVersion,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    documents,
    versions,
    // Phase 8 (M4)
    implementationJson: project.implementationJson,
    contactedConsulate: project.contactedConsulate,
    consulateContactJson: project.consulateContactJson,
    contractId: project.contract?.id ?? null,
    contractNo: project.contract?.contractNo ?? null,
    contractStatus: project.contract?.status ?? null,
  };
}
