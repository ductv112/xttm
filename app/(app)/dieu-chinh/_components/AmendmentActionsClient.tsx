'use client';

// AmendmentActionsClient — Phase 8 Plan 08-01 Task 4.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
  approveAmendment,
  rejectAmendment,
  routeAmendmentToEvaluation,
} from '../_actions/approve';

export function AmendmentActionsClient({
  amendmentId,
  isCritical,
}: {
  amendmentId: string;
  isCritical: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showReject, setShowReject] = React.useState(false);

  async function handleApprove() {
    setPending(true);
    try {
      const result = await approveAmendment(amendmentId);
      if (result.ok) {
        toast.success('Đã phê duyệt điều chỉnh', {
          description: result.decisionNumber
            ? `QĐ ${result.decisionNumber}`
            : undefined,
        });
        router.refresh();
      } else {
        toast.error('Phê duyệt thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  async function handleRoute() {
    if (
      !window.confirm(
        'Chuyển sang thẩm định lại sẽ đưa đề án về trạng thái "Đang thẩm định". Tiếp tục?',
      )
    )
      return;
    setPending(true);
    try {
      const result = await routeAmendmentToEvaluation(amendmentId);
      if (result.ok) {
        toast.success('Đã chuyển sang thẩm định lại');
        router.refresh();
      } else {
        toast.error('Thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  async function handleReject() {
    if (rejectReason.trim().length < 5) {
      toast.error('Lý do từ chối quá ngắn');
      return;
    }
    setPending(true);
    try {
      const result = await rejectAmendment(amendmentId, rejectReason);
      if (result.ok) {
        toast.success('Đã từ chối yêu cầu');
        router.refresh();
      } else {
        toast.error('Từ chối thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5">
      <h3 className="mb-3 font-semibold text-amber-900">
        Xử lý yêu cầu điều chỉnh
      </h3>
      <div className="flex flex-wrap gap-2">
        {isCritical ? (
          <Button onClick={handleRoute} disabled={pending}>
            <ArrowRight className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Chuyển thẩm định lại
          </Button>
        ) : (
          <Button onClick={handleApprove} disabled={pending}>
            <CheckCircle2
              className="mr-1.5 h-4 w-4"
              aria-hidden="true"
            />
            Phê duyệt + Sinh QĐ điều chỉnh
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowReject((s) => !s)}
          disabled={pending}
        >
          <XCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Từ chối
        </Button>
      </div>

      {showReject ? (
        <div className="mt-4">
          <Label htmlFor="rejectReason">Lý do từ chối *</Label>
          <Textarea
            id="rejectReason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Mô tả lý do từ chối yêu cầu điều chỉnh..."
            className="mt-1"
          />
          <div className="mt-2 flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={pending}
              size="sm"
            >
              Xác nhận từ chối
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowReject(false)}
              size="sm"
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
