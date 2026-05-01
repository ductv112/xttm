// /viec-can-lam — DONVI hàng đợi việc cần làm tổng hợp.
// 3 nhóm việc: Đề án (nháp/bổ sung), Báo cáo (lập/nháp/trả bổ sung), Điều chỉnh (chờ duyệt).
// Click row → /de-an/[id] hoặc /de-an/[id]#bao-cao | #dieu-chinh.

import { redirect } from 'next/navigation';
import { ListTodo } from 'lucide-react';

import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { ROLES } from '@/lib/constants';

import { listMyTodos } from './_actions/list';
import { TodoQueueTable } from './_components/TodoQueueTable';

export const metadata = { title: 'Việc cần làm' };

export default async function ViecCanLamPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (role !== ROLES.DONVI) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listMyTodos();
  const projectCount = rows.filter(
    (r) => r.type === 'PROJECT_DRAFT' || r.type === 'PROJECT_SUPPLEMENT',
  ).length;
  const reportCount = rows.filter(
    (r) =>
      r.type === 'REPORT_NEEDED' ||
      r.type === 'REPORT_DRAFT' ||
      r.type === 'REPORT_RETURNED',
  ).length;
  const amendmentCount = rows.filter((r) => r.type === 'AMENDMENT_PENDING')
    .length;
  const overdueCount = rows.filter((r) => r.daysWaiting >= 7).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ListTodo className="h-6 w-6 text-blue-600" aria-hidden="true" />
            Việc cần làm
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tổng hợp các việc đề án / báo cáo / điều chỉnh đang cần đơn vị xử lý
            hoặc theo dõi tiến độ phản hồi từ Ban quản lý.
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <StatPill label="Đề án" value={projectCount} tone="slate" />
          <StatPill label="Báo cáo" value={reportCount} tone="blue" />
          <StatPill label="Điều chỉnh" value={amendmentCount} tone="violet" />
          {overdueCount > 0 ? (
            <StatPill label="Quá 7 ngày" value={overdueCount} tone="red" />
          ) : null}
        </div>
      </header>

      <TodoQueueTable rows={rows} />
    </main>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'blue' | 'violet' | 'red';
}) {
  const map: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div
      className={`min-w-[100px] rounded-md border px-3 py-2 text-center ${map[tone]}`}
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
