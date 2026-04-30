// Shared types for /nhat-ky server actions and client components.
// No 'use server' directive — pure types file consumed at edge + client + server.

import type { AuditAction, AuditResource } from '@/lib/audit-types';

export type AuditFilter = {
  userId?: string;
  resources?: AuditResource[];
  actions?: AuditAction[];
  /** ISO date string (YYYY-MM-DD) or full ISO datetime */
  from?: string;
  /** ISO date string (YYYY-MM-DD) or full ISO datetime */
  to?: string;
  /** Free-text search across user.fullName + resourceId */
  keyword?: string;
};

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  userId: string;
  userFullName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  diffJson: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type AuditListResult = {
  rows: AuditLogRow[];
  total: number;
};
