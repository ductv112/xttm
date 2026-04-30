'use client';

// Reset password dialog — 2 steps: confirm → show-password.
// Temp password chỉ hiển thị 1 lần; user phải copy trước khi đóng dialog.

import * as React from 'react';
import { AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/shared/CopyButton';
import { resetPassword } from '../_actions/reset-password';

export type ResetPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userFullName?: string;
};

type Step = 'confirm' | 'show-password';

export function ResetPasswordDialog({
  open,
  onOpenChange,
  userId,
  userFullName,
}: ResetPasswordDialogProps) {
  const [step, setStep] = React.useState<Step>('confirm');
  const [tempPassword, setTempPassword] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Wait one tick so close animation doesn't show step switch
      const timer = setTimeout(() => {
        setStep('confirm');
        setTempPassword('');
        setSubmitting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  async function handleConfirm() {
    if (!userId) return;
    setSubmitting(true);
    try {
      const { tempPassword: pw } = await resetPassword(userId);
      setTempPassword(pw);
      setStep('show-password');
      toast.success('Đã reset mật khẩu thành công');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset mật khẩu thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent close-on-overlay-click while showing password — user must
        // explicitly click "Đã lưu, đóng" to acknowledge they have copied
        onPointerDownOutside={(e) => {
          if (step === 'show-password') e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (step === 'show-password') e.preventDefault();
        }}
      >
        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-slate-700" aria-hidden="true" />
                Reset mật khẩu
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn reset mật khẩu cho{' '}
                <span className="font-medium text-slate-900">
                  {userFullName ?? 'người dùng này'}
                </span>
                ? Mật khẩu hiện tại sẽ bị thay thế bằng mật khẩu tạm mới.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Đang reset...
                  </>
                ) : (
                  'Reset mật khẩu'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-green-600" aria-hidden="true" />
                Mật khẩu tạm thời
              </DialogTitle>
              <DialogDescription>
                Đã sinh mật khẩu tạm cho{' '}
                <span className="font-medium text-slate-900">
                  {userFullName ?? 'người dùng'}
                </span>
                . Vui lòng cung cấp cho người dùng để đăng nhập lần đầu.
              </DialogDescription>
            </DialogHeader>

            <div
              role="alert"
              className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p>
                Vui lòng lưu lại mật khẩu này — sau khi đóng dialog sẽ không thể
                xem lại.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <code
                className="flex-1 select-all font-mono text-base text-slate-900"
                aria-label="Mật khẩu tạm thời"
              >
                {tempPassword}
              </code>
              <CopyButton
                value={tempPassword}
                label="Sao chép"
                successMessage="Đã sao chép mật khẩu vào bộ nhớ tạm"
              />
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Đã lưu, đóng dialog
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
