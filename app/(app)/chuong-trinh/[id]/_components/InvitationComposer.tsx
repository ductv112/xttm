'use client';

// InvitationComposer — composer Tiptap với 7 variables + send button rate-limit aware.
// Plan 03-06 CYCLE-13. Reuses RichTextEditor (Phase 2 Plan 02-03) variables prop +
// integrated VariableMenu (built into RichTextEditor toolbar).
//
// VARIABLES (locked theo plan):
//   tenChuongTrinh, namKy, hanNopHoSo, tenDonVi, nguoiKy, ngayKyCongVan, soCongVan
//
// Preview:
//   - Sheet modal renders rendered HTML in iframe sandbox srcDoc với mock substitution
//     via split().join() (T-02-06 mitigation reuse — không dùng regex để tránh injection
//     từ admin-defined variable names).
//
// Send:
//   - ConfirmDialog "Bạn sắp gửi thông báo cho {N} đơn vị. Tiếp tục?"
//   - sendInvitation server action — server enforces rate-limit (5 phút) + content cap
//   - Toast feedback success / error VN; rate-limit error fall through to toast.

import * as React from 'react';
import { Eye, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import type { VariableMenuItem } from '@/components/shared/RichTextEditor';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/format';

import { sendInvitation } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';

export type InvitationComposerProps = {
  cycle: CycleDetail;
};

const DEFAULT_CONTENT_HTML = `<p>Kính gửi {{tenDonVi}},</p>
<p>Cục Xúc tiến Thương mại trân trọng thông báo {{tenChuongTrinh}} năm {{namKy}} đã chính thức mở cổng tiếp nhận đề án.</p>
<p>Đề nghị Quý đơn vị nghiên cứu và xây dựng đề án XTTM phù hợp với chương trình. Hạn nộp đề án: <strong>{{hanNopHoSo}}</strong>.</p>
<p>Mọi chi tiết xin liên hệ Cục Xúc tiến Thương mại — Bộ Công Thương.</p>
<p>Trân trọng,</p>
<p>{{nguoiKy}}</p>`;

// Substitute variables in HTML using split().join() — T-02-06-05 / T-02-07-08 mitigation.
// Safe to use because only known VARIABLES keys are substituted; user input never escapes
// {{key}} placeholder syntax into a regex.
function substitutePreview(
  html: string,
  values: Record<string, string>
): string {
  let out = html;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

export function InvitationComposer({ cycle }: InvitationComposerProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [subject, setSubject] = React.useState(
    `Mời đăng ký Chương trình XTTM Quốc gia năm ${cycle.year}`
  );
  const [contentHtml, setContentHtml] = React.useState(DEFAULT_CONTENT_HTML);
  const [submitting, setSubmitting] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const attachment = cycle.invitationLetterAttachment;
  const recipientCount = cycle.invitedOrganizations.length;

  const variables: VariableMenuItem[] = React.useMemo(
    () => [
      {
        key: 'tenChuongTrinh',
        label: 'Tên chương trình',
        example: cycle.name,
      },
      {
        key: 'namKy',
        label: 'Năm chu kỳ',
        example: String(cycle.year),
      },
      {
        key: 'hanNopHoSo',
        label: 'Hạn nộp hồ sơ',
        example: cycle.registrationCloseAt
          ? formatDate(cycle.registrationCloseAt)
          : 'Chưa cấu hình',
      },
      {
        key: 'tenDonVi',
        label: 'Tên đơn vị',
        example: 'Quý đơn vị',
      },
      {
        key: 'nguoiKy',
        label: 'Người ký',
        example: attachment?.signedByName ?? 'Cục trưởng Cục XTTM',
      },
      {
        key: 'soCongVan',
        label: 'Số công văn',
        example: attachment?.signedNumber ?? '...',
      },
      {
        key: 'ngayKyCongVan',
        label: 'Ngày ký công văn',
        example: attachment?.signedDate
          ? formatDate(attachment.signedDate)
          : '...',
      },
    ],
    [cycle, attachment]
  );

  const previewValues = React.useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const v of variables) {
      map[v.key] = v.example ?? '';
    }
    // Pick first invited org name for preview "tenDonVi"
    if (cycle.invitedOrganizations[0]) {
      map.tenDonVi = cycle.invitedOrganizations[0].name;
    }
    return map;
  }, [variables, cycle.invitedOrganizations]);

  const previewSubject = substitutePreview(subject, previewValues);
  const previewBodyHtml = substitutePreview(contentHtml, previewValues);

  const handleSend = async () => {
    if (recipientCount === 0) {
      toast.error('Vui lòng thêm ít nhất 1 đơn vị mời trước khi gửi');
      return;
    }

    const ok = await confirm({
      title: 'Xác nhận gửi thông báo',
      description: `Bạn sắp gửi thông báo cho ${recipientCount} đơn vị. Hành động này không thể hủy. Tiếp tục?`,
      confirmLabel: 'Gửi thông báo',
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      // Tiny artificial delay to give visual feedback (UX feel cho mock dispatch)
      await new Promise((res) => setTimeout(res, 800));
      const result = await sendInvitation({
        cycleId: cycle.id,
        subject,
        contentHtml,
        recipientOrgIds: cycle.invitedOrganizationIds,
        notificationType: 'CYCLE_INVITATION',
      });
      toast.success(`Đã gửi thông báo cho ${result.dispatchCount} đơn vị`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi gửi thông báo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {dialog}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ic-subject">
            Tiêu đề <span className="text-red-600">*</span>
          </Label>
          <Input
            id="ic-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
            placeholder="VD: Mời đăng ký Chương trình XTTM 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ic-body">
            Nội dung thông báo <span className="text-red-600">*</span>
          </Label>
          <RichTextEditor
            id="ic-body"
            value={contentHtml}
            onChange={setContentHtml}
            variables={variables}
            placeholder="Soạn nội dung thông báo mời đăng ký..."
            minHeight={300}
            readOnly={submitting}
          />
          <p className="text-xs text-slate-500">
            Sử dụng nút &quot;Chèn biến&quot; trên thanh công cụ để chèn các biến tự động —
            VD: <code className="font-mono text-blue-700">{`{{tenDonVi}}`}</code> sẽ thay
            bằng tên đơn vị tương ứng khi gửi.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Số đơn vị nhận: <span className="font-semibold">{recipientCount}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={submitting}
            >
              <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
              Xem trước
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={submitting || recipientCount === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" aria-hidden="true" />
                  Gửi cho {recipientCount} đơn vị
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" size="xl">
          <SheetHeader>
            <SheetTitle>Xem trước thông báo</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 px-1">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Tiêu đề
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {previewSubject}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white">
              <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                Nội dung (mẫu cho đơn vị đầu tiên)
              </p>
              <iframe
                srcDoc={`<!doctype html><html><head><meta charset="utf-8"/><style>body{font-family:system-ui,-apple-system,sans-serif;padding:16px;color:#0f172a;font-size:14px;line-height:1.6}p{margin:0 0 12px 0}strong{color:#0f172a}</style></head><body>${previewBodyHtml}</body></html>`}
                sandbox=""
                className="h-[500px] w-full"
                title="Xem trước nội dung thông báo"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default InvitationComposer;
