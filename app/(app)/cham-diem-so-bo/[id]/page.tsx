// /cham-diem-so-bo/[id] — Trang chi tiết chấm điểm sơ bộ.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Wallet,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import { getScoringDetail } from '../_actions/get-detail';
import { ScoringForm } from './_components/ScoringForm';

export const metadata = { title: 'Chấm điểm sơ bộ — chi tiết' };

export default async function ChamDiemSoBoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;
  const detail = await getScoringDetail(id);
  if (!detail) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-5xl py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/cham-diem-so-bo"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách chấm điểm
        </Link>
      </div>

      <header className="mb-6 rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-slate-500">
                {detail.project.code}
              </span>
              <StatusBadge status={detail.project.status} entity="PROJECT" />
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 font-normal text-slate-700"
              >
                {PROJECT_KIND_LABELS[detail.project.kind] ?? detail.project.kind}
              </Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900">
              {detail.project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {detail.project.organizationName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Chu kỳ {detail.project.programCycleYear}
              </span>
              {detail.project.budget.total !== undefined &&
              detail.project.budget.total > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatVNDCompact(detail.project.budget.total)}
                </span>
              ) : null}
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/de-an/${detail.project.id}`} target="_blank">
              <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Xem hồ sơ đầy đủ
            </Link>
          </Button>
        </div>
      </header>

      {detail.criteria.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Chưa có tiêu chí chấm điểm nào áp dụng cho loại đề án này. Vui lòng
          liên hệ Quản trị viên để cấu hình.
        </div>
      ) : (
        <ScoringForm
          projectId={detail.project.id}
          projectCode={detail.project.code}
          projectName={detail.project.name}
          criteria={detail.criteria}
          initialScores={detail.scoreSheet.scores}
          initialOverallComment={detail.scoreSheet.comment}
          initialStatus={detail.scoreSheet.status}
          initialTotalScore={detail.scoreSheet.totalScore}
          submittedAt={detail.scoreSheet.submittedAt}
        />
      )}
    </main>
  );
}
