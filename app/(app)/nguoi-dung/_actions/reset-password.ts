'use server';

// resetPassword — sinh tạm 12 chars random + bcrypt hash. Trả tempPassword 1 lần.
// WHY tempPassword không persist hoặc audit log raw value (T-02-04-04 mitigation):
// captureAfter chỉ ghi {passwordReset: true}; tempPassword chỉ trả về client 1 lần
// để hiển thị trong dialog rồi mất. User phải copy ngay.

import bcrypt from 'bcryptjs';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import type { Role } from '@/lib/constants';
import { generateTempPassword } from './password-utils';

const BCRYPT_COST = 10;

export type ResetPasswordResult = {
  tempPassword: string;
};

async function resetPasswordImpl(userId: string): Promise<ResetPasswordResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền reset mật khẩu');
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });
  if (!target) {
    throw new Error('Không tìm thấy người dùng');
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, BCRYPT_COST);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  return { tempPassword };
}

// T-02-04-04: tempPassword KHÔNG ghi vào audit log — chỉ flag `passwordReset: true`
export const resetPassword = withAuditLog<[string], ResetPasswordResult>(
  {
    action: 'UPDATE',
    resource: 'nguoi-dung',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: () => ({ passwordReset: true }),
  },
  resetPasswordImpl,
);
