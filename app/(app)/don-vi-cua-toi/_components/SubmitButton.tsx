'use client';

// SubmitButton — gửi hồ sơ xác nhận với confirmation dialog.
// Disabled khi:
//   - status === 'SUBMITTED' (đã gửi rồi, đang chờ BQL)
//   - status === 'APPROVED' (đã phê duyệt — không cần gửi lại)
//   - validateGuards trả errors[] non-empty (hiển thị inline above button)
// Status DRAFT hoặc REJECTED → cho phép gửi.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  validateGuards,
  type OrgProfileCapabilities,
  type OrgProfileContact,
  type OrgProfileLegalInfo,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

import { submitMyProfile } from '../_actions/submit';

export type SubmitButtonProps = {
  status: OrgProfileStatus;
  legalInfo: OrgProfileLegalInfo;
  capabilities: OrgProfileCapabilities;
  contacts: OrgProfileContact[];
};

export function SubmitButton({
  status,
  legalInfo,
  capabilities,
  contacts,
}: SubmitButtonProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const router = useRouter();

  const guard = validateGuards({ legalInfo, capabilities, contacts });

  const submitted = status === 'SUBMITTED';
  const approved = status === 'APPROVED';
  const canSubmit = guard.ok && !submitted && !approved;

  const buttonLabel =
    status === 'REJECTED'
      ? 'Gửi lại xác nhận'
      : approved
        ? 'Đã được phê duyệt'
        : submitted
          ? 'Đang chờ phê duyệt'
          : 'Gửi hồ sơ xác nhận';

  const handleConfirm = async () => {
    try {
      await submitMyProfile();
      toast.success('Đã gửi hồ sơ xác nhận thành công. Ban quản lý sẽ phản hồi sớm.');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Không thể gửi hồ sơ. Vui lòng kiểm tra và thử lại.',
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gửi xác nhận</CardTitle>
        <CardDescription>
          Sau khi điền đầy đủ thông tin, vui lòng nhấn nút bên dưới để gửi hồ sơ tới Ban quản lý CT XTTM phê duyệt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {approved ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-700" aria-hidden="true" />
            <p className="text-emerald-800">
              Hồ sơ của bạn đã được Ban quản lý phê duyệt. Bạn có thể bắt đầu khai báo đề án trong các chu kỳ chương trình XTTM.
            </p>
          </div>
        ) : null}

        {!guard.ok && !submitted && !approved ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-amber-900">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Hồ sơ chưa đầy đủ
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
              {guard.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={() => setConfirmOpen(true)}
          disabled={!canSubmit}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận gửi hồ sơ tới Ban quản lý"
        description="Sau khi gửi, hồ sơ sẽ được khóa cho tới khi Ban quản lý phản hồi (phê duyệt hoặc yêu cầu bổ sung). Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Gửi hồ sơ"
        onConfirm={handleConfirm}
      />
    </Card>
  );
}

export default SubmitButton;
