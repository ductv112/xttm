'use client';

// SupplementRequestDialog — chuyên viên nhập lý do trả bổ sung.
// Validation: ≥20 chars, ≤2000 chars.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { requestSupplement } from '../../_actions/request-supplement';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectCode: string;
  projectName: string;
  defaultReason?: string | null;
};

const SUGGESTED_REASONS = [
  'Đề nghị bổ sung tài liệu năng lực hoạt động (giấy đăng ký, hồ sơ năng lực 3 năm gần nhất).',
  'Đề nghị bổ sung chi tiết dự toán: chia nhỏ hạng mục, đối chiếu khớp với kế hoạch triển khai.',
  'Đề nghị bổ sung thông tin chủ nhiệm đề án: lý lịch khoa học + minh chứng kinh nghiệm.',
  'Đề nghị bổ sung kế hoạch liên hệ thương vụ Việt Nam tại nước sở tại (đối với đoàn ra).',
];

export function SupplementRequestDialog({
  open,
  onOpenChange,
  projectId,
  projectCode,
  projectName,
  defaultReason,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = React.useState(defaultReason ?? '');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason(defaultReason ?? '');
    }
  }, [open, defaultReason]);

  const length = reason.trim().length;
  const valid = length >= 20 && length <= 2000;

  const handleSubmit = async () => {
    if (!valid) {
      toast.error('Nội dung yêu cầu bổ sung tối thiểu 20 ký tự');
      return;
    }
    try {
      setBusy(true);
      await requestSupplement({ projectId, reason: reason.trim() });
      toast.success(`Đã gửi yêu cầu bổ sung cho hồ sơ ${projectCode}`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại');
    } finally {
      setBusy(false);
    }
  };

  const insertSuggestion = (text: string) => {
    setReason((prev) =>
      prev.trim().length === 0 ? text : `${prev.trim()}\n• ${text}`,
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>Yêu cầu bổ sung hồ sơ</SheetTitle>
          <SheetDescription>
            {projectCode} — {projectName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nội dung cần bổ sung
              <span className="ml-1 text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ghi rõ các tài liệu / thông tin cần đơn vị chủ trì bổ sung. Có thể trích dẫn cụ thể mục checklist không đạt…"
              rows={6}
              maxLength={2000}
              disabled={busy}
              className="text-sm"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span
                className={
                  length < 20
                    ? 'text-amber-600'
                    : length > 2000
                      ? 'text-red-600'
                      : 'text-slate-500'
                }
              >
                {length < 20
                  ? `Cần thêm ${20 - length} ký tự`
                  : `${length}/2000 ký tự`}
              </span>
              <span className="text-slate-400">Tối thiểu 20, tối đa 2000</span>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-600">
              Gợi ý nhanh (click để chèn):
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_REASONS.map((s, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal px-2 py-1 text-left text-xs"
                  onClick={() => insertSuggestion(s)}
                  disabled={busy}
                >
                  {s.length > 70 ? `${s.slice(0, 67)}…` : s}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Khi gửi, đơn vị chủ trì sẽ nhận thông báo (mock dispatch) và trạng
            thái hồ sơ sẽ chuyển sang &ldquo;Yêu cầu bổ sung&rdquo;. Đơn vị có thể chỉnh sửa
            và nộp lại.
          </p>
        </div>

        <SheetFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || busy}>
            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {busy ? 'Đang gửi…' : 'Gửi yêu cầu bổ sung'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
