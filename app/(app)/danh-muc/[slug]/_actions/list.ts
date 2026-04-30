'use server';

// listCatalogItems — config-driven RBAC-checked listing for 8 catalog kinds.
// Strategy: lookup prismaModel via CATALOG_CONFIGS, dynamic dispatch via
// (prisma as any)[config.prismaModel]. Trade-off: lose per-kind type safety
// nhưng DRY 1 server action thay 8.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { removeDiacritics } from '@/lib/vi-search';
import {
  getCatalogConfig,
  type CatalogKind,
  CATALOG_KINDS,
  CATALOG_CONFIGS,
} from '@/lib/catalog-types';
import type { ListCatalogFilter } from './schemas';

const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 50;

export type CatalogListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  searchKey: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Special fields per kind — undefined nếu không applicable
  region?: string;
  nameEn?: string | null;
  hasTradeOffice?: boolean;
  type?: string;
  parentId?: string | null;
  parent?: { id: string; code: string; name: string } | null;
  weight?: number;
  appliesToKinds?: string[];
  category?: string;
  bodyHtml?: string;
  variables?: string[];
};

export type ListCatalogResult = {
  rows: CatalogListRow[];
  total: number;
};

/**
 * List items của 1 catalog kind với filter + pagination.
 *
 * @param kind - CatalogKind (1 trong 8)
 * @param filter - {keyword, isActive}
 * @param pageIndex - 0-based
 * @param pageSize - default 50
 */
export async function listCatalogItems(
  kind: CatalogKind,
  filter: ListCatalogFilter | undefined = undefined,
  pageIndex: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<ListCatalogResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh mục');
  }

  const config = getCatalogConfig(kind);
  const safeFilter = filter ?? {};
  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  const safePageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize)),
  );

  // Build where clause
  const where: Record<string, unknown> = {};
  if (safeFilter.keyword && safeFilter.keyword.trim().length > 0) {
    const kw = removeDiacritics(safeFilter.keyword.trim());
    where.searchKey = { contains: kw };
  }
  if (safeFilter.isActive === 'active') where.isActive = true;
  if (safeFilter.isActive === 'inactive') where.isActive = false;

  // Build include clause for hierarchical kinds
  const include: Record<string, unknown> = {};
  if (config.hasParent) {
    include.parent = { select: { id: true, code: true, name: true } };
  }

  // Dynamic model dispatch — type loss intentional, see Strategy comment above
  const model = (prisma as unknown as Record<string, {
    findMany: (args: unknown) => Promise<unknown[]>;
    count: (args: unknown) => Promise<number>;
  }>)[config.prismaModel];

  if (!model) {
    throw new Error(`Cấu hình catalog không hợp lệ: ${kind}`);
  }

  const queryArgs: Record<string, unknown> = {
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    skip: safePageIndex * safePageSize,
    take: safePageSize,
  };
  if (Object.keys(include).length > 0) {
    queryArgs.include = include;
  }

  const [rows, total] = await Promise.all([
    model.findMany(queryArgs),
    model.count({ where }),
  ]);

  // T-02-06-06 mitigation: try/catch JSON.parse với fallback empty array
  const parsed: CatalogListRow[] = (rows as Record<string, unknown>[]).map(
    (r) => {
      const result: CatalogListRow = {
        id: r.id as string,
        code: r.code as string,
        name: r.name as string,
        description: (r.description as string | null) ?? null,
        searchKey: (r.searchKey as string) ?? '',
        displayOrder: (r.displayOrder as number) ?? 0,
        isActive: (r.isActive as boolean) ?? true,
        createdAt: r.createdAt as Date,
        updatedAt: r.updatedAt as Date,
      };

      // Per-kind special fields
      if (kind === 'market') {
        result.region = r.region as string;
        result.nameEn = (r.nameEn as string | null) ?? null;
      }
      if (kind === 'country') {
        result.region = r.region as string;
        result.nameEn = (r.nameEn as string | null) ?? null;
        result.hasTradeOffice = (r.hasTradeOffice as boolean) ?? false;
      }
      if (kind === 'org-unit') {
        result.type = r.type as string;
        result.parentId = (r.parentId as string | null) ?? null;
        result.parent =
          (r.parent as { id: string; code: string; name: string } | null) ??
          null;
      }
      if (kind === 'scoring-criterion') {
        result.weight = (r.weight as number) ?? 0;
        result.parentId = (r.parentId as string | null) ?? null;
        result.parent =
          (r.parent as { id: string; code: string; name: string } | null) ??
          null;
        result.appliesToKinds = parseJsonArray(r.appliesToKinds);
      }
      if (kind === 'document-template') {
        result.category = r.category as string;
        result.bodyHtml = (r.bodyHtml as string) ?? '';
        result.variables = parseJsonArray(r.variables);
      }

      return result;
    },
  );

  return { rows: parsed, total };
}

