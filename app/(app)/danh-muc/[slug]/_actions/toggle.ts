'use server';

// toggleCatalogItem — flip isActive flag (soft delete pattern per Plan 02-02 DECISION).
// Audit-wrapped UPDATE with before/after diff.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { withAuditLog } from '@/lib/audit';
import { getCatalogConfig, type CatalogKind } from '@/lib/catalog-types';

export type ToggleCatalogResult = {
  id: string;
  isActive: boolean;
  kind: CatalogKind;
};

async function toggleCatalogItemImpl(
  kind: CatalogKind,
  id: string,
  isActive: boolean,
): Promise<ToggleCatalogResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'update')) {
    throw new Error('Bạn không có quyền cập nhật danh mục');
  }

  const config = getCatalogConfig(kind);
  const model = (prisma as unknown as Record<string, {
    update: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown | null>;
  }>)[config.prismaModel];

  if (!model) {
    throw new Error(`Cấu hình catalog không hợp lệ: ${kind}`);
  }

  const existing = (await model.findUnique({
    where: { id },
  })) as Record<string, unknown> | null;
  if (!existing) {
    throw new Error('Không tìm thấy mục danh mục');
  }

  const updated = (await model.update({
    where: { id },
    data: { isActive },
  })) as Record<string, unknown>;

  revalidatePath(`/danh-muc/${config.slug}`);
  revalidatePath('/danh-muc');

  return {
    id: updated.id as string,
    isActive: updated.isActive as boolean,
    kind,
  };
}

export const toggleCatalogItem = withAuditLog<
  [CatalogKind, string, boolean],
  ToggleCatalogResult
>(
  {
    action: 'UPDATE',
    resource: 'danh-muc',
    resourceIdFromArgs: ([, id]) => id,
    captureBefore: async ([kind, id]) => {
      const config = getCatalogConfig(kind);
      const model = (prisma as unknown as Record<string, {
        findUnique: (args: unknown) => Promise<unknown | null>;
      }>)[config.prismaModel];
      if (!model) return null;
      const r = (await model.findUnique({ where: { id } })) as
        | Record<string, unknown>
        | null;
      if (!r) return null;
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        isActive: r.isActive,
        _kind: kind,
      };
    },
    captureAfter: (result, args) => ({
      id: result.id,
      isActive: result.isActive,
      _kind: args[0],
      _action: result.isActive ? 'activate' : 'deactivate',
    }),
  },
  toggleCatalogItemImpl,
);
