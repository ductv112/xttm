// /tham-dinh/[projectId] — Split-screen scoring page (rubric trái + project right).

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, Wallet } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import { getEvaluationDetail } from '../_actions/get-detail';
import { ScoringWorkspace } from './_components/ScoringWorkspace';
import { COUNCIL_MEMBER_ROLE_LABELS } from '../../hoi-dong/_actions/member-types';
import type { CouncilMemberRole } from '../../hoi-dong/_actions/member-types';

export const metadata = { title: 'Chấm điểm thẩm định' };

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { projectId } = await params;
  const detail = await getEvaluationDetail(projectId);
  if (!detail) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-[1600px] py-4">
      <div className="mb-3">
        <Link
          href="/tham-dinh"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách thẩm định
        </Link>
      </div>

      <header className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium text-slate-500">
                {detail.project.code}
              </span>
              <StatusBadge status={detail.project.status} entity="PROJECT" />
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 font-normal text-slate-700"
              >
                {PROJECT_KIND_LABELS[detail.project.kind] ??
                  detail.project.kind}
              </Badge>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                {detail.council.name} · {detail.council.term}
              </Badge>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                {COUNCIL_MEMBER_ROLE_LABELS[
                  detail.member.role as CouncilMemberRole
                ] ?? detail.member.role}
              </Badge>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
              {detail.project.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" aria-hidden="true" />
                {detail.project.organizationName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                Chu kỳ {detail.project.programCycleYear}
              </span>
              {detail.project.proposedBudget ? (
                <span className="inline-flex items-center gap-1">
                  <Wallet className="h-3 w-3" aria-hidden="true" />
                  Dự toán {formatVNDCompact(detail.project.proposedBudget)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {detail.criteria.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Chưa có tiêu chí thẩm định nào áp dụng cho loại đề án này. Vui lòng
          liên hệ Quản trị viên để cấu hình.
        </div>
      ) : (
        <ScoringWorkspace detail={detail} />
      )}
    </main>
  );
}
