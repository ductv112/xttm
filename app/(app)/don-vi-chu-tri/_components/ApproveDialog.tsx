'use client';

// ApproveDialog — confirmation dialog cho BQL phê duyệt hồ sơ.
// Wraps ConfirmDialog với async onConfirm gọi approveOrgProfile.

import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import { approveOrgProfile } from '../_actions/approve';

export type ApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  organizationName: string;
  onSuccess: () => void;
};

export function ApproveDialog({
  open,
  onOpenChange,
  profileId,
  organizationName,
  onSuccess,
}: ApproveDialogProps) {
  const handleConfirm = async () => {
    try {
      await approveOrgProfile(profileId);
      toast.success(`Đã phê duyệt hồ sơ của ${organizationName}`);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Không thể phê duyệt hồ sơ. Vui lòng thử lại.',
      );
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận phê duyệt hồ sơ"
      description={`Bạn xác nhận phê duyệt hồ sơ tổ chức của "${organizationName}"? Sau khi phê duyệt, đơn vị có thể bắt đầu khai báo đề án trong các chu kỳ XTTM.`}
      confirmLabel="Phê duyệt"
      onConfirm={handleConfirm}
    />
  );
}

export default ApproveDialog;
