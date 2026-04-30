'use client';

// WithdrawDialog — Rút hồ sơ (SUBMITTED → DRAFT) confirmation dialog.
// Plan 05-03: wraps withdrawProject server action với ConfirmDialog destructive variant.
// Conditions hiển thị (gated by parent Header):
//   - status === SUBMITTED
//   - assignedToUserId === null
// Server action enforces same conditions defense-in-depth.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import { withdrawProject } from '../../_actions/withdraw';

export type WithdrawDialogProps = {
  projectId: string;
  projectCode: string;
};

export function WithdrawDialog({ projectId, projectCode }: WithdrawDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    try {
      await withdrawProject(projectId);
      toast.success(`Đã rút hồ sơ đề án ${projectCode}`, {
        description:
          'Đề án đã chuyển về trạng thái "Bản nháp". Bạn có thể tiếp tục chỉnh sửa và nộp lại.',
      });
      // Refresh server data + redirect tới list
      router.refresh();
      router.push('/de-an');
    } catch (err) {
      toast.error('Không thể rút hồ sơ', {
        description: (err as Error).message,
      });
      throw err; // keep dialog open on error
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Undo2 className="h-4 w-4" aria-hidden="true" />
        Rút hồ sơ
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Xác nhận rút hồ sơ"
        description={`Bạn có chắc muốn rút hồ sơ đề án ${projectCode}? Đề án sẽ chuyển về trạng thái "Bản nháp" và bạn có thể chỉnh sửa, nộp lại sau. Hành động này chỉ thực hiện được khi đề án chưa được phân công cho chuyên viên kiểm tra.`}
        confirmLabel="Rút hồ sơ"
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default WithdrawDialog;
