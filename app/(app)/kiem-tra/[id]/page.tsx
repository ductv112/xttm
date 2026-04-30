// /kiem-tra/[id] — Trang chi tiết kiểm tra hồ sơ.
// Layout: 2 cột — left readonly project info, right checklist form + action buttons.
// T-06-01-01: cross-tenant guard via getReviewProjectDetail (null khi không phải assigned reviewer + không phải BANQL/ADMIN).

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, FileText, User } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import { getReviewProjectDetail } from '../_actions/get-detail';
import { ChecklistForm } from './_components/ChecklistForm';
import { ReviewActions } from './_components/ReviewActions';

export const metadata = { title: 'Kiểm tra hồ sơ — chi tiết' };

export default async function KiemTraDetailPage({
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
  const project = await getReviewProjectDetail(id);
  if (!project) {
    notFound();
  }

  const isAssignedToMe = project.assignedReviewerId === session.user.id;
  const editable =
    isAssignedToMe &&
    (project.status === 'IN_REVIEW' || project.status === 'RESUBMITTED');

  return (
    <main className="container mx-auto max-w-7xl py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/kiem-tra"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách hồ sơ
        </Link>
      </div>

      <header className="mb-6 rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-slate-500">
                {project.code}
              </span>
              <StatusBadge status={project.status} entity="PROJECT" />
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 font-normal text-slate-700"
              >
                {PROJECT_KIND_LABELS[project.kind] ?? project.kind}
              </Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900">
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {project.organizationName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Chu kỳ {project.programCycleYear}
              </span>
              {project.assignedReviewerName ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  Chuyên viên: {project.assignedReviewerName}
                </span>
              ) : null}
              {project.budget.total !== undefined && project.budget.total > 0 ? (
                <span>
                  Tổng dự toán:{' '}
                  <strong>{formatVNDCompact(project.budget.total)}</strong>
                </span>
              ) : null}
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/de-an/${project.id}`} target="_blank">
              <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Xem hồ sơ đầy đủ
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT — Checklist + project summary */}
        <div className="space-y-6">
          {/* Project info summary */}
          <ProjectInfoSummary project={project} />

          {/* Checklist form (HERO) */}
          <ChecklistForm
            projectId={project.id}
            initialEntries={project.checklist.items}
            readonly={!editable}
          />
        </div>

        {/* RIGHT — Sticky action panel */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Hành động kiểm tra
            </h2>
            <ReviewActions
              projectId={project.id}
              projectCode={project.code}
              projectName={project.name}
              status={project.status}
              passRatio={project.checklistProgress.ratio}
              lastSupplementReason={project.supplementRequestReason}
              isAssignedToMe={isAssignedToMe}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// ProjectInfoSummary — readonly project info cho chuyên viên đối chiếu
// ---------------------------------------------------------------------------

function ProjectInfoSummary({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getReviewProjectDetail>>>;
}) {
  const objHtml = project.objectives.objective ?? '';
  const objSummary =
    objHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220) + (objHtml.length > 220 ? '…' : '');

  const planRows = project.plan.rows ?? [];
  const budgetRows = project.budget.rows ?? [];
  const time = project.generalInfo.timeRange ?? null;

  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-700">
          Tóm tắt hồ sơ (đối chiếu khi kiểm tra)
        </h2>
      </header>
      <div className="space-y-3 p-4">
        {time && (time.start || time.end) ? (
          <div className="text-sm">
            <span className="font-medium text-slate-600">Thời gian:</span>{' '}
            <span className="text-slate-700">
              {time.start ? formatDate(time.start) : '—'} →{' '}
              {time.end ? formatDate(time.end) : '—'}
              {time.quarter ? ` (${time.quarter})` : ''}
            </span>
          </div>
        ) : null}

        {objSummary ? (
          <div className="text-sm">
            <span className="font-medium text-slate-600">Mục tiêu:</span>
            <p className="mt-0.5 text-slate-700">{objSummary}</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">
              Kế hoạch chi tiết
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {planRows.length}
            </p>
            <p className="text-xs text-slate-500">hạng mục công việc</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">Dự toán</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {budgetRows.length}
            </p>
            <p className="text-xs text-slate-500">
              dòng — Tổng:{' '}
              <strong>{formatVNDCompact(project.budget.total ?? 0)}</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
