// /tai-chinh/[id] — Phase 9 Plan 09-01 Task 3.
// Trang chi tiết hồ sơ tài chính + transition actions.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, ExternalLink } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND, formatDateTime, formatDate } from '@/lib/format';
import {
  FINANCIAL_TYPE_LABELS,
  FINANCIAL_TYPE_DESCRIPTIONS,
  FINANCIAL_STATUS_LABELS,
  FINANCIAL_STATUS_BADGE,
  ALLOWED_FINANCIAL_NEXT,
  type FinancialStatus,
} from '@/lib/workflows/financial';

import { getFinancialDetail } from '../_actions/list';
import { TransitionActions } from '../_components/TransitionActions';

export const metadata = { title: 'Chi tiết hồ sơ tài chính' };

export default async function FinancialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const { id } = await params;
  const record = await getFinancialDetail(id);
  if (!record) notFound();

  const canUpdate = await canFromDB(role, 'tai-chinh', 'update');
  const nextStates = ALLOWED_FINANCIAL_NEXT(record.status as FinancialStatus);

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/tai-chinh">
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Quay lại danh sách
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-slate-900">
              {FINANCIAL_TYPE_LABELS[record.recordType]}
            </h1>
            <Badge
              variant="outline"
              className={FINANCIAL_STATUS_BADGE[record.status]}
            >
              {FINANCIAL_STATUS_LABELS[record.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {FINANCIAL_TYPE_DESCRIPTIONS[record.recordType]}
          </p>
          {record.recordNumber ? (
            <p className="mt-1 font-mono text-sm text-blue-700">
              Số phiếu: {record.recordNumber}
            </p>
          ) : null}
        </div>
      </header>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Thông tin đề án
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DataRow label="Mã đề án">
            <Link
              href={`/de-an/${record.projectId}`}
              className="inline-flex items-center gap-1 font-mono text-blue-700 hover:underline"
            >
              {record.projectCode}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </DataRow>
          <DataRow label="Tên đề án">{record.projectName}</DataRow>
          <DataRow label="Đơn vị chủ trì">
            {record.organizationName}
          </DataRow>
          <DataRow label="Hợp đồng">
            {record.contractNo ?? '(Không liên kết)'}
          </DataRow>
        </dl>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Thông tin tài chính
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DataRow label="Số tiền">
            <span className="text-base font-semibold text-slate-900">
              {formatVND(record.amount)}
            </span>
          </DataRow>
          <DataRow label="Loại hồ sơ">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-800"
            >
              {FINANCIAL_TYPE_LABELS[record.recordType]}
            </Badge>
          </DataRow>
          <DataRow label="Trạng thái">
            <Badge
              variant="outline"
              className={FINANCIAL_STATUS_BADGE[record.status]}
            >
              {FINANCIAL_STATUS_LABELS[record.status]}
            </Badge>
          </DataRow>
          <DataRow label="Ngày tạo">
            {formatDateTime(record.createdAt)}
            {record.createdByName ? ` · ${record.createdByName}` : ''}
          </DataRow>
          {record.submittedAt ? (
            <DataRow label="Ngày nộp">
              {formatDateTime(record.submittedAt)}
            </DataRow>
          ) : null}
          {record.approvedAt ? (
            <DataRow label="Ngày duyệt">
              {formatDateTime(record.approvedAt)}
              {record.approvedByName ? ` · ${record.approvedByName}` : ''}
            </DataRow>
          ) : null}
          {record.disbursedAt ? (
            <DataRow label="Ngày chi">
              {formatDateTime(record.disbursedAt)}
            </DataRow>
          ) : null}
          {record.transactionDate ? (
            <DataRow label="Ngày giao dịch">
              {formatDate(record.transactionDate)}
            </DataRow>
          ) : null}
        </dl>
        {record.notes ? (
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Ghi chú</p>
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
              {record.notes}
            </p>
          </div>
        ) : null}
      </section>

      {canUpdate && nextStates.length > 0 ? (
        <section className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-base font-semibold text-blue-900">
            Chuyển trạng thái
          </h2>
          <p className="text-xs text-blue-800">
            Hồ sơ hiện đang ở trạng thái{' '}
            <strong>{FINANCIAL_STATUS_LABELS[record.status]}</strong>. Có thể
            chuyển sang các trạng thái sau:
          </p>
          <div className="mt-3">
            <TransitionActions
              recordId={record.id}
              nextStates={nextStates}
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}
