'use client';

// RejectDialog — Dialog với textarea cho lý do từ chối.
// Validate min 10 chars (mirror server Zod). Calls rejectOrgProfile.

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { rejectOrgProfile } from '../_actions/reject';

const MIN_REASON = 10;
const MAX_REASON = 2000;

export type RejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  organizationName: string;
  onSuccess: () => void;
};

export function RejectDialog({
  open,
  onOpenChange,
  profileId,
  organizationName,
  onSuccess,
}: RejectDialogProps) {
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const charCount = reason.trim().length;
  const tooShort = charCount > 0 && charCount < MIN_REASON;
  const tooLong = charCount > MAX_REASON;
  const empty = charCount === 0;
  const valid = !tooShort && !tooLong && !empty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      if (empty || tooShort) {
        setError(`Lý do từ chối tối thiểu ${MIN_REASON} ký tự (hiện ${charCount})`);
      } else if (tooLong) {
        setError(`Lý do từ chối tối đa ${MAX_REASON} ký tự`);
      }
      return;
    }
    setSubmitting(true);
    try {
      await rejectOrgProfile({ profileId, reason: reason.trim() });
      toast.success(`Đã yêu cầu ${organizationName} bổ sung hồ sơ`);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể từ chối hồ sơ. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Từ chối hồ sơ và yêu cầu bổ sung</DialogTitle>
            <DialogDescription>
              Vui lòng nêu rõ lý do để đơn vị <strong>{organizationName}</strong> có thể bổ sung hồ sơ và gửi lại.
              Đơn vị sẽ nhận được thông báo kèm nội dung này.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="reject-reason">
              Lý do từ chối <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={5}
              placeholder="Ví dụ: Hồ sơ năng lực chưa đầy đủ — vui lòng bổ sung danh sách 3 đề án XTTM gần nhất kèm kết quả định lượng..."
              aria-invalid={!!error}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  tooLong
                    ? 'text-red-600'
                    : tooShort
                      ? 'text-amber-700'
                      : 'text-slate-500'
                }
              >
                {charCount} / {MAX_REASON} ký tự (tối thiểu {MIN_REASON})
              </span>
              {error ? <span className="text-red-600">{error}</span> : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting || !valid}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận từ chối'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RejectDialog;
