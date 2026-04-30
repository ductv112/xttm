// Audit log helper — withAuditLog wrapper + diff utility + logAudit fire-and-forget.
// WHY fire-and-forget: audit volume per PITFALLS — không block server action latency,
// failure log console.error nhưng KHÔNG throw để không break business action (graceful degradation).
// WHY dynamic import auth: lib/audit imported by mọi server action; lib/auth import từ
// next-auth/Credentials/bcrypt → tránh circular ở module load time.

import { prisma } from '@/lib/prisma';
import type { AuditAction, AuditEntry, AuditResource } from '@/lib/audit-types';

// Keys hệ thống tự quản — không tính vào diff (tránh noise)
const SYSTEM_FIELDS = new Set([
  'updatedAt',
  'createdAt',
  'searchKey',
  'currentVersion',
]);

export type DiffResult = {
  changed: Record<string, { from: unknown; to: unknown }>;
};

/**
 * Shallow diff cho top-level keys. Nested objects được so sánh qua JSON.stringify
 * để tránh false-positive khi reference khác nhưng giá trị giống.
 */
export function diffObjects(before: unknown, after: unknown): DiffResult {
  const changed: Record<string, { from: unknown; to: unknown }> = {};

  if (
    before == null ||
    after == null ||
    typeof before !== 'object' ||
    typeof after !== 'object'
  ) {
    if (before !== after) {
      changed['_value'] = { from: before, to: after };
    }
    return { changed };
  }

  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  for (const key of keys) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const a = beforeObj[key];
    const b = afterObj[key];
    if (a === b) continue;
    if (typeof a === 'object' && typeof b === 'object' && a != null && b != null) {
      try {
        if (JSON.stringify(a) === JSON.stringify(b)) continue;
      } catch {
        // ignore — fall through to record diff
      }
    }
    changed[key] = { from: a, to: b };
  }

  return { changed };
}

type LogAuditInput = {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Persist an audit log entry. Errors are swallowed (logged to console only)
 * — audit failure must NOT propagate to user action.
 */
export async function logAudit(
  entry: LogAuditInput,
  userId: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  try {
    let diffJson: string | null = null;
    if (entry.before !== undefined || entry.after !== undefined || entry.metadata) {
      const payload: Record<string, unknown> = {};
      if (entry.before !== undefined) payload.before = entry.before;
      if (entry.after !== undefined) payload.after = entry.after;
      if (entry.before !== undefined && entry.after !== undefined) {
        payload.diff = diffObjects(entry.before, entry.after).changed;
      }
      if (entry.metadata) payload.metadata = entry.metadata;
      diffJson = JSON.stringify(payload);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        diffJson,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    // Graceful degradation — audit must never break business action
    console.error('[audit.logAudit] failed to persist audit entry:', err);
  }
}

type WithAuditLogMeta<TArgs extends unknown[], TReturn> = {
  action: AuditAction;
  resource: AuditResource;
  /** Resolve resourceId from raw arguments (vd: first arg = id string) */
  resourceIdFromArgs?: (args: TArgs) => string | null | undefined;
  /** Resolve resourceId from result of fn (vd: created entity.id) */
  resourceIdFromResult?: (result: TReturn) => string | null | undefined;
  /** Capture entity state BEFORE mutation (eg fetch existing record by id) */
  captureBefore?: (args: TArgs) => Promise<unknown> | unknown;
  /** Capture entity state AFTER mutation; if omitted, fn result is used */
  captureAfter?: (result: TReturn, args: TArgs) => Promise<unknown> | unknown;
  /** Static metadata to attach (eg reason text from form) */
  metadata?: Record<string, unknown>;
};

/**
 * Wrap a server action mutation so that every successful invocation persists
 * an AuditLog row (action, resource, resourceId, before, after, ip, userAgent).
 *
 * Audit write is fire-and-forget — wrapper returns the original `fn` result
 * synchronously after kicking off the audit promise.
 *
 * Usage:
 * ```ts
 * 'use server';
 * export const updateUser = withAuditLog(
 *   {
 *     action: 'UPDATE',
 *     resource: 'nguoi-dung',
 *     resourceIdFromArgs: ([id]) => id,
 *     captureBefore: async ([id]) => prisma.user.findUnique({ where: { id } }),
 *   },
 *   async (id: string, data: UserPatch) => {
 *     return prisma.user.update({ where: { id }, data });
 *   },
 * );
 * ```
 */
export function withAuditLog<TArgs extends unknown[], TReturn>(
  meta: WithAuditLogMeta<TArgs, TReturn>,
  fn: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    // Dynamic import to avoid circular dependency at module load time
    // (lib/audit is imported by every server action; lib/auth pulls bcrypt + prisma + next-auth)
    const [{ auth }, { headers }] = await Promise.all([
      import('@/lib/auth'),
      import('next/headers'),
    ]);

    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Yêu cầu đăng nhập');
    }
    const userId = session.user.id;

    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null;
      userAgent = h.get('user-agent');
    } catch {
      // headers() may throw outside of request scope (eg from cron) — ignore
    }

    let before: unknown = undefined;
    if (meta.captureBefore) {
      try {
        before = await meta.captureBefore(args);
      } catch (err) {
        console.error('[audit.withAuditLog] captureBefore failed:', err);
      }
    }

    const result = await fn(...args);

    let after: unknown = undefined;
    try {
      after = meta.captureAfter ? await meta.captureAfter(result, args) : result;
    } catch (err) {
      console.error('[audit.withAuditLog] captureAfter failed:', err);
    }

    let resourceId: string | null = null;
    if (meta.resourceIdFromResult) {
      resourceId = meta.resourceIdFromResult(result) ?? null;
    }
    if (!resourceId && meta.resourceIdFromArgs) {
      resourceId = meta.resourceIdFromArgs(args) ?? null;
    }

    // Fire-and-forget — không await để không slow down response
    // Use void to make the floating-promise intentional
    void logAudit(
      {
        action: meta.action,
        resource: meta.resource,
        resourceId,
        before,
        after,
        metadata: meta.metadata,
      },
      userId,
      ip,
      userAgent,
    );

    return result;
  };
}
