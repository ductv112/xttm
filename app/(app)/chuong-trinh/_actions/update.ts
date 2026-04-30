'use server';

// updateCycle — partial update of cycle fields. Status changes go through transitionCycle/extendCycle (PITFALLS R3).
// Detects significantChange when an OPEN_REGISTRATION cycle has registrationCloseAt/criteria changed —
// flag returned to UI so Plan 03-06 can prompt confirm "Gửi thông báo cho danh sách đơn vị?".

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';
import type { UpdateCycleInput } from './types';

// Internal Zod schema — NOT exported because 'use server' modules require all
// exports to be async functions (Plan 03-04 client consumer fix).
// Reuse base shape but everything optional + add id; superRefine carries date ordering.
const updateCycleSchemaInternal = z
  .object({
    id: z.string().min(1, 'Mã chu kỳ không hợp lệ'),
    year: z
      .number()
      .int('Năm phải là số nguyên')
      .min(2020, 'Năm phải từ 2020 trở lên')
      .max(2050, 'Năm tối đa 2050')
      .optional(),
    name: z
      .string()
      .trim()
      .min(5, 'Tên chu kỳ tối thiểu 5 ký tự')
      .max(200, 'Tên chu kỳ tối đa 200 ký tự')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Mô tả tối đa 2000 ký tự')
      .optional()
      .nullable(),
    totalBudget: z
      .number()
      .nonnegative('Tổng kinh phí không được âm')
      .optional()
      .nullable(),
    registrationOpenAt: z.date().optional().nullable(),
    registrationCloseAt: z.date().optional().nullable(),
    supplementDeadline: z.date().optional().nullable(),
    evaluationStartAt: z.date().optional().nullable(),
    evaluationEndAt: z.date().optional().nullable(),
    approvalDeadline: z.date().optional().nullable(),
    scoringCriteriaIds: z.array(z.string().min(1)).optional(),
    evaluationCriteriaIds: z.array(z.string().min(1)).optional(),
    emailTemplateIds: z.array(z.string().min(1)).optional(),
    invitedOrganizationIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.registrationOpenAt &&
      val.registrationCloseAt &&
      val.registrationCloseAt <= val.registrationOpenAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationCloseAt'],
        message: 'Ngày đóng đăng ký phải sau ngày mở đăng ký',
      });
    }
    if (
      val.registrationCloseAt &&
      val.supplementDeadline &&
      val.supplementDeadline <= val.registrationCloseAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplementDeadline'],
        message: 'Hạn nộp bổ sung phải sau ngày đóng đăng ký',
      });
    }
  });

function safeParseConfig(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function pickStringArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export type UpdateCycleResult = {
  id: string;
  year: number;
  status: ProgramCycleStatus;
  significantChange: boolean;
};

async function updateCycleImpl(input: UpdateCycleInput): Promise<UpdateCycleResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'update'))) {
    throw new Error('Bạn không có quyền cập nhật chu kỳ chương trình');
  }

  const result = updateCycleSchemaInternal.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const parsed = result.data;

  const existing = await prisma.programCycle.findUnique({ where: { id: parsed.id } });
  if (!existing) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }

  // Year uniqueness check if changed
  if (parsed.year !== undefined && parsed.year !== existing.year) {
    const conflict = await prisma.programCycle.findUnique({ where: { year: parsed.year } });
    if (conflict && conflict.id !== existing.id) {
      throw new Error(
        `Chu kỳ năm ${parsed.year} đã tồn tại. Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất`,
      );
    }
  }

  const existingConfig = safeParseConfig(existing.configJson);
  const existingScoring = pickStringArr(existingConfig.scoringCriteriaIds);
  const existingEvaluation = pickStringArr(existingConfig.evaluationCriteriaIds);
  const existingTemplates = pickStringArr(existingConfig.emailTemplateIds);

  // Compose new config — keep existing values when not provided
  const newScoring = parsed.scoringCriteriaIds ?? existingScoring;
  const newEvaluation = parsed.evaluationCriteriaIds ?? existingEvaluation;
  const newTemplates = parsed.emailTemplateIds ?? existingTemplates;
  const newDescription =
    parsed.description !== undefined ? parsed.description : (existingConfig.description ?? null);

  const newConfigJson = JSON.stringify({
    ...existingConfig,
    description: newDescription,
    scoringCriteriaIds: newScoring,
    evaluationCriteriaIds: newEvaluation,
    emailTemplateIds: newTemplates,
  });

  // Detect significantChange — only meaningful while OPEN_REGISTRATION
  let significantChange = false;
  if (existing.status === 'OPEN_REGISTRATION') {
    const closeChanged =
      parsed.registrationCloseAt !== undefined &&
      (parsed.registrationCloseAt?.getTime() ?? null) !==
        (existing.registrationCloseAt?.getTime() ?? null);
    const scoringChanged =
      parsed.scoringCriteriaIds !== undefined &&
      JSON.stringify(parsed.scoringCriteriaIds) !== JSON.stringify(existingScoring);
    const evalChanged =
      parsed.evaluationCriteriaIds !== undefined &&
      JSON.stringify(parsed.evaluationCriteriaIds) !== JSON.stringify(existingEvaluation);
    significantChange = closeChanged || scoringChanged || evalChanged;
  }

  // Build prisma update payload — only include fields that were sent
  const data: Prisma.ProgramCycleUpdateInput = {
    configJson: newConfigJson,
  };
  if (parsed.year !== undefined) data.year = parsed.year;
  if (parsed.name !== undefined) data.name = parsed.name;
  if (parsed.totalBudget !== undefined) data.totalBudget = parsed.totalBudget;
  if (parsed.registrationOpenAt !== undefined)
    data.registrationOpenAt = parsed.registrationOpenAt;
  if (parsed.registrationCloseAt !== undefined)
    data.registrationCloseAt = parsed.registrationCloseAt;
  if (parsed.supplementDeadline !== undefined)
    data.supplementDeadline = parsed.supplementDeadline;
  if (parsed.evaluationStartAt !== undefined)
    data.evaluationStartAt = parsed.evaluationStartAt;
  if (parsed.evaluationEndAt !== undefined) data.evaluationEndAt = parsed.evaluationEndAt;
  if (parsed.approvalDeadline !== undefined) data.approvalDeadline = parsed.approvalDeadline;
  if (parsed.invitedOrganizationIds !== undefined)
    data.invitedOrganizations = JSON.stringify(parsed.invitedOrganizationIds);

  try {
    const updated = await prisma.programCycle.update({
      where: { id: parsed.id },
      data,
    });

    revalidatePath('/chuong-trinh');
    revalidatePath('/chuong-trinh/' + parsed.id);

    return {
      id: updated.id,
      year: updated.year,
      status: updated.status as ProgramCycleStatus,
      significantChange,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error(
        `Chu kỳ năm ${parsed.year ?? existing.year} đã tồn tại. Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất`,
      );
    }
    throw err;
  }
}

export const updateCycle = withAuditLog<[UpdateCycleInput], UpdateCycleResult>(
  {
    action: 'UPDATE',
    resource: 'chuong-trinh',
    resourceIdFromArgs: ([input]) => input?.id ?? null,
    captureBefore: async ([input]) => {
      if (!input?.id) return null;
      return prisma.programCycle.findUnique({ where: { id: input.id } });
    },
    captureAfter: async (result) => {
      return prisma.programCycle.findUnique({ where: { id: result.id } });
    },
  },
  updateCycleImpl,
);
