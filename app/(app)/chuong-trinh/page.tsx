// RSC list page /chuong-trinh — card view các năm với filter URL-driven.
// Plan 03-05 CYCLE-15 entry point.
//
// RBAC defense-in-depth (3 layers):
//   1. auth() session check — redirect /login nếu chưa đăng nhập
//   2. canFromDB(role, 'chuong-trinh', 'read') — redirect defaultLandingPath nếu thiếu quyền
//   3. listCycles server action lại check internally (line 1-3 của _actions/list.ts)
//
// Filter state là URL search params (bookmarkable, browser nav friendly):
//   ?year=2026&status=OPEN_REGISTRATION,CLOSED_REGISTRATION
//
// Year options preloaded server-side via prisma distinct năm (descending) —
// fallback range 2024..(currentYear+1) nếu DB chưa có cycle nào.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  PROGRAM_CYCLE_STATUSES,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';

import { listCycles } from './_actions/list';
import { CycleFilterBar } from './_components/CycleFilterBar';
import { CycleListGrid } from './_components/CycleListGrid';
import { CycleListEmptyState } from './_components/CycleListEmptyState';

export const metadata = { title: 'Chu kỳ chương trình XTTM' };

type CycleListSearchParams = {
  year?: string;
  status?: string;
};

const STATUS_SET = new Set<ProgramCycleStatus>(PROGRAM_CYCLE_STATUSES);

function parseYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) ? n : undefined;
}

function parseStatuses(raw: string | undefined): ProgramCycleStatus[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as ProgramCycleStatus[];
  const valid = parts.filter((s) => STATUS_SET.has(s));
  return valid.length > 0 ? valid : undefined;
}

async function loadYearOptions(): Promise<number[]> {
  const rows = await prisma.programCycle.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  });
  if (rows.length > 0) return rows.map((r) => r.year);
  // Fallback range when DB chưa có cycle nào — give user dropdown context
  const currentYear = new Date().getFullYear();
  const fallback: number[] = [];
  for (let y = currentYear + 1; y >= 2024; y--) fallback.push(y);
  return fallback;
}

export default async function CycleListPage({
  searchParams,
}: {
  searchParams: Promise<CycleListSearchParams>;
}) {
  // RBAC layer 1: auth
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  // RBAC layer 2: canFromDB read check
  if (!(await canFromDB(role, 'chuong-trinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const sp = await searchParams;
  const parsedYear = parseYear(sp.year);
  const parsedStatuses = parseStatuses(sp.status);

  // Permission-aware action button
  const canCreate = await canFromDB(role, 'chuong-trinh', 'create');

  // Parallel fetch — list (RBAC layer 3) + year dropdown options
  const [cycles, yearOptions] = await Promise.all([
    listCycles({
      year: parsedYear,
      statuses: parsedStatuses,
    }),
    loadYearOptions(),
  ]);

  return (
    <main className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Chu kỳ chương trình XTTM
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý các đợt chương trình XTTM Quốc gia theo năm — cấu hình mốc thời
            gian, ngân sách, tiêu chí thẩm định và danh sách đơn vị mời.
          </p>
        </div>
        {canCreate ? (
          <Button asChild size="default">
            <Link href="/chuong-trinh/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo chu kỳ mới
            </Link>
          </Button>
        ) : null}
      </div>

      <CycleFilterBar yearOptions={yearOptions} />

      {cycles.length === 0 ? (
        <CycleListEmptyState canCreate={canCreate} />
      ) : (
        <CycleListGrid cycles={cycles} />
      )}
    </main>
  );
}
