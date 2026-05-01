// /phe-duyet — BQL danh sách tờ trình + nút lập tờ trình mới.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileSignature,
  PlusCircle,
  Send,
  Stamp,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime, formatVNDCompact } from '@/lib/format';

import { listSubmissions } from './_actions/list-candidates';

export const metadata = { title: 'Phê duyệt đề án' };

export default async function PheDuyetListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    redirect(defaultLandingPath(role));
  }
  const canCreate = await canFromDB(role, 'phe-duyet', 'create');

  const rows = await listSubmissions();

  const draftCount = rows.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = rows.filter(
    (r) => r.status === 'SUBMITTED_TO_BO',
  ).length;
  const decidedCount = rows.filter((r) => r.hasDecision).length;

  return (
    <main className="container mx-auto max-w-6xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature
              className="h-6 w-6 text-blue-600"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold text-slate-900">
              Phê duyệt đề án
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Lập tờ trình các đề án đã thẩm định gửi Bộ Công Thương → nhập quyết
            định phê duyệt từ Bộ → gửi thông báo kết quả cho đơn vị chủ trì.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="Đang soạn" value={draftCount} tone="amber" />
          <StatPill
            label="Đã gửi Bộ"
            value={submittedCount}
            tone="blue"
          />
          <StatPill label="Đã có QĐ" value={decidedCount} tone="emerald" />
          {canCreate ? (
            <Button asChild>
              <Link href="/phe-duyet/new">
                <PlusCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Lập tờ trình mới
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-2">
          <EmptyState
            icon="file-x"
            heading="Chưa có tờ trình nào"
            description={
              canCreate
                ? 'Lập tờ trình đầu tiên gửi Bộ Công Thương để bắt đầu quá trình phê duyệt đề án.'
                : 'Vui lòng đợi BQL lập tờ trình.'
            }
            action={
              canCreate ? { label: 'Lập tờ trình mới', href: '/phe-duyet/new' } : undefined
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.draftNumber ? (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 font-mono text-xs text-blue-700"
                      >
                        {r.draftNumber}
                      </Badge>
                    ) : null}
                    {r.hasDecision ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <Stamp className="mr-1 h-3 w-3" aria-hidden="true" />
                        Có QĐ {r.decisionNumber}
                      </Badge>
                    ) : r.status === 'SUBMITTED_TO_BO' ? (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700"
                      >
                        <Send className="mr-1 h-3 w-3" aria-hidden="true" />
                        Đã gửi Bộ
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        <ClipboardList
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        Đang soạn
                      </Badge>
                    )}
                    {r.hasDecision ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <CheckCircle2
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        Đã phê duyệt
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
                    Tờ trình {r.projectCount} đề án
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Soạn lúc {formatDateTime(r.draftedAt)} · Tổng dự toán:{' '}
                    <strong className="text-slate-700">
                      {formatVNDCompact(r.totalProposedBudget)}
                    </strong>
                    {r.totalApprovedBudget !== null ? (
                      <>
                        {' '}
                        · Tổng kinh phí phê duyệt:{' '}
                        <strong className="text-emerald-700">
                          {formatVNDCompact(r.totalApprovedBudget)}
                        </strong>
                      </>
                    ) : null}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/phe-duyet/${r.id}`}>
                    Xem chi tiết{' '}
                    <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
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
  tone: 'amber' | 'blue' | 'emerald';
}) {
  const map: Record<typeof tone, string> = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`min-w-[100px] rounded-md border px-3 py-1.5 text-center ${map[tone]}`}>
      <div className="text-lg font-semibold tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
