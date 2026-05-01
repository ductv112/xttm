// /hoi-dong — BQL danh sách hội đồng thẩm định + nút tạo mới.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Calendar,
  ChevronRight,
  FileCheck2,
  Gavel,
  Lock,
  PlusCircle,
  Unlock,
  Users,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/shared/EmptyState';

import { listCouncils } from './_actions/list';
import { CreateCouncilButton } from './_components/CreateCouncilButton';

export const metadata = { title: 'Hội đồng thẩm định' };

export default async function CouncilListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const canCreate = await canFromDB(role, 'tham-dinh', 'create');
  const councils = await listCouncils();

  return (
    <main className="container mx-auto max-w-6xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Hội đồng thẩm định
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Quản lý các hội đồng thẩm định đề án Xúc tiến Thương mại Quốc gia.
            Mỗi hội đồng thẩm định một danh sách đề án trong chu kỳ chương trình
            hiện tại.
          </p>
        </div>
        {canCreate ? <CreateCouncilButton /> : null}
      </header>

      {councils.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-2">
          <EmptyState
            icon="users"
            heading="Chưa có hội đồng thẩm định nào"
            description={
              canCreate
                ? 'Tạo hội đồng đầu tiên để bắt đầu phân công đề án và chấm điểm thẩm định.'
                : 'Vui lòng đợi Ban quản lý CT XTTM khởi tạo hội đồng.'
            }
            action={
              canCreate
                ? {
                    label: 'Tạo hội đồng đầu tiên',
                    href: '#create-council',
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {councils.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700"
                    >
                      {c.term}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        c.lockStatus === 'LOCKED'
                          ? 'border-slate-300 bg-slate-100 text-slate-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }
                    >
                      {c.lockStatus === 'LOCKED' ? (
                        <>
                          <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                          Đã khóa
                        </>
                      ) : (
                        <>
                          <Unlock className="mr-1 h-3 w-3" aria-hidden="true" />
                          Đang mở
                        </>
                      )}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
                    {c.name}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Chu kỳ {c.programCycleYear} ·{' '}
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/hoi-dong/${c.id}`}>
                    Xem chi tiết{' '}
                    <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Stat
                  label="Thành viên"
                  value={c.memberCount}
                  icon={<Users className="h-4 w-4" aria-hidden="true" />}
                  tone="slate"
                />
                <Stat
                  label="Đề án"
                  value={c.assignmentCount}
                  icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />}
                  tone="blue"
                />
                <Stat
                  label="Phiếu nộp"
                  value={c.submittedSheetCount}
                  icon={<PlusCircle className="h-4 w-4" aria-hidden="true" />}
                  tone="emerald"
                />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'slate' | 'blue' | 'emerald';
}) {
  const map: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${map[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
