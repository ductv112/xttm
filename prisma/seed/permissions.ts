import type { PrismaClient } from '@prisma/client';
import { ROLES, ROLE_LABELS } from '../../lib/constants';
import { logSeedStep } from './helpers';
import {
  AUDIT_RESOURCE_LABELS,
  type AuditResource,
} from '../../lib/audit-types';

// Locally re-derive MATRIX from lib/permissions module (matches static file).
// Reading at seed-time keeps a single source of truth at lib/permissions.ts.
import {
  MATRIX_FOR_SEED,
  ALL_ACTIONS,
  type Resource,
  type Action,
} from '../../lib/permissions';

const ACTION_LABELS: Record<Action, string> = {
  read: 'Xem',
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xóa',
  submit: 'Nộp',
  approve: 'Phê duyệt',
  assign: 'Phân công',
  score: 'Chấm điểm',
};

// Resource VN labels — reuse from audit-types since 18 resources khớp 1-1
function resourceLabel(resource: Resource): string {
  // 'audit-log' label trong audit-types là 'Nhật ký' nhưng Resource type ở permissions
  // chứa cùng key 'audit-log' → safe cast.
  return AUDIT_RESOURCE_LABELS[resource as AuditResource] ?? resource;
}

/**
 * Seed Role + Permission + RolePermission từ static MATRIX (lib/permissions.ts).
 *
 * Idempotent qua upsert {where:{code}}. Chạy lần 2 không nhân bản.
 *
 * Output (after run):
 * - Role: 7 system roles (ADMIN, BANQL, CHUYENVIEN, HOIDONG, DONVI, TAICHINH, LANHDAO)
 * - Permission: 18 resources × 8 actions = 144 rows
 * - RolePermission: ~80-100 grants (sum của MATRIX entries)
 */
export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  // 1. Seed 7 system roles
  for (const code of Object.values(ROLES)) {
    await prisma.role.upsert({
      where: { code },
      update: {
        name: ROLE_LABELS[code],
        isSystem: true,
        description: `Vai trò hệ thống: ${ROLE_LABELS[code]}`,
      },
      create: {
        code,
        name: ROLE_LABELS[code],
        isSystem: true,
        description: `Vai trò hệ thống: ${ROLE_LABELS[code]}`,
      },
    });
  }

  // 2. Seed 144 permissions (18 resources × 8 actions)
  const allResources = Object.keys(MATRIX_FOR_SEED) as Resource[];
  for (const resource of allResources) {
    for (const action of ALL_ACTIONS) {
      const code = `${resource}:${action}`;
      const name = `${resourceLabel(resource)} — ${ACTION_LABELS[action]}`;
      await prisma.permission.upsert({
        where: { code },
        update: { resource, action, name },
        create: { code, resource, action, name },
      });
    }
  }

  // 3. Seed RolePermission grants from MATRIX (other roles) + ADMIN gets ALL.
  // Strategy: for each (resource, action) cell, set granted=true cho roles có
  // trong MATRIX. KHÔNG xóa rows không match — admin có thể đã chỉnh tay
  // rồi re-run seed (idempotent giữ overrides). Nếu cần reset hoàn toàn,
  // dùng seedPermissionsFromMatrix() server action với force=true.
  // ADMIN special case: grant ALL 144 permissions (god-mode for system administrator).
  const adminRole = await prisma.role.findUnique({ where: { code: ROLES.ADMIN } });
  for (const resource of allResources) {
    const resourceMatrix = MATRIX_FOR_SEED[resource];
    for (const action of ALL_ACTIONS) {
      const permission = await prisma.permission.findUnique({
        where: { code: `${resource}:${action}` },
      });
      if (!permission) continue;
      // ADMIN: grant every permission unconditionally
      if (adminRole) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
          update: { granted: true },
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
            granted: true,
          },
        });
      }
      // Other roles: grant per MATRIX entries
      const grantedRoles = (resourceMatrix?.[action] ?? []).filter(
        (r) => r !== ROLES.ADMIN,
      );
      for (const roleCode of grantedRoles) {
        const role = await prisma.role.findUnique({
          where: { code: roleCode },
        });
        if (!role) continue;
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: { granted: true },
          create: {
            roleId: role.id,
            permissionId: permission.id,
            granted: true,
          },
        });
      }
    }
  }

  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const grantCount = await prisma.rolePermission.count({
    where: { granted: true },
  });
  logSeedStep('Roles', roleCount);
  logSeedStep('Permissions', permissionCount);
  logSeedStep('RolePermissions (granted)', grantCount);
}
