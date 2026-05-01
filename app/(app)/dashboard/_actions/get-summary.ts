'use server';

// getDashboardSummaryAction — server action wrapper for getDashboardSummary.
// RBAC: every authenticated user can read dashboard.read; data scoping happens
// inside the aggregation (DONVI sees only own org).

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { type Role } from '@/lib/constants';
import {
  getDashboardSummary,
  type DashboardSummary,
} from '@/lib/dashboard-aggregations';

export async function getDashboardSummaryAction(
  year: number,
): Promise<DashboardSummary> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'dashboard', 'read'))) {
    throw new Error('Bạn không có quyền truy cập trang chủ');
  }
  return getDashboardSummary(year, role, session.user.organizationId);
}
