'use server';

// deleteCatalogItem — hard delete with FK protection.
// T-02-06-03: per-kind FK count check trước hard delete; throw VN message yêu cầu deactivate
// nếu có references. Phase 2 chỉ Project model có FK refs (kind/industrySectorId/promotionTypeId
// + marketIds/countryIds JSON arrays). ScoringCriterion + DocumentTemplate chưa có refs.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { withAuditLog } from '@/lib/audit';
import { getCatalogConfig, type CatalogKind } from '@/lib/catalog-types';

export type DeleteCatalogResult = {
  id: string;
  kind: CatalogKind;
};

/**
 * Count Project references that prevent hard delete.
 * Returns 0 nếu safe to delete.
 *
 * Mapping:
 * - project-kind → Project.kind (string code, không phải FK id)
 * - industry-sector → Project.industrySectorId
 * - promotion-type → Project.promotionTypeId
 * - market → Project.marketIds (JSON array contains id)
 * - country → Project.countryIds (JSON array contains id)
 * - org-unit → no FK Phase 2 (Organization model dùng OrganizationProfile, độc lập với OrgUnit master data)
 * - scoring-criterion → no FK Phase 2 (defer Phase 7 thẩm định)
 * - document-template → no FK Phase 2 (defer Phase 6 phê duyệt)
 *
 * Soft-deleted Projects (deletedAt != null) không tính.
 */
async function countReferences(
  kind: CatalogKind,
  itemId: string,
  itemCode: string,
): Promise<number> {
  if (kind === 'project-kind') {
    return prisma.project.count({
      where: { kind: itemCode, deletedAt: null },
    });
  }
  if (kind === 'industry-sector') {
    return prisma.project.count({
      where: { industrySectorId: itemId, deletedAt: null },
    });
  }
  if (kind === 'promotion-type') {
    return prisma.project.count({
      where: { promotionTypeId: itemId, deletedAt: null },
    });
  }
  if (kind === 'market') {
    // marketIds is a JSON string — fall back to substring search (id contains)
    return prisma.project.count({
      where: { marketIds: { contains: itemId }, deletedAt: null },
    });
  }
  if (kind === 'country') {
    return prisma.project.count({
      where: { countryIds: { contains: itemId }, deletedAt: null },
    });
  }
  // org-unit, scoring-criterion, document-template → no FK Phase 2
  return 0;
}

async function deleteCatalogItemImpl(
  kind: CatalogKind,
  id: string,
): Promise<DeleteCatalogResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'delete')) {
    throw new Error('Bạn không có quyền xóa danh mục');
  }

  const config = getCatalogConfig(kind);
  const model = (prisma as unknown as Record<string, {
    findUnique: (args: unknown) => Promise<unknown | null>;
    delete: (args: unknown) => Promise<unknown>;
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

  // T-02-06-03 — FK protection check
  const refCount = await countReferences(
    kind,
    id,
    existing.code as string,
  );
  if (refCount > 0) {
    throw new Error(
      `Mục này đang được sử dụng bởi ${refCount} đề án — vui lòng ngừng hoạt động (deactivate) thay vì xóa`,
    );
  }

  // Check children for hierarchical kinds (OrgUnit, ScoringCriterion)
  if (config.hasParent) {
    const parentModel = (prisma as unknown as Record<string, {
      count: (args: unknown) => Promise<number>;
    }>)[config.prismaModel];
    const childrenCount = parentModel
      ? await parentModel.count({ where: { parentId: id } })
      : 0;
    if (childrenCount > 0) {
      throw new Error(
        `Mục này có ${childrenCount} mục con — vui lòng xóa các mục con trước hoặc ngừng hoạt động thay vì xóa`,
      );
    }
  }

  await model.delete({ where: { id } });

  revalidatePath(`/danh-muc/${config.slug}`);
  revalidatePath('/danh-muc');

  return { id, kind };
}

export const deleteCatalogItem = withAuditLog<
  [CatalogKind, string],
  DeleteCatalogResult
>(
  {
    action: 'DELETE',
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
    captureAfter: (result) => ({
      id: result.id,
      _kind: result.kind,
      _action: 'hard-delete',
    }),
  },
  deleteCatalogItemImpl,
);
