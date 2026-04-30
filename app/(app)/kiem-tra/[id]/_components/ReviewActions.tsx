'use client';

// ReviewActions — Action buttons cho trang chi tiết kiểm tra (sticky right).
// - "Yêu cầu bổ sung" → mở SupplementRequestDialog
// - "Xác nhận hợp lệ" → confirm dialog → markValid
// - "Chấm điểm sơ bộ" (chỉ khi VALID + assigned to me)
//
// Hiển thị based on project.status:
//   IN_REVIEW: 2 buttons (request supplement / mark valid)
//   SUPPLEMENT_REQUIRED: read-only (đợi đơn vị nộp lại)
//   RESUBMITTED: same as IN_REVIEW + show last reason
//   VALID: only "Chấm điểm sơ bộ" + show success state
//   REJECTED: read-only

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ScrollText,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';
import { CHECKLIST_PASS_THRESHOLD } from '@/lib/intake-checklist';

import { markValid } from '../../_actions/mark-valid';
import { SupplementRequestDialog } from './SupplementRequestDialog';

type Props = {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: string;
  passRatio: number;
  lastSupplementReason: string | null;
  isAssignedToMe: boolean;
};

export function ReviewActions({
  projectId,
  projectCode,
  projectName,
  status,
  passRatio,
  lastSupplementReason,
  isAssignedToMe,
}: Props) {
  const router = useRouter();
  const [supplementOpen, setSupplementOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const meetsThreshold = passRatio >= CHECKLIST_PASS_THRESHOLD;

  const handleMarkValid = async () => {
    if (!meetsThreshold) {
      toast.error(
        `Cần đạt tối thiểu ${Math.round(CHECKLIST_PASS_THRESHOLD * 100)}% checklist trước khi xác nhận hợp lệ`,
      );
      return;
    }
    const ok = await confirm({
      title: 'Xác nhận hồ sơ hợp lệ',
      description: `Đề án "${projectName}" sẽ được chuyển sang trạng thái "Hợp lệ" và bạn có thể bắt đầu chấm điểm sơ bộ. Hành động này không thể hoàn tác trừ khi Lãnh đạo BQL thu hồi phân công.`,
      confirmLabel: 'Xác nhận hợp lệ',
    });
    if (!ok) return;
    try {
      setBusy(true);
      await markValid(projectId);
      toast.success(`Đã xác nhận hồ sơ ${projectCode} hợp lệ`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Xác nhận hợp lệ thất bại',
      );
    } finally {
      setBusy(false);
    }
  };

  // === Render based on status ===

  if (status === 'VALID') {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 text-emerald-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold text-emerald-900">
              Hồ sơ đã được xác nhận hợp lệ
            </h3>
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            Hồ sơ vượt qua kiểm tra hành chính và đã sẵn sàng cho bước chấm
            điểm sơ bộ.
          </p>
        </div>
        {isAssignedToMe ? (
          <Button
            className="w-full"
            onClick={() => router.push(`/cham-diem-so-bo/${projectId}`)}
          >
            <ScrollText className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Chấm điểm sơ bộ
          </Button>
        ) : null}
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-900">
            Hồ sơ đã bị từ chối
          </h3>
        </div>
        <p className="mt-1 text-xs text-red-700">
          Hồ sơ không đạt yêu cầu kiểm tra hành chính và đã bị từ chối.
        </p>
      </div>
    );
  }

  if (status === 'SUPPLEMENT_REQUIRED') {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-amber-900">
              Đã gửi yêu cầu bổ sung
            </h3>
          </div>
          <p className="mt-1 text-xs text-amber-800">
            Đang chờ đơn vị chủ trì cập nhật và nộp lại hồ sơ. Sau khi đơn vị
            nộp lại, trạng thái sẽ chuyển sang &ldquo;Đã nộp lại&rdquo; và bạn có thể tiếp
            tục kiểm tra.
          </p>
          {lastSupplementReason ? (
            <details className="mt-2 text-xs text-amber-900">
              <summary className="cursor-pointer font-medium">
                Xem nội dung yêu cầu đã gửi
              </summary>
              <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-amber-300 pl-3">
                {lastSupplementReason}
              </blockquote>
            </details>
          ) : null}
        </div>
      </div>
    );
  }

  // IN_REVIEW or RESUBMITTED — show full action set
  const isResubmitted = status === 'RESUBMITTED';

  return (
    <>
      <div className="space-y-3">
        {isResubmitted && lastSupplementReason ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs">
            <p className="font-semibold text-blue-900">
              Đơn vị đã nộp lại hồ sơ sau yêu cầu bổ sung
            </p>
            <details className="mt-1 text-blue-800">
              <summary className="cursor-pointer">
                Xem nội dung yêu cầu lần trước
              </summary>
              <blockquote className="mt-1 whitespace-pre-wrap border-l-2 border-blue-300 pl-3">
                {lastSupplementReason}
              </blockquote>
            </details>
          </div>
        ) : null}

        <Button
          className={cn('w-full', meetsThreshold ? '' : 'opacity-90')}
          variant={meetsThreshold ? 'default' : 'outline'}
          disabled={busy || !isAssignedToMe}
          onClick={handleMarkValid}
        >
          <ClipboardCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Xác nhận hợp lệ
          {!meetsThreshold ? (
            <span className="ml-1 text-xs opacity-75">
              ({Math.round(passRatio * 100)}%)
            </span>
          ) : null}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          disabled={busy || !isAssignedToMe}
          onClick={() => setSupplementOpen(true)}
        >
          <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Yêu cầu bổ sung
        </Button>

        {!meetsThreshold ? (
          <p className="text-xs text-slate-500">
            Cần đạt {Math.round(CHECKLIST_PASS_THRESHOLD * 100)}% checklist
            trước khi xác nhận hợp lệ. Hiện đang ở{' '}
            {Math.round(passRatio * 100)}%.
          </p>
        ) : (
          <p className="text-xs text-emerald-600">
            Checklist đã đạt ngưỡng. Có thể xác nhận hợp lệ.
          </p>
        )}

        {!isAssignedToMe ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Bạn đang xem hồ sơ ở chế độ chỉ-đọc vì không phải chuyên viên được
            phân công.
          </p>
        ) : null}
      </div>

      <SupplementRequestDialog
        open={supplementOpen}
        onOpenChange={setSupplementOpen}
        projectId={projectId}
        projectCode={projectCode}
        projectName={projectName}
        defaultReason={isResubmitted ? lastSupplementReason : null}
      />

      {confirmDialog}
    </>
  );
}
