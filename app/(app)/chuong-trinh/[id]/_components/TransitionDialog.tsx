'use client';

// TransitionDialog — Plan 03-07 confirm dialog cho mọi state transition (ngoài
// gia hạn — gia hạn dùng ExtendCycleDialog).
//
// Render dynamic VN message theo target để user hiểu hậu quả từng chuyển trạng
// thái. Wrap shadcn AlertDialog (confirm-only, không cần form input).
//
// Threat T-03-07-04 mitigation: useTransition isPending disable button trong
// quá trình submit; server action idempotent — nếu spam click, second call
// throws "Không thể chuyển từ X sang Y" vì status đã đổi.
//
// Threat T-03-07-02 mitigation: server action authoritative — dialog chỉ là
// UX confirmation, RBAC + transition table check ở Plan 03-03.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/format';
import {
  CYCLE_STATUS_LABELS,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';

import { transitionCycle } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';

// =============================================================================
// MESSAGE BUILDER — VN copy per target state
// =============================================================================

type DialogCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'destructive';
};

function buildCopy(target: ProgramCycleStatus, cycle: CycleDetail): DialogCopy {
  switch (target) {
    case 'READY':
      return {
        title: 'Hoàn thành cấu hình chu kỳ?',
        description:
          'Sau khi chuyển sang trạng thái Sẵn sàng, bạn cần upload công văn ban hành ở tab Công văn để có thể mở cổng nhận đăng ký. Tiếp tục?',
        confirmLabel: 'Chuyển sang Sẵn sàng',
        variant: 'default',
      };
    case 'OPEN_REGISTRATION': {
      const open = cycle.registrationOpenAt
        ? formatDate(cycle.registrationOpenAt)
        : '(chưa cấu hình)';
      const close = cycle.registrationCloseAt
        ? formatDate(cycle.registrationCloseAt)
        : '(chưa cấu hình)';
      return {
        title: 'Mở cổng nhận đăng ký?',
        description:
          `Sau khi mở cổng, các đơn vị chủ trì có thể bắt đầu nộp đề án từ ${open} đến ${close}. ` +
          'Hành động này nên đi kèm với gửi thông báo đến danh sách đơn vị mời (sang tab "Đơn vị mời + thông báo" để gửi). Tiếp tục?',
        confirmLabel: 'Mở cổng',
        variant: 'default',
      };
    }
    case 'CLOSED_REGISTRATION':
      return {
        title: 'Đóng cổng đăng ký?',
        description:
          'Đơn vị chủ trì sẽ không thể nộp đề án mới. Bạn có thể gia hạn (mở lại) sau khi đóng nếu cần. Tiếp tục?',
        confirmLabel: 'Đóng cổng',
        variant: 'destructive',
      };
    case 'EVALUATING':
      return {
        title: 'Chuyển sang thẩm định?',
        description:
          'Tất cả đề án đã nộp sẽ được chuyển vào quy trình thẩm định (Phase 7 sẽ xử lý). ' +
          'Sau bước này không thể quay lại trạng thái cổng đăng ký. Tiếp tục?',
        confirmLabel: 'Chuyển sang thẩm định',
        variant: 'default',
      };
    case 'DRAFT':
      return {
        title: 'Quay lại Bản nháp?',
        description:
          'Chu kỳ sẽ trở về trạng thái Bản nháp để bạn chỉnh sửa cấu hình. Hành động này được ghi vào nhật ký truy cập.',
        confirmLabel: 'Quay lại Bản nháp',
        variant: 'destructive',
      };
    case 'APPROVED':
      return {
        title: 'Phê duyệt kết quả thẩm định?',
        description:
          'Chu kỳ chuyển sang trạng thái Đã phê duyệt — Phase 7/9 sẽ xử lý chi tiết hợp đồng và triển khai.',
        confirmLabel: 'Phê duyệt',
        variant: 'default',
      };
    case 'COMPLETED':
      return {
        title: 'Đánh dấu hoàn thành chu kỳ?',
        description:
          'Sau khi đánh dấu hoàn thành, chu kỳ sẽ ở trạng thái cuối — không thể chỉnh sửa.',
        confirmLabel: 'Đánh dấu hoàn thành',
        variant: 'default',
      };
    default:
      return {
        title: `Chuyển sang ${CYCLE_STATUS_LABELS[target]}?`,
        description: 'Hành động này sẽ được ghi vào nhật ký truy cập. Tiếp tục?',
        confirmLabel: 'Xác nhận',
        variant: 'default',
      };
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export type TransitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: CycleDetail;
  target: ProgramCycleStatus | null;
};

export function TransitionDialog({
  open,
  onOpenChange,
  cycle,
  target,
}: TransitionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Skip render khi không có target — tránh AlertDialog flash content rỗng
  if (!target) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent />
      </AlertDialog>
    );
  }

  const copy = buildCopy(target, cycle);

  const handleConfirm = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      try {
        await transitionCycle({ cycleId: cycle.id, target });
        toast.success(
          `Đã chuyển trạng thái sang ${CYCLE_STATUS_LABELS[target]}`,
        );
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Lỗi chuyển trạng thái chu kỳ',
        );
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant={copy.variant}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              copy.confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TransitionDialog;
