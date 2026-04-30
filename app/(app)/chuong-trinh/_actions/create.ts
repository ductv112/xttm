'use server';

// createCycle — BQL only, Zod validation, year-uniqueness pre-check + DB unique catch.
// CYCLE-02 mitigation: VN error 'Chu kỳ năm X đã tồn tại'.
// T-03-03-07 mitigation: Prisma @unique on year column catches race; pre-check is UX nicety.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';
import type { CreateCycleInput } from './types';

const cuid = z.string().min(1, 'ID không hợp lệ').max(64);

export const createCycleSchema = z
  .object({
    year: z
      .number({ message: 'Vui lòng nhập năm chu kỳ' })
      .int('Năm phải là số nguyên')
      .min(2020, 'Năm phải từ 2020 trở lên')
      .max(2050, 'Năm tối đa 2050'),
    name: z
      .string({ message: 'Vui lòng nhập tên chu kỳ' })
      .trim()
      .min(5, 'Tên chu kỳ tối thiểu 5 ký tự')
      .max(200, 'Tên chu kỳ tối đa 200 ký tự'),
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
    scoringCriteriaIds: z.array(cuid).default([]),
    evaluationCriteriaIds: z.array(cuid).default([]),
    emailTemplateIds: z.array(cuid).default([]),
    invitedOrganizationIds: z.array(cuid).default([]),
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

export type CreateCycleResult = {
  id: string;
  year: number;
  status: ProgramCycleStatus;
};

async function createCycleImpl(input: CreateCycleInput): Promise<CreateCycleResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'create'))) {
    throw new Error('Bạn không có quyền tạo chu kỳ chương trình');
  }

  const result = createCycleSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const parsed = result.data;

  // Year uniqueness pre-check (UX nicety; DB @unique is the authoritative guard)
  const existing = await prisma.programCycle.findUnique({
    where: { year: parsed.year },
  });
  if (existing) {
    throw new Error(
      `Chu kỳ năm ${parsed.year} đã tồn tại. Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất`,
    );
  }

  // Stash description + criteria ids inside configJson (ProgramCycle has no description column)
  const configJson = JSON.stringify({
    description: parsed.description ?? null,
    scoringCriteriaIds: parsed.scoringCriteriaIds,
    evaluationCriteriaIds: parsed.evaluationCriteriaIds,
    emailTemplateIds: parsed.emailTemplateIds,
  });
  const invitedOrganizations = JSON.stringify(parsed.invitedOrganizationIds);

  try {
    const created = await prisma.programCycle.create({
      data: {
        year: parsed.year,
        name: parsed.name,
        status: 'DRAFT',
        totalBudget: parsed.totalBudget ?? null,
        registrationOpenAt: parsed.registrationOpenAt ?? null,
        registrationCloseAt: parsed.registrationCloseAt ?? null,
        supplementDeadline: parsed.supplementDeadline ?? null,
        evaluationStartAt: parsed.evaluationStartAt ?? null,
        evaluationEndAt: parsed.evaluationEndAt ?? null,
        approvalDeadline: parsed.approvalDeadline ?? null,
        configJson,
        invitedOrganizations,
        createdById: session.user.id,
      },
    });

    revalidatePath('/chuong-trinh');

    return {
      id: created.id,
      year: created.year,
      status: created.status as ProgramCycleStatus,
    };
  } catch (err) {
    // Catch DB-level unique constraint race (T-03-03-07)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error(
        `Chu kỳ năm ${parsed.year} đã tồn tại. Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất`,
      );
    }
    throw err;
  }
}

export const createCycle = withAuditLog<[CreateCycleInput], CreateCycleResult>(
  {
    action: 'CREATE',
    resource: 'chuong-trinh',
    resourceIdFromResult: (r) => r?.id ?? null,
    captureAfter: (r) => ({ year: r.year, status: r.status }),
  },
  createCycleImpl,
);
