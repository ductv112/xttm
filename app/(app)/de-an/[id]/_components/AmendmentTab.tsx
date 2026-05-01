'use client';

// AmendmentTab — Phase 8 Plan 08-01 Task 4.
// Tab "Điều chỉnh đề án" — đơn vị tạo + xem trạng thái yêu cầu điều chỉnh,
// BQL có thể phê duyệt/từ chối/chuyển thẩm định.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  ExternalLink,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  AMENDMENT_TYPE_LABELS,
  AMENDMENT_STATUS_LABELS,
  AMENDMENT_STATUS_BADGE,
  type AmendmentType,
  type AmendmentStatus,
} from '@/lib/amendment-rules';
import { formatDate, formatDateTime } from '@/lib/format';

import type { ProjectDetail } from '../../_actions/get-detail';
import { AmendmentForm } from '../../../dieu-chinh/_components/AmendmentForm';
import {
  approveAmendment,
  rejectAmendment,
  routeAmendmentToEvaluation,
} from '../../../dieu-chinh/_actions/approve';

export type AmendmentRow = {
  id: string;
  amendmentType: string;
  isCritical: boolean;
  status: string;
  reason: string;
  createdAt: Date;
  requestedByName: string | null;
  decisionNumber: string | null;
  decisionDate: Date | null;
};

export function AmendmentTab({
  project,
  amendments,
  isOwner,
  canApprove,
}: {
  project: ProjectDetail;
  amendments: ReadonlyArray<AmendmentRow>;
  isOwner: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const canRequest =
    isOwner &&
    ['APPROVED', 'IN_PROGRESS'].includes(project.status);

  async function handleApprove(id: string) {
    setPendingId(id);
    try {
      const result = await approveAmendment(id);
      if (result.ok) {
        toast.success('Đã phê duyệt điều chỉnh');
        router.refresh();
      } else {
        toast.error('Phê duyệt thất bại', { description: result.error });
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Lý do từ chối:');
    if (!reason || reason.trim().length < 5) return;
    setPendingId(id);
    try {
      const result = await rejectAmendment(id, reason);
      if (result.ok) {
        toast.success('Đã từ chối yêu cầu điều chỉnh');
        router.refresh();
      } else {
        toast.error('Từ chối thất bại', { description: result.error });
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleRoute(id: string) {
    if (
      !window.confirm(
        'Chuyển sang thẩm định lại sẽ đưa đề án về trạng thái "Đang thẩm định". Tiếp tục?',
      )
    )
      return;
    setPendingId(id);
    try {
      const result = await routeAmendmentToEvaluation(id);
      if (result.ok) {
        toast.success('Đã chuyển sang thẩm định lại');
        router.refresh();
      } else {
        toast.error('Chuyển trạng thái thất bại', {
          description: result.error,
        });
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Pencil
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">
              Điều chỉnh đề án theo Điều 13 NĐ 28/2018/NĐ-CP
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              Đơn vị chủ trì có thể đề nghị điều chỉnh nếu phát sinh thay đổi
              trong quá trình triển khai. Hệ thống tự động phân loại điều chỉnh{' '}
              <strong>NHỎ</strong> (BQL phê duyệt nội bộ) và{' '}
              <strong>TRỌNG YẾU</strong> (yêu cầu thẩm định lại).
            </p>
            {canRequest ? (
              <Button
                onClick={() => setFormOpen(true)}
                size="sm"
                className="mt-3"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Đề nghị điều chỉnh
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {amendments.length === 0 ? (
        <EmptyState
          icon="file-x"
          heading="Chưa có yêu cầu điều chỉnh"
          description={
            canRequest
              ? 'Bấm "Đề nghị điều chỉnh" để gửi yêu cầu lần đầu.'
              : 'Đề án này chưa có lịch sử điều chỉnh.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {amendments.map((a) => {
            const status = a.status as AmendmentStatus;
            const type = a.amendmentType as AmendmentType;
            return (
              <li
                key={a.id}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                      <span className="font-medium text-slate-900">
                        {AMENDMENT_TYPE_LABELS[type] ?? a.amendmentType}
                      </span>
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
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                      {a.reason}
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      Yêu cầu lúc {formatDateTime(a.createdAt)}
                      {a.requestedByName ? ` · ${a.requestedByName}` : ''}
                      {a.decisionNumber ? (
                        <>
                          {' '}
                          · QĐ{' '}
                          <span className="font-mono">
                            {a.decisionNumber}
                          </span>
                          {a.decisionDate
                            ? ` ngày ${formatDate(a.decisionDate)}`
                            : ''}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dieu-chinh/${a.id}`}>
                        <ExternalLink
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        Xem chi tiết
                      </Link>
                    </Button>
                    {a.status === 'APPROVED' && a.decisionNumber ? (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={`/api/pdf/amendment/${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download
                            className="mr-1 h-4 w-4"
                            aria-hidden="true"
                          />
                          QĐ điều chỉnh
                        </a>
                      </Button>
                    ) : null}
                    {canApprove && a.status === 'PENDING' ? (
                      <>
                        {a.isCritical ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pendingId === a.id}
                            onClick={() => handleRoute(a.id)}
                          >
                            <ArrowRight
                              className="mr-1 h-4 w-4"
                              aria-hidden="true"
                            />
                            Chuyển thẩm định lại
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={pendingId === a.id}
                            onClick={() => handleApprove(a.id)}
                          >
                            <CheckCircle2
                              className="mr-1 h-4 w-4"
                              aria-hidden="true"
                            />
                            Phê duyệt
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === a.id}
                          onClick={() => handleReject(a.id)}
                        >
                          <XCircle
                            className="mr-1 h-4 w-4"
                            aria-hidden="true"
                          />
                          Từ chối
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AmendmentForm
        projectId={project.id}
        projectName={project.name}
        projectGeneralInfo={project.generalInfo}
        projectBudget={project.budget}
        projectObjectives={project.objectives}
        organizationName={project.organizationName}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => router.refresh()}
      />

      {amendments.some((a) => a.status === 'PENDING') ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle
            className="mr-1 inline h-4 w-4"
            aria-hidden="true"
          />
          Có yêu cầu điều chỉnh đang chờ BQL xử lý.
        </div>
      ) : null}
    </div>
  );
}
