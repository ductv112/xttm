// /dieu-chinh/[id] — Phase 8 Plan 08-01 Task 4. Chi tiết yêu cầu điều chỉnh.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AMENDMENT_TYPE_LABELS,
  AMENDMENT_STATUS_LABELS,
  AMENDMENT_STATUS_BADGE,
  type AmendmentStatus,
  type AmendmentType,
} from '@/lib/amendment-rules';
import { formatDate, formatDateTime } from '@/lib/format';

import { getAmendmentDetail } from '../_actions/list';
import { SideBySideDiff } from '../_components/SideBySideDiff';
import { AmendmentActionsClient } from '../_components/AmendmentActionsClient';

export const metadata = { title: 'Chi tiết điều chỉnh' };

export default async function DieuChinhDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = session.user.role as Role;

  const { id } = await params;
  const a = await getAmendmentDetail(id);
  if (!a) notFound();

  const canApprove = await canFromDB(role, 'de-an', 'approve');
  const status = a.status as AmendmentStatus;
  const type = a.amendmentType as AmendmentType;

  return (
    <main className="container mx-auto max-w-5xl py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dieu-chinh">
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Quay về danh sách
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Pencil
              className="h-7 w-7 text-blue-600"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold text-slate-900">
              Yêu cầu điều chỉnh
            </h1>
            <Badge
              variant="outline"
              className={
                a.isCritical
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }
            >
              {a.isCritical ? '⚠ TRỌNG YẾU' : 'Loại nhỏ'}
            </Badge>
            <Badge
              variant="outline"
              className={
                AMENDMENT_STATUS_BADGE[status] ??
                'bg-slate-100 text-slate-800'
              }
            >
              {AMENDMENT_STATUS_LABELS[status] ?? a.status}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            <Link
              href={`/de-an/${a.projectId}`}
              className="text-blue-700 hover:underline"
            >
              <span className="font-mono">{a.projectCode}</span> —{' '}
              {a.projectName}
            </Link>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            <strong>{a.organizationName}</strong> ·{' '}
            {AMENDMENT_TYPE_LABELS[type] ?? a.amendmentType}
          </div>
        </div>
        {a.status === 'APPROVED' && a.decisionNumber ? (
          <Button asChild>
            <a
              href={`/api/pdf/amendment/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Tải QĐ điều chỉnh
            </a>
          </Button>
        ) : null}
      </header>

      <SideBySideDiff
        amendmentType={a.amendmentType}
        oldValue={a.oldValue}
        newValue={a.newValue}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-2 font-semibold text-slate-900">
          Lý do điều chỉnh
        </h3>
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {a.reason}
        </p>
        <div className="mt-3 text-xs text-slate-500">
          Yêu cầu lúc {formatDateTime(a.createdAt)}
          {a.requestedByName ? ` · ${a.requestedByName}` : ''}
        </div>
      </section>

      {a.reviewerComment ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h3 className="mb-2 font-semibold text-slate-900">
            Ghi chú xử lý của BQL
          </h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {a.reviewerComment}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            {a.reviewedByName ? a.reviewedByName : ''}
            {a.reviewedAt ? ` · ${formatDateTime(a.reviewedAt)}` : ''}
          </div>
        </section>
      ) : null}

      {a.status === 'APPROVED' && a.decisionNumber ? (
        <section className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-6 w-6 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-emerald-900">
                Đã phê duyệt điều chỉnh
              </h3>
              <p className="mt-1 text-sm text-emerald-800">
                Quyết định điều chỉnh:{' '}
                <span className="font-mono font-semibold">
                  {a.decisionNumber}
                </span>
                {a.decisionDate
                  ? ` ngày ${formatDate(a.decisionDate)}`
                  : ''}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {a.status === 'RESUBMIT_EVALUATION' ? (
        <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ArrowRight
              className="mt-0.5 h-6 w-6 text-blue-700"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-blue-900">
                Đã chuyển sang thẩm định lại
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                Đề án đã được chuyển về trạng thái &ldquo;Đang thẩm định&rdquo;.
                Vui lòng xem chi tiết tại trang{' '}
                <Link
                  href="/tham-dinh"
                  className="font-semibold underline"
                >
                  Thẩm định
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {a.status === 'REJECTED' ? (
        <section className="rounded-lg border-2 border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <XCircle
              className="mt-0.5 h-6 w-6 text-red-700"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-red-900">
                Yêu cầu điều chỉnh đã bị từ chối
              </h3>
            </div>
          </div>
        </section>
      ) : null}

      {a.status === 'PENDING' && canApprove ? (
        <AmendmentActionsClient amendmentId={a.id} isCritical={a.isCritical} />
      ) : null}
    </main>
  );
}
