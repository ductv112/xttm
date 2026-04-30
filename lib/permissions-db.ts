// DB-backed permission check với in-memory cache + static MATRIX fallback.
//
// WHY this exists alongside lib/permissions.ts can():
// - lib/permissions.ts MATRIX là source of truth tại seed time (compile-time).
// - DB Role+Permission+RolePermission là override layer admin chỉnh được qua
//   /vai-tro UI. Khi admin tick/untick checkbox → DB cập nhật → cache invalidate.
// - canFromDB() đọc DB trước, fallback static MATRIX nếu DB chưa seed (dev safety)
//   hoặc connection lỗi (production graceful degradation).
//
// WHY 30s TTL cache:
// - Server actions Phase 3+ có thể call canFromDB nhiều lần per request (vd
//   render menu + check action). 30s TTL tránh DB roundtrip mỗi call.
// - invalidatePermissionsCache() gọi sau mọi grant/revoke trong _actions/grant.ts
//   → admin thay đổi → next request thấy ngay.
// - Production phase 2 sẽ thay bằng Redis pub/sub (multi-instance invalidation).

import { prisma } from './prisma';
import { can as canStatic } from './permissions';
import type { Resource, Action } from './permissions';
import type { Role } from './constants';

type Cache = Map<string, Set<string>>; // role code -> Set of "resource:action"

const cache: Cache = new Map();
const cacheLoadedAt: Map<string, number> = new Map();
const CACHE_TTL_MS = 30_000; // 30s — refresh nhanh khi admin chỉnh permission

/**
 * Load granted permission codes for a role from DB. Returns Set<"resource:action">.
 *
 * Cached per role with 30s TTL. Returns empty Set nếu role không tồn tại.
 *
 * @throws nếu DB connection lỗi — caller (canFromDB) tự fallback.
 */
export async function loadPermissionsForRole(
  roleCode: string,
): Promise<Set<string>> {
  const now = Date.now();
  const loadedAt = cacheLoadedAt.get(roleCode);
  if (loadedAt && now - loadedAt < CACHE_TTL_MS && cache.has(roleCode)) {
    return cache.get(roleCode)!;
  }

  const role = await prisma.role.findUnique({
    where: { code: roleCode },
    include: {
      permissions: {
        where: { granted: true },
        include: { permission: { select: { code: true } } },
      },
    },
  });

  if (!role) {
    cache.set(roleCode, new Set());
    cacheLoadedAt.set(roleCode, now);
    return new Set();
  }

  const set = new Set<string>(
    role.permissions.map((rp) => rp.permission.code),
  );
  cache.set(roleCode, set);
  cacheLoadedAt.set(roleCode, now);
  return set;
}

/**
 * Authoritative permission check — reads from DB Role+RolePermission grants.
 *
 * Falls back to static MATRIX (lib/permissions.ts can()) nếu DB lỗi hoặc
 * role không có grants nào (vd dev environment chưa seed Role table).
 *
 * Use this in Phase 3+ server actions when admin có thể đã chỉnh permission
 * qua /vai-tro UI và cần áp dụng ngay. For 95% server actions where the
 * matrix is unchanged, lib/permissions.ts can() vẫn đủ (faster, no DB call).
 *
 * @param roleCode  Role code (ADMIN | BANQL | ... | custom roles)
 * @param resource  18 resources từ Resource type
 * @param action    8 actions từ Action type
 */
export async function canFromDB(
  roleCode: string,
  resource: Resource,
  action: Action,
): Promise<boolean> {
  try {
    const grants = await loadPermissionsForRole(roleCode);
    if (grants.size > 0) {
      return grants.has(`${resource}:${action}`);
    }
    // Empty set = role chưa được seed grants → fallback static để dev safety
    return canStatic(roleCode as Role, resource, action);
  } catch (err) {
    // DB lỗi → fallback static MATRIX (graceful degradation)
    console.error('[permissions-db] fallback to static MATRIX:', err);
    return canStatic(roleCode as Role, resource, action);
  }
}

/**
 * Clear all cached permission sets. MUST be called after grant/revoke server
 * actions để client thấy permission mới ngay sau khi admin tick checkbox.
 *
 * Single-instance only — production multi-instance phase sẽ thay Redis pub/sub.
 */
export function invalidatePermissionsCache(): void {
  cache.clear();
  cacheLoadedAt.clear();
}
