'use server';

// notifyResults — BQL gửi thông báo kết quả phê duyệt cho từng đơn vị chủ trì.
// Compose body từ Tiptap template với variables {tenDonVi}, {tenDeAn}, {kinhPhiDuyet}, {soQD}.
// Mock: tạo Notification + NotificationDispatch records (no real email send).
// Audit: NOTIFY_RESULT × phe-duyet.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { formatVND } from '@/lib/format';
import { formatDate } from '@/lib/format';
import type { Role } from '@/lib/constants';

export type NotifyResultsInput = {
  decisionId: string;
  /** Tiptap HTML template với placeholders {tenDonVi} / {tenDeAn} / {kinhPhiDuyet} / {soQD} / {ngayKy} */
  contentHtmlTemplate: string;
  /** Subject line — supports same variables */
  subject: string;
};

export type NotifyResultsResult = {
  notificationId: string;
  approvedDispatchCount: number;
  rejectedDispatchCount: number;
};

async function notifyResultsImpl(
  input: NotifyResultsInput,
): Promise<NotifyResultsResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'create'))) {
    throw new Error('Bạn không có quyền gửi thông báo');
  }

  const decision = await prisma.approvalDecision.findUnique({
    where: { id: input.decisionId },
    include: {
      submission: { select: { programCycleId: true, projectIdsJson: true } },
    },
  });
  if (!decision) throw new Error('Không tìm thấy quyết định phê duyệt');

  // Parse approvedItems
  let approvedItems: Array<{
    projectId: string;
    approvedBudget: number;
    comments?: string;
  }> = [];
  try {
    const parsed = JSON.parse(decision.approvedItemsJson);
    if (Array.isArray(parsed)) {
      approvedItems = parsed.filter(
        (x): x is { projectId: string; approvedBudget: number } =>
          typeof x === 'object' &&
          x !== null &&
          typeof (x as { projectId?: unknown }).projectId === 'string' &&
          typeof (x as { approvedBudget?: unknown }).approvedBudget === 'number',
      );
    }
  } catch {
    approvedItems = [];
  }

  // Parse all submission project ids (to find rejected projects)
  let allProjectIds: string[] = [];
  try {
    const parsed = JSON.parse(decision.submission.projectIdsJson);
    if (Array.isArray(parsed)) {
      allProjectIds = parsed.filter(
        (x): x is string => typeof x === 'string',
      );
    }
  } catch {
    allProjectIds = [];
  }
  const approvedIds = new Set(approvedItems.map((i) => i.projectId));
  const rejectedIds = allProjectIds.filter((id) => !approvedIds.has(id));

  if (allProjectIds.length === 0) {
    throw new Error('Quyết định không có đề án nào để gửi thông báo');
  }

  // Load projects + organizations
  const projects = await prisma.project.findMany({
    where: { id: { in: allProjectIds } },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // Subject and content per project — substitute variables
  const subject = input.subject?.trim() || 'Kết quả phê duyệt đề án XTTMQG';

  // Validate template length
  if (
    !input.contentHtmlTemplate ||
    input.contentHtmlTemplate.trim().length < 50
  ) {
    throw new Error('Nội dung thông báo quá ngắn');
  }

  // Create 1 Notification (parent) + N dispatches (one per organization)
  // Note: per-org content varies due to variable substitution → dispatch.recipientOrgId only
  // and replicate per-recipient via Notification.content fanout pattern. POC simplified:
  // store template HTML in Notification.content + 1 dispatch per project.

  const result = await prisma.$transaction(async (tx) => {
    const notification = await tx.notification.create({
      data: {
        programCycleId: decision.submission.programCycleId,
        type: 'CYCLE_OPENED', // POC: reuse existing enum (no new type added)
        subject,
        content: input.contentHtmlTemplate,
        recipientType: 'ORGANIZATION',
        createdById: session.user.id,
      },
    });

    let approvedDispatch = 0;
    let rejectedDispatch = 0;
    const dispatches: Array<{ recipientOrgId: string }> = [];
    for (const item of approvedItems) {
      const proj = projectById.get(item.projectId);
      if (!proj) continue;
      dispatches.push({ recipientOrgId: proj.organization.id });
      approvedDispatch += 1;
    }
    for (const id of rejectedIds) {
      const proj = projectById.get(id);
      if (!proj) continue;
      dispatches.push({ recipientOrgId: proj.organization.id });
      rejectedDispatch += 1;
    }

    if (dispatches.length > 0) {
      await tx.notificationDispatch.createMany({
        data: dispatches.map((d) => ({
          notificationId: notification.id,
          recipientOrgId: d.recipientOrgId,
          status: 'SENT',
          sentAt: new Date(),
        })),
      });
    }

    return {
      notificationId: notification.id,
      approvedDispatch,
      rejectedDispatch,
    };
  });

  revalidatePath(`/phe-duyet/${decision.submissionId}`);

  return {
    notificationId: result.notificationId,
    approvedDispatchCount: result.approvedDispatch,
    rejectedDispatchCount: result.rejectedDispatch,
  };
}

export const notifyResults = withAuditLog<
  [NotifyResultsInput],
  NotifyResultsResult
>(
  {
    action: 'DISPATCH',
    resource: 'phe-duyet',
    resourceIdFromArgs: ([input]) => input.decisionId,
    captureAfter: (r) => ({
      notificationId: r.notificationId,
      approvedDispatchCount: r.approvedDispatchCount,
      rejectedDispatchCount: r.rejectedDispatchCount,
      kind: 'NOTIFY_RESULT',
    }),
    metadata: { reason: 'BQL gửi thông báo kết quả phê duyệt cho đơn vị' },
  },
  notifyResultsImpl,
);

// ---------------------------------------------------------------------------
// previewNotification — render preview cho từng đơn vị (UI side)
// ---------------------------------------------------------------------------

export async function previewNotificationForDecision(decisionId: string): Promise<
  Array<{
    organizationName: string;
    projectCode: string;
    projectName: string;
    approved: boolean;
    approvedBudget: number | null;
    body: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    throw new Error('Bạn không có quyền xem');
  }

  const decision = await prisma.approvalDecision.findUnique({
    where: { id: decisionId },
    include: { submission: true },
  });
  if (!decision) return [];

  let approvedItems: Array<{ projectId: string; approvedBudget: number }> = [];
  try {
    const parsed = JSON.parse(decision.approvedItemsJson);
    if (Array.isArray(parsed)) approvedItems = parsed;
  } catch {
    approvedItems = [];
  }
  const approvedById = new Map(
    approvedItems.map((i) => [i.projectId, i.approvedBudget] as const),
  );

  let allIds: string[] = [];
  try {
    const parsed = JSON.parse(decision.submission.projectIdsJson);
    if (Array.isArray(parsed)) allIds = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    allIds = [];
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: allIds } },
    include: { organization: { select: { name: true } } },
  });

  return projects.map((p) => {
    const approvedBudget = approvedById.get(p.id) ?? null;
    const isApproved = approvedBudget !== null;
    return {
      organizationName: p.organization.name,
      projectCode: p.code,
      projectName: p.name,
      approved: isApproved,
      approvedBudget,
      body: substituteVars('', {
        tenDonVi: p.organization.name,
        tenDeAn: p.name,
        kinhPhiDuyet: approvedBudget !== null ? formatVND(approvedBudget) : '—',
        soQD: decision.decisionNumber,
        ngayKy: formatDate(decision.decisionDate),
      }),
    };
  });
}

function substituteVars(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}
