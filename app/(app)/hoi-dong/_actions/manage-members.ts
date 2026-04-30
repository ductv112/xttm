'use server';

// addMember / removeMember — BQL quản lý thành viên hội đồng.
// Audit: COUNCIL_ADD_MEMBER / COUNCIL_REMOVE_MEMBER (action UPDATE × tham-dinh).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { ROLES, type Role } from '@/lib/constants';

export const COUNCIL_MEMBER_ROLES = [
  'CHU_TICH',
  'PHO',
  'UY_VIEN',
  'THU_KY',
] as const;
export type CouncilMemberRole = (typeof COUNCIL_MEMBER_ROLES)[number];

export const COUNCIL_MEMBER_ROLE_LABELS: Record<CouncilMemberRole, string> = {
  CHU_TICH: 'Chủ tịch',
  PHO: 'Phó Chủ tịch',
  UY_VIEN: 'Ủy viên',
  THU_KY: 'Thư ký',
};

export type AddMemberInput = {
  councilId: string;
  userId: string;
  role: CouncilMemberRole;
};

export type AddMemberResult = {
  id: string;
  councilId: string;
  userId: string;
  role: CouncilMemberRole;
  userFullName: string;
};

async function addMemberImpl(input: AddMemberInput): Promise<AddMemberResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền thêm thành viên hội đồng');
  }

  if (!COUNCIL_MEMBER_ROLES.includes(input.role)) {
    throw new Error('Vai trò thành viên không hợp lệ');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: input.councilId },
    select: { id: true, lockStatus: true },
  });
  if (!council) {
    throw new Error('Không tìm thấy hội đồng');
  }
  if (council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa, không thể thêm thành viên');
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, fullName: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw new Error('Người dùng không tồn tại hoặc đã ngưng hoạt động');
  }
  if (user.role !== ROLES.HOIDONG && user.role !== ROLES.ADMIN) {
    throw new Error(
      `Chỉ có thể thêm người dùng có vai trò "${ROLES.HOIDONG}" vào hội đồng`,
    );
  }

  if (input.role === 'CHU_TICH') {
    const existingChair = await prisma.councilMember.findFirst({
      where: { councilId: input.councilId, role: 'CHU_TICH' },
    });
    if (existingChair) {
      throw new Error(
        'Hội đồng đã có Chủ tịch — vui lòng xóa Chủ tịch hiện tại trước',
      );
    }
  }

  // Idempotent: composite unique (councilId, userId)
  const existing = await prisma.councilMember.findUnique({
    where: { councilId_userId: { councilId: input.councilId, userId: input.userId } },
  });
  if (existing) {
    if (existing.role === input.role) {
      return {
        id: existing.id,
        councilId: existing.councilId,
        userId: existing.userId,
        role: existing.role as CouncilMemberRole,
        userFullName: user.fullName,
      };
    }
    const updated = await prisma.councilMember.update({
      where: { id: existing.id },
      data: { role: input.role },
    });
    revalidatePath(`/hoi-dong/${input.councilId}`);
    return {
      id: updated.id,
      councilId: updated.councilId,
      userId: updated.userId,
      role: updated.role as CouncilMemberRole,
      userFullName: user.fullName,
    };
  }

  const created = await prisma.councilMember.create({
    data: {
      councilId: input.councilId,
      userId: input.userId,
      role: input.role,
    },
  });

  revalidatePath(`/hoi-dong/${input.councilId}`);
  return {
    id: created.id,
    councilId: created.councilId,
    userId: created.userId,
    role: created.role as CouncilMemberRole,
    userFullName: user.fullName,
  };
}

export const addMember = withAuditLog<[AddMemberInput], AddMemberResult>(
  {
    action: 'UPDATE',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.councilId,
    captureAfter: (r) => ({
      memberId: r.id,
      userId: r.userId,
      role: r.role,
      userFullName: r.userFullName,
      kind: 'ADD_MEMBER',
    }),
    metadata: { reason: 'BQL thêm thành viên hội đồng' },
  },
  addMemberImpl,
);

// ---------------------------------------------------------------------------

export type RemoveMemberInput = {
  councilId: string;
  memberId: string;
};

async function removeMemberImpl(
  input: RemoveMemberInput,
): Promise<{ removedId: string; userFullName: string }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền xóa thành viên hội đồng');
  }

  const member = await prisma.councilMember.findUnique({
    where: { id: input.memberId },
    include: {
      council: { select: { lockStatus: true, id: true } },
      // include user for fullName via join — not directly mapped; do a separate user fetch
    },
  });
  if (!member || member.councilId !== input.councilId) {
    throw new Error('Không tìm thấy thành viên');
  }
  if (member.council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa, không thể xóa thành viên');
  }

  const user = await prisma.user.findUnique({
    where: { id: member.userId },
    select: { fullName: true },
  });

  // Block remove if member has SUBMITTED scoresheets — preserves audit trail
  const submittedSheets = await prisma.scoreSheet.count({
    where: {
      councilId: input.councilId,
      reviewerId: member.userId,
      kind: 'EVALUATION',
      status: 'SUBMITTED',
    },
  });
  if (submittedSheets > 0) {
    throw new Error(
      `Thành viên đã nộp ${submittedSheets} phiếu chấm — không thể xóa khỏi hội đồng`,
    );
  }

  await prisma.councilMember.delete({ where: { id: member.id } });
  revalidatePath(`/hoi-dong/${input.councilId}`);

  return {
    removedId: member.id,
    userFullName: user?.fullName ?? '(không rõ)',
  };
}

export const removeMember = withAuditLog<
  [RemoveMemberInput],
  { removedId: string; userFullName: string }
>(
  {
    action: 'UPDATE',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.councilId,
    captureAfter: (r) => ({
      removedMemberId: r.removedId,
      userFullName: r.userFullName,
      kind: 'REMOVE_MEMBER',
    }),
    metadata: { reason: 'BQL xóa thành viên hội đồng' },
  },
  removeMemberImpl,
);

// ---------------------------------------------------------------------------
// listEligibleUsers — BQL chọn user role=HOIDONG để add vào council.
// Server-only helper (read).
// ---------------------------------------------------------------------------

export async function listEligibleUsers(councilId: string): Promise<
  Array<{
    id: string;
    fullName: string;
    email: string | null;
    alreadyMember: boolean;
    role: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const r = session.user.role as Role;
  if (!(await canFromDB(r, 'tham-dinh', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách');
  }

  const users = await prisma.user.findMany({
    where: {
      role: ROLES.HOIDONG,
      isActive: true,
    },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, email: true, role: true },
  });

  const existing = await prisma.councilMember.findMany({
    where: { councilId },
    select: { userId: true },
  });
  const memberIds = new Set(existing.map((m) => m.userId));

  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    alreadyMember: memberIds.has(u.id),
    role: u.role,
  }));
}
