// /phe-duyet/[id] — Chi tiết tờ trình với 3 tabs (Soạn / Quyết định / Thông báo).

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileText, Send, Stamp } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatVNDCompact } from '@/lib/format';

import { getSubmissionDetail } from '../_actions/save-submission';
import { listSubmissionCandidates } from '../_actions/list-candidates';
import { SubmissionTabsShell } from './_components/SubmissionTabsShell';

export const metadata = { title: 'Chi tiết tờ trình' };

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;
  const detail = await getSubmissionDetail(id);
  if (!detail) {
    notFound();
  }
  const canCreate = await canFromDB(role, 'phe-duyet', 'create');

  // Pre-load candidates if user can edit (for re-pick projects)
  const candidates =
    canCreate && !detail.decision
      ? await listSubmissionCandidates()
      : [];

  const totalProposed = detail.projects.reduce(
    (acc, p) => acc + (p.proposedBudget ?? 0),
    0,
  );

  return (
    <main className="container mx-auto max-w-6xl py-6">
      <div className="mb-3">
        <Link
          href="/phe-duyet"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách tờ trình
        </Link>
      </div>

      <header className="mb-5 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {detail.draftNumber ? (
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 font-mono text-xs text-blue-700"
                >
                  {detail.draftNumber}
                </Badge>
              ) : null}
              {detail.decision ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <Stamp className="mr-1 h-3 w-3" aria-hidden="true" />
                  Đã có QĐ {detail.decision.decisionNumber}
                </Badge>
              ) : detail.status === 'SUBMITTED_TO_BO' ? (
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
                  Đang soạn
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900">
              Tờ trình {detail.projects.length} đề án — Chu kỳ{' '}
              {detail.programCycleYear}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Soạn lúc {formatDateTime(detail.draftedAt)} · Tổng dự toán đề
              nghị:{' '}
              <strong className="text-slate-700">
                {formatVNDCompact(totalProposed)}
              </strong>
              {detail.decision ? (
                <>
                  {' '}
                  · Tổng kinh phí phê duyệt:{' '}
                  <strong className="text-emerald-700">
                    {formatVNDCompact(detail.decision.totalApprovedBudget)}
                  </strong>
                </>
              ) : null}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/pdf/submission/${detail.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="mr-1.5 h-3 w-3" aria-hidden="true" />
              Xuất tờ trình PDF
            </a>
          </Button>
        </div>
      </header>

      <SubmissionTabsShell
        detail={detail}
        candidates={candidates}
        canCreate={canCreate}
      />
    </main>
  );
}
