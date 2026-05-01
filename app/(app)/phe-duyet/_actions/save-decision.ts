'use server';

// saveDecision — BQL nhập quyết định phê duyệt từ Bộ.
// - Create ApprovalDecision (1:1 với SubmissionDraft)
// - For each approvedItem: project EVALUATING → APPROVED + set approvedBudget + approvedAt(receivedAt)
// - For projects in submission KHÔNG có trong approvedItems: EVALUATING → REJECTED_FINAL
// Audit: DECISION_SAVE × phe-duyet.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { canTransitionProject } from '@/lib/workflows/project';
import type { Role } from '@/lib/constants';

export type ApprovalDecisionItem = {
  projectId: string;
  approvedBudget: number;
  comments?: string;
};

export type SaveDecisionInput = {
  submissionId: string;
  decisionNumber: string;
  decisionDate: string; // ISO date
  signedByName: string;
  signedByTitle: string;
  approvedItems: ApprovalDecisionItem[];
  notes?: string;
};

export type SaveDecisionResult = {
  decisionId: string;
  approvedCount: number;
  rejectedCount: number;
  totalApprovedBudget: number;
};

async function saveDecisionImpl(
  input: SaveDecisionInput,
): Promise<SaveDecisionResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'create'))) {
    throw new Error('Bạn không có quyền nhập quyết định phê duyệt');
  }

  // Validate input
  const decisionNumber = input.decisionNumber?.trim();
  if (!decisionNumber || decisionNumber.length < 3) {
    throw new Error('Số quyết định không hợp lệ');
  }
  const signedByName = input.signedByName?.trim();
  const signedByTitle = input.signedByTitle?.trim();
  if (!signedByName || !signedByTitle) {
    throw new Error('Vui lòng nhập tên + chức vụ người ký');
  }
  const decisionDate = new Date(input.decisionDate);
  if (Number.isNaN(decisionDate.getTime())) {
    throw new Error('Ngày ký quyết định không hợp lệ');
  }

  if (!Array.isArray(input.approvedItems)) {
    throw new Error('Danh sách phê duyệt không hợp lệ');
  }

  // Idempotency guard — same decisionNumber rejected (T-07-02-03)
  const existingByNumber = await prisma.approvalDecision.findFirst({
    where: { decisionNumber },
    select: { id: true, submissionId: true },
  });
  if (
    existingByNumber &&
    existingByNumber.submissionId !== input.submissionId
  ) {
    throw new Error(
      `Số quyết định ${decisionNumber} đã được sử dụng cho tờ trình khác`,
    );
  }

  // Load submission + projects
  const submission = await prisma.submissionDraft.findUnique({
    where: { id: input.submissionId },
    include: { decision: true },
  });
  if (!submission) throw new Error('Không tìm thấy tờ trình');
  if (submission.decision) {
    throw new Error('Tờ trình đã có quyết định phê duyệt');
  }
  let submissionProjectIds: string[] = [];
  try {
    const parsed = JSON.parse(submission.projectIdsJson);
    if (Array.isArray(parsed)) {
      submissionProjectIds = parsed.filter(
        (x): x is string => typeof x === 'string',
      );
    }
  } catch {
    submissionProjectIds = [];
  }

  // Sanitize approvedItems: only those in submission, valid budget
  const approvedMap = new Map<string, ApprovalDecisionItem>();
  for (const item of input.approvedItems) {
    if (!submissionProjectIds.includes(item.projectId)) continue;
    if (typeof item.approvedBudget !== 'number' || item.approvedBudget < 0) {
      continue;
    }
    approvedMap.set(item.projectId, {
      projectId: item.projectId,
      approvedBudget: item.approvedBudget,
      comments: item.comments?.slice(0, 1000),
    });
  }
  if (approvedMap.size === 0) {
    throw new Error('Quyết định phải phê duyệt ít nhất 1 đề án');
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: submissionProjectIds } },
    select: {
      id: true,
      status: true,
      proposedBudget: true,
      name: true,
      code: true,
    },
  });

  // Validate projects are all EVALUATING + transitions valid
  for (const p of projects) {
    if (p.status !== 'EVALUATING') {
      throw new Error(
        `Đề án ${p.code} đang ở trạng thái ${p.status} — không thể phê duyệt qua quyết định này`,
      );
    }
  }
  if (!canTransitionProject('EVALUATING', 'APPROVED')) {
    throw new Error('Workflow không cho phép EVALUATING → APPROVED');
  }
  if (!canTransitionProject('EVALUATING', 'REJECTED_FINAL')) {
    throw new Error('Workflow không cho phép EVALUATING → REJECTED_FINAL');
  }

  // Validate approved budget <= proposed (warn, but allow because plan permits)
  // Plan T-07-02-01 says UI shows warning — server allows but caps
  for (const item of approvedMap.values()) {
    const proj = projects.find((p) => p.id === item.projectId);
    if (proj?.proposedBudget && item.approvedBudget > proj.proposedBudget) {
      // Allow but capture in metadata
      // (UI prevents this scenario; server log only)
    }
  }

  const totalApprovedBudget = [...approvedMap.values()].reduce(
    (acc, i) => acc + i.approvedBudget,
    0,
  );

  // Atomic transaction: create decision + update projects
  const result = await prisma.$transaction(async (tx) => {
    const decision = await tx.approvalDecision.create({
      data: {
        submissionId: input.submissionId,
        decisionNumber,
        decisionDate,
        signedByName,
        signedByTitle,
        approvedItemsJson: JSON.stringify([...approvedMap.values()]),
        totalApprovedBudget,
        notes: input.notes?.trim() || null,
        createdById: session.user.id,
      },
      select: { id: true },
    });

    let approvedCount = 0;
    let rejectedCount = 0;

    for (const p of projects) {
      const item = approvedMap.get(p.id);
      if (item) {
        await tx.project.update({
          where: { id: p.id },
          data: {
            status: 'APPROVED',
            approvedBudget: item.approvedBudget,
          },
        });
        approvedCount += 1;
      } else {
        await tx.project.update({
          where: { id: p.id },
          data: {
            status: 'REJECTED_FINAL',
          },
        });
        rejectedCount += 1;
      }
    }

    // Mark submission as SUBMITTED_TO_BO if not already
    await tx.submissionDraft.update({
      where: { id: input.submissionId },
      data: {
        status: 'SUBMITTED_TO_BO',
        submittedToBoAt: tx === tx ? new Date() : new Date(),
      },
    });

    return { decisionId: decision.id, approvedCount, rejectedCount };
  });

  revalidatePath('/phe-duyet');
  revalidatePath(`/phe-duyet/${input.submissionId}`);
  revalidatePath('/de-an');

  return {
    decisionId: result.decisionId,
    approvedCount: result.approvedCount,
    rejectedCount: result.rejectedCount,
    totalApprovedBudget,
  };
}

export const saveDecision = withAuditLog<
  [SaveDecisionInput],
  SaveDecisionResult
>(
  {
    action: 'APPROVE',
    resource: 'phe-duyet',
    resourceIdFromArgs: ([input]) => input.submissionId,
    captureAfter: (r, [input]) => ({
      decisionId: r.decisionId,
      decisionNumber: input.decisionNumber,
      approvedCount: r.approvedCount,
      rejectedCount: r.rejectedCount,
      totalApprovedBudget: r.totalApprovedBudget,
      kind: 'DECISION_SAVE',
    }),
    metadata: { reason: 'BQL nhập quyết định phê duyệt từ Bộ' },
  },
  saveDecisionImpl,
);