/**
 * Get single catalog item by id — used by edit form to preload values.
 */
export async function getCatalogItem(
  kind: CatalogKind,
  id: string,
): Promise<CatalogListRow | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh mục');
  }

  const config = getCatalogConfig(kind);
  const include: Record<string, unknown> = {};
  if (config.hasParent) {
    include.parent = { select: { id: true, code: true, name: true } };
  }

  const model = (prisma as unknown as Record<string, {
    findUnique: (args: unknown) => Promise<unknown | null>;
  }>)[config.prismaModel];

  if (!model) return null;

  const queryArgs: Record<string, unknown> = { where: { id } };
  if (Object.keys(include).length > 0) {
    queryArgs.include = include;
  }
  const r = (await model.findUnique(queryArgs)) as
    | Record<string, unknown>
    | null;
  if (!r) return null;

  const result: CatalogListRow = {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    searchKey: (r.searchKey as string) ?? '',
    displayOrder: (r.displayOrder as number) ?? 0,
    isActive: (r.isActive as boolean) ?? true,
    createdAt: r.createdAt as Date,
    updatedAt: r.updatedAt as Date,
  };

  if (kind === 'market') {
    result.region = r.region as string;
    result.nameEn = (r.nameEn as string | null) ?? null;
  }
  if (kind === 'country') {
    result.region = r.region as string;
    result.nameEn = (r.nameEn as string | null) ?? null;
    result.hasTradeOffice = (r.hasTradeOffice as boolean) ?? false;
  }
  if (kind === 'org-unit') {
    result.type = r.type as string;
    result.parentId = (r.parentId as string | null) ?? null;
    result.parent =
      (r.parent as { id: string; code: string; name: string } | null) ?? null;
  }
  if (kind === 'scoring-criterion') {
    result.weight = (r.weight as number) ?? 0;
    result.parentId = (r.parentId as string | null) ?? null;
    result.parent =
      (r.parent as { id: string; code: string; name: string } | null) ?? null;
    result.appliesToKinds = parseJsonArray(r.appliesToKinds);
  }
  if (kind === 'document-template') {
    result.category = r.category as string;
    result.bodyHtml = (r.bodyHtml as string) ?? '';
    result.variables = parseJsonArray(r.variables);
  }

  return result;
}

export type CatalogCount = {
  kind: CatalogKind;
  count: number;
  activeCount: number;
};

/**
 * Get item counts cho 8 catalogs — driven cards trên /danh-muc index page.
 * Single Promise.all batch để minimize DB round-trips.
 */
export async function getCatalogCounts(): Promise<CatalogCount[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh mục');
  }

  const results = await Promise.all(
    CATALOG_KINDS.map(async (kind) => {
      const config = CATALOG_CONFIGS[kind];
      const model = (prisma as unknown as Record<string, {
        count: (args?: unknown) => Promise<number>;
      }>)[config.prismaModel];
      if (!model) {
        return { kind, count: 0, activeCount: 0 };
      }
      const [count, activeCount] = await Promise.all([
        model.count(),
        model.count({ where: { isActive: true } }),
      ]);
      return { kind, count, activeCount };
    }),
  );

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonArray(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
    return [];
  } catch (err) {
    console.error('[catalog.list] JSON.parse failed:', err);
    return [];
  }
}
