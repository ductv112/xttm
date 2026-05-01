'use server';

// upsertCatalogItem — config-driven create/update for 8 catalog kinds.
// T-02-06-01: auth + RBAC danh-muc/create|update
// T-02-06-02: Zod parse via SCHEMA_BY_KIND[kind] — explicit data construction
// T-02-06-09: parent self-reference cycle guard (direct only, deep cycle defer Phase 11)

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can, type Action } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { withAuditLog } from '@/lib/audit';
import { removeDiacritics } from '@/lib/vi-search';
import { getCatalogConfig, type CatalogKind } from '@/lib/catalog-types';
import { SCHEMA_BY_KIND } from './schemas';

export type UpsertCatalogResult = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  kind: CatalogKind;
};

async function upsertCatalogItemImpl(
  kind: CatalogKind,
  id: string | null,
  input: unknown,
): Promise<UpsertCatalogResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const action: Action = id ? 'update' : 'create';
  if (!can(session.user.role as Role, 'danh-muc', action)) {
    throw new Error(
      id
        ? 'Bạn không có quyền cập nhật danh mục'
        : 'Bạn không có quyền tạo danh mục',
    );
  }

  const config = getCatalogConfig(kind);
  const schema = SCHEMA_BY_KIND[kind];
  const result = schema.safeParse(input);
  if (!result.success) {
    // Return user-friendly error rather than throw raw ZodError to runtime
    const firstIssue = result.error.issues[0];
    const fieldName = firstIssue?.path?.join('.') ?? 'dữ liệu';
    const message = firstIssue?.message ?? 'Dữ liệu không hợp lệ';
    throw new Error(`${message} (trường: ${fieldName})`);
  }
  const parsed = result.data as Record<string, unknown>;

  // T-02-06-09 — parent cycle guard (direct only)
  if (config.hasParent && id && parsed.parentId === id) {
    throw new Error('Không thể tự đặt làm cha của chính mình');
  }

  // Compute searchKey from name + code + description
  const searchKey = removeDiacritics(
    [parsed.name, parsed.code, parsed.description]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' '),
  );

  // Build data object explicitly per kind — KHÔNG spread input raw để tránh mass-assignment.
  const data: Record<string, unknown> = {
    code: parsed.code,
    name: parsed.name,
    description:
      typeof parsed.description === 'string' && parsed.description.length > 0
        ? parsed.description
        : null,
    displayOrder: parsed.displayOrder ?? 0,
    isActive: parsed.isActive ?? true,
    searchKey,
  };

  // Per-kind extra fields
  if (kind === 'market') {
    data.region = parsed.region;
    data.nameEn =
      typeof parsed.nameEn === 'string' && parsed.nameEn.length > 0
        ? parsed.nameEn
        : null;
  }
  if (kind === 'country') {
    data.region = parsed.region;
    data.hasTradeOffice = parsed.hasTradeOffice ?? false;
    data.nameEn =
      typeof parsed.nameEn === 'string' && parsed.nameEn.length > 0
        ? parsed.nameEn
        : null;
  }
  if (kind === 'org-unit') {
    data.type = parsed.type;
    data.parentId =
      typeof parsed.parentId === 'string' && parsed.parentId.length > 0
        ? parsed.parentId
        : null;
  }
  if (kind === 'scoring-criterion') {
    data.weight = parsed.weight ?? 0;
    data.parentId =
      typeof parsed.parentId === 'string' && parsed.parentId.length > 0
        ? parsed.parentId
        : null;
    // T-02-06-02 — JSON serialize whitelist array
    data.appliesToKinds = JSON.stringify(
      Array.isArray(parsed.appliesToKinds) ? parsed.appliesToKinds : [],
    );
  }
  if (kind === 'document-template') {
    data.category = parsed.category;
    data.bodyHtml = parsed.bodyHtml ?? '';
    data.variables = JSON.stringify(
      Array.isArray(parsed.variables) ? parsed.variables : [],
    );
  }

  const model = (prisma as unknown as Record<string, {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  }>)[config.prismaModel];

  if (!model) {
    throw new Error(`Cấu hình catalog không hợp lệ: ${kind}`);
  }

  let result: Record<string, unknown>;
  try {
    if (id) {
      result = (await model.update({
        where: { id },
        data,
      })) as Record<string, unknown>;
    } else {
      result = (await model.create({ data })) as Record<string, unknown>;
    }
  } catch (err: unknown) {
    // Prisma unique constraint violation → P2002
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      throw new Error('Mã đã tồn tại — vui lòng nhập mã khác');
    }
    throw err;
  }

  revalidatePath(`/danh-muc/${config.slug}`);
  revalidatePath('/danh-muc');

  return {
    id: result.id as string,
    code: result.code as string,
    name: result.name as string,
    isActive: result.isActive as boolean,
    kind,
  };
}

export const upsertCatalogItem = withAuditLog<
  [CatalogKind, string | null, unknown],
  UpsertCatalogResult
>(
  {
    action: 'UPDATE',
    resource: 'danh-muc',
    resourceIdFromResult: (r) => r.id,
    captureAfter: (result, args) => ({
      id: result.id,
      code: result.code,
      name: result.name,
      isActive: result.isActive,
      _kind: args[0],
      _isCreate: args[1] === null,
    }),
    captureBefore: async ([kind, id]) => {
      if (!id) return null;
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
        description: r.description,
        isActive: r.isActive,
        displayOrder: r.displayOrder,
        _kind: kind,
      };
    },
  },
  upsertCatalogItemImpl,
);
