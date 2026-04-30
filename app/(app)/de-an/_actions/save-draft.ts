'use server';

// saveDraftProject — autosave/save-as-draft for the wizard.
// Behavior:
//   - If projectId provided: update that project (must belong to caller org + must be DRAFT or SUPPLEMENT_REQUIRED).
//   - If no projectId: find existing DRAFT for {org, year, programCycleId} OR create new.
//
// Used by autosave (debounce 2s in client) AND explicit "Lưu nháp" button.
// Mass-assignment guard (T-05-01-03): Zod whitelist via saveDraftSchema.
// Cross-tenant guard (T-05-01-02): always check session.user.organizationId.

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import { computeBudgetTotals } from '@/lib/workflows/project';
import { removeDiacritics } from '@/lib/vi-search';

import { saveDraftSchema, type SaveDraftInput } from './types';

const PROJECT_CODE_PREFIX = 'XTTM';

/**
 * Generate a project code in form `XTTM-{year}-{NNN}` based on existing count.
 * Idempotent enough for POC: race-conditions resolved by Prisma @unique on code.
 */
async function generateProjectCode(year: number): Promise<string> {
  const count = await prisma.project.count({ where: { year } });
  const next = (count + 1).toString().padStart(3, '0');
  return `${PROJECT_CODE_PREFIX}-${year}-${next}`;
}

export type SaveDraftResult = {
  id: string;
  code: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
};

async function saveDraftImpl(input: SaveDraftInput): Promise<SaveDraftResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(
      'Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'),
    );
  }
  const data = parsed.data;

  // Verify program cycle exists + open (only enforce for new drafts so editing
  // an old draft doesn't fail when cycle has moved on)
  const cycle = await prisma.programCycle.findUnique({
    where: { id: data.programCycleId },
    select: { id: true, year: true, status: true },
  });
  if (!cycle) {
    throw new Error('Chu kỳ chương trình không tồn tại');
  }

  // Verify org profile is APPROVED for new drafts (PROJ-03 gating)
  // Skip on update — user may continue editing existing draft even if approval expired.
  if (!data.projectId) {
    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { organizationId: orgId },
      select: { status: true },
    });
    if (!orgProfile || orgProfile.status !== 'APPROVED') {
      throw new Error(
        'Hồ sơ đơn vị chưa được phê duyệt — chưa thể tạo đề án mới',
      );
    }
    if (cycle.status !== 'OPEN_REGISTRATION') {
      throw new Error(
        'Chu kỳ chương trình hiện không mở đăng ký — không thể tạo đề án mới',
      );
    }
  }

  // Compute budget totals server-side (defence in depth — client may compute too)
  const budgetWithTotals = data.budget
    ? {
        ...data.budget,
        ...computeBudgetTotals(data.budget.rows ?? []),
      }
    : null;

  const baseUpdate = {
    name: data.name,
    kind: data.kind,
    year: data.year,
    generalInfoJson: data.generalInfo ? JSON.stringify(data.generalInfo) : null,
    objectivesJson: data.objectives ? JSON.stringify(data.objectives) : null,
    planJson: data.plan ? JSON.stringify(data.plan) : null,
    budgetJson: budgetWithTotals ? JSON.stringify(budgetWithTotals) : null,
    pmContactId: data.pmContactId ?? null,
    proposedBudget: budgetWithTotals?.total ?? null,
    searchKey: removeDiacritics(`${data.name} ${data.kind}`),
  };

  let saved;

  if (data.projectId) {
    // UPDATE path — verify ownership + editable status
    const existing = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, organizationId: true, status: true },
    });
    if (!existing || existing.organizationId !== orgId) {
      throw new Error('Không tìm thấy đề án hoặc bạn không có quyền sửa');
    }
    if (
      existing.status !== 'DRAFT' &&
      existing.status !== 'SUPPLEMENT_REQUIRED' &&
      existing.status !== 'TENTATIVE'
    ) {
      throw new Error('Đề án ở trạng thái này không thể chỉnh sửa');
    }
    saved = await prisma.project.update({
      where: { id: data.projectId },
      data: baseUpdate,
    });
  } else {
    // FIND-OR-CREATE path — keep one DRAFT per (org, year, cycle) to avoid spam
    const existingDraft = await prisma.project.findFirst({
      where: {
        organizationId: orgId,
        programCycleId: data.programCycleId,
        year: data.year,
        status: 'DRAFT',
        parentProjectId: null,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingDraft) {
      saved = await prisma.project.update({
        where: { id: existingDraft.id },
        data: baseUpdate,
      });
    } else {
      const code = await generateProjectCode(data.year);
      saved = await prisma.project.create({
        data: {
          ...baseUpdate,
          code,
          status: 'DRAFT',
          programCycleId: data.programCycleId,
          organizationId: orgId,
          createdById: session.user.id,
        },
      });
    }
  }

  revalidatePath('/de-an');
  revalidatePath(`/de-an/${saved.id}`);

  return {
    id: saved.id,
    code: saved.code,
    status: saved.status,
    currentVersion: saved.currentVersion,
    updatedAt: saved.updatedAt,
  };
}

export const saveDraftProject = withAuditLog<[SaveDraftInput], SaveDraftResult>(
  {
    action: 'UPDATE',
    resource: 'de-an',
    resourceIdFromResult: (r) => r?.id ?? null,
    captureAfter: (r) => ({
      code: r.code,
      status: r.status,
      currentVersion: r.currentVersion,
    }),
  },
  saveDraftImpl,
);

// =============================================================================
// Helper: get-or-create-draft on entry (used by /de-an/new page server-side)
// =============================================================================

const getOrCreateDraftSchema = z.object({
  programCycleId: z.string().min(1).max(64),
  year: z.number().int().min(2020).max(2050),
});

export async function getOrCreateMyDraft(input: {
  programCycleId: string;
  year: number;
}): Promise<{ id: string; code: string } | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const parsed = getOrCreateDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Dữ liệu không hợp lệ');
  }

  const existing = await prisma.project.findFirst({
    where: {
      organizationId: orgId,
      programCycleId: parsed.data.programCycleId,
      year: parsed.data.year,
      status: 'DRAFT',
      parentProjectId: null,
      deletedAt: null,
    },
    select: { id: true, code: true },
  });

  return existing;
}
