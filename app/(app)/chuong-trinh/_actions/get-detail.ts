'use server';

// getCycleDetail — full cycle details for Plan 03-06 6-tab detail page.
// Fetches: cycle row + invitationLetterAttachment + invitedOrganizations + dispatchSummary.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { listCycleDispatches } from '@/lib/notifications';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';
import type {
  CycleAttachmentSummary,
  CycleDetail,
  CycleOrganizationSummary,
} from './types';

function safeParseStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // ignore — return empty
  }
  return [];
}

function safeParseConfigJson(
  json: string | null,
): {
  description: string | null;
  scoringCriteriaIds: string[];
  evaluationCriteriaIds: string[];
  emailTemplateIds: string[];
  raw: Record<string, unknown> | null;
} {
  if (!json) {
    return {
      description: null,
      scoringCriteriaIds: [],
      evaluationCriteriaIds: [],
      emailTemplateIds: [],
      raw: null,
    };
  }
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') {
      return {
        description: null,
        scoringCriteriaIds: [],
        evaluationCriteriaIds: [],
        emailTemplateIds: [],
        raw: null,
      };
    }
    const obj = parsed as Record<string, unknown>;
    const pickStringArr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    return {
      description: typeof obj.description === 'string' ? obj.description : null,
      scoringCriteriaIds: pickStringArr(obj.scoringCriteriaIds),
      evaluationCriteriaIds: pickStringArr(obj.evaluationCriteriaIds),
      emailTemplateIds: pickStringArr(obj.emailTemplateIds),
      raw: obj,
    };
  } catch {
    return {
      description: null,
      scoringCriteriaIds: [],
      evaluationCriteriaIds: [],
      emailTemplateIds: [],
      raw: null,
    };
  }
}

export async function getCycleDetail(id: string): Promise<CycleDetail> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'read'))) {
    throw new Error('Bạn không có quyền truy cập chu kỳ chương trình');
  }

  if (!id || typeof id !== 'string') {
    throw new Error('Mã chu kỳ không hợp lệ');
  }

  const cycle = await prisma.programCycle.findUnique({
    where: { id },
    include: {
      _count: { select: { projects: true } },
    },
  });
  if (!cycle) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }

  const invitedOrganizationIds = safeParseStringArray(cycle.invitedOrganizations);
  const config = safeParseConfigJson(cycle.configJson);

  // Fetch attachment + invited orgs + dispatch summary in parallel
  const [attachment, invitedOrgs, dispatchSummary] = await Promise.all([
    cycle.invitationLetterAttachmentId
      ? prisma.attachment.findUnique({
          where: { id: cycle.invitationLetterAttachmentId },
        })
      : Promise.resolve(null),
    invitedOrganizationIds.length > 0
      ? prisma.organization.findMany({
          where: { id: { in: invitedOrganizationIds } },
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([] as Array<{ id: string; name: string; code: string }>),
    listCycleDispatches(id, { limit: 5 }),
  ]);

  const invitationLetterAttachment: CycleAttachmentSummary | null = attachment
    ? {
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        signedNumber: attachment.signedNumber,
        signedDate: attachment.signedDate,
        signedByName: attachment.signedByName,
        signedByTitle: attachment.signedByTitle,
        uploadedById: attachment.uploadedById,
        createdAt: attachment.createdAt,
      }
    : null;

  const invitedOrganizations: CycleOrganizationSummary[] = invitedOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    code: o.code,
  }));

  return {
    id: cycle.id,
    year: cycle.year,
    name: cycle.name,
    description: config.description,
    status: cycle.status as ProgramCycleStatus,
    totalBudget: cycle.totalBudget,
    registrationOpenAt: cycle.registrationOpenAt,
    registrationCloseAt: cycle.registrationCloseAt,
    supplementDeadline: cycle.supplementDeadline,
    evaluationStartAt: cycle.evaluationStartAt,
    evaluationEndAt: cycle.evaluationEndAt,
    approvalDeadline: cycle.approvalDeadline,
    invitationLetterAttachmentId: cycle.invitationLetterAttachmentId,
    invitationLetterAttachment,
    invitedOrganizationIds,
    invitedOrganizations,
    scoringCriteriaIds: config.scoringCriteriaIds,
    evaluationCriteriaIds: config.evaluationCriteriaIds,
    emailTemplateIds: config.emailTemplateIds,
    configJson: config.raw,
    dispatchSummary,
    projectCount: cycle._count.projects,
    createdById: cycle.createdById,
    createdAt: cycle.createdAt,
    updatedAt: cycle.updatedAt,
  };
}
