'use client';

// NotifyComposer — Tiptap editor cho thông báo kết quả + preview per-org + send button.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  RichTextEditor,
  type VariableMenuItem,
} from '@/components/shared/RichTextEditor';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatVND, formatDate } from '@/lib/format';

import type { SubmissionDetail } from '../../_actions/save-submission';
import { notifyResults } from '../../_actions/notify-results';

type Props = {
  detail: SubmissionDetail;
  canCreate: boolean;
};

const VARIABLES: VariableMenuItem[] = [
  { key: 'tenDonVi', label: 'Tên đơn vị', example: 'Hiệp hội Da giày Việt Nam' },
  { key: 'tenDeAn', label: 'Tên đề án', example: 'Triển lãm GDS 2026' },
  { key: 'kinhPhiDuyet', label: 'Kinh phí phê duyệt', example: '2.500.000.000 đồng' },
  { key: 'soQD', label: 'Số quyết định', example: '1234/QĐ-BCT' },
  { key: 'ngayKy', label: 'Ngày ký', example: '15/05/2026' },
];

const DEFAULT_TEMPLATE = `<p><strong>Kính gửi: {tenDonVi}</strong></p>
<p>Bộ Công Thương xin trân trọng thông báo:</p>
<p>Đề án <strong>{tenDeAn}</strong> đã được phê duyệt theo Quyết định số <strong>{soQD}</strong> ngày <strong>{ngayKy}</strong> với kinh phí <strong>{kinhPhiDuyet}</strong>.</p>
<p>Đơn vị có trách nhiệm phối hợp với Cục Xúc tiến Thương mại để hoàn thiện các thủ tục ký hợp đồng triển khai trong vòng 60 ngày kể từ ngày ban hành quyết định.</p>
<p>Mọi thông tin chi tiết xin liên hệ Cục Xúc tiến Thương mại theo địa chỉ: 20 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội. Điện thoại: (024) 22.205.301.</p>
<p>Trân trọng./.</p>`;

const REJECT_TEMPLATE = `<p><strong>Kính gửi: {tenDonVi}</strong></p>
<p>Bộ Công Thương xin trân trọng thông báo:</p>
<p>Đề án <strong>{tenDeAn}</strong> chưa được phê duyệt trong khuôn khổ Quyết định số <strong>{soQD}</strong> ngày <strong>{ngayKy}</strong>.</p>
<p>Đơn vị có thể chỉnh sửa và nộp lại đề án trong các kỳ thẩm định tiếp theo nếu phù hợp với định hướng Chương trình XTTM Quốc gia.</p>
<p>Trân trọng./.</p>`;

export function NotifyComposer({ detail, canCreate }: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [mode, setMode] = React.useState<'approved' | 'rejected'>('approved');
  const [subject, setSubject] = React.useState(
    'Thông báo kết quả phê duyệt đề án XTTMQG — {tenDeAn}',
  );
  const [bodyHtml, setBodyHtml] = React.useState(DEFAULT_TEMPLATE);
  const [busy, setBusy] = React.useState(false);

  const decision = detail.decision;

  const approvedIds = React.useMemo(
    () =>
      new Set((decision?.approvedItems ?? []).map((i) => i.projectId)),
    [decision],
  );
  const approvedProjects = React.useMemo(
    () => detail.projects.filter((p) => approvedIds.has(p.id)),
    [detail.projects, approvedIds],
  );
  const rejectedProjects = React.useMemo(
    () => detail.projects.filter((p) => !approvedIds.has(p.id)),
    [detail.projects, approvedIds],
  );
  const targetProjects =
    mode === 'approved' ? approvedProjects : rejectedProjects;

  // Group by organization for preview
  const previewByOrg = React.useMemo(() => {
    if (!decision) return [];
    const byOrg = new Map<
      string,
      Array<{
        projectName: string;
        projectCode: string;
        approvedBudget: number | null;
      }>
    >();
    for (const p of targetProjects) {
      const item = decision.approvedItems.find((x) => x.projectId === p.id);
      const list = byOrg.get(p.organizationName) ?? [];
      list.push({
        projectName: p.name,
        projectCode: p.code,
        approvedBudget: item?.approvedBudget ?? null,
      });
      byOrg.set(p.organizationName, list);
    }
    return [...byOrg.entries()].map(([orgName, projects]) => ({
      orgName,
      projects,
    }));
  }, [targetProjects, decision]);

  const previewSample = React.useMemo(() => {
    if (!decision) return null;
    if (targetProjects.length === 0) return null;
    const sample = targetProjects[0]!;
    const item = decision.approvedItems.find(
      (x) => x.projectId === sample.id,
    );
    return substitute(bodyHtml, {
      tenDonVi: sample.organizationName,
      tenDeAn: sample.name,
      kinhPhiDuyet:
        item?.approvedBudget !== undefined
          ? formatVND(item.approvedBudget)
          : '—',
      soQD: decision.decisionNumber,
      ngayKy: formatDate(decision.decisionDate),
    });
  }, [targetProjects, bodyHtml, decision]);

  if (!decision) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Vui lòng nhập quyết định phê duyệt trước khi soạn thông báo.
      </div>
    );
  }

  const handleSwitchMode = (next: 'approved' | 'rejected') => {
    setMode(next);
    setBodyHtml(next === 'approved' ? DEFAULT_TEMPLATE : REJECT_TEMPLATE);
  };

  const handleSend = async () => {
    if (targetProjects.length === 0) {
      toast.error(
        mode === 'approved'
          ? 'Không có đề án nào được phê duyệt'
          : 'Không có đề án bị từ chối',
      );
      return;
    }
    if (bodyHtml.replace(/<[^>]+>/g, '').trim().length < 50) {
      toast.error('Nội dung thông báo quá ngắn');
      return;
    }
    const ok = await confirm({
      title: 'Gửi thông báo kết quả',
      description: `Sẽ gửi thông báo cho ${previewByOrg.length} đơn vị (${targetProjects.length} đề án ${mode === 'approved' ? 'được phê duyệt' : 'bị từ chối'}). Bạn có chắc?`,
      confirmLabel: 'Gửi thông báo',
    });
    if (!ok) return;
    try {
      setBusy(true);
      const r = await notifyResults({
        decisionId: decision.id,
        subject: subject.trim(),
        contentHtmlTemplate: bodyHtml,
      });
      toast.success(
        `Đã gửi thông báo: ${r.approvedDispatchCount} đơn vị phê duyệt + ${r.rejectedDispatchCount} đơn vị từ chối`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi thông báo thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Mode switcher */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            <Mail className="mr-1.5 inline h-4 w-4 text-blue-600" aria-hidden="true" />
            Soạn thông báo cho:
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSwitchMode('approved')}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Đơn vị được phê duyệt ({approvedProjects.length})
            </Button>
            <Button
              variant={mode === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSwitchMode('rejected')}
              disabled={rejectedProjects.length === 0}
            >
              <XCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Đơn vị bị từ chối ({rejectedProjects.length})
            </Button>
          </div>
        </div>

        {/* Compose */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="rounded-md border border-slate-200 bg-white">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Soạn email
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sử dụng các biến: {'{tenDonVi}'}, {'{tenDeAn}'},{' '}
                  {'{kinhPhiDuyet}'}, {'{soQD}'}, {'{ngayKy}'}
                </p>
              </header>
              <div className="space-y-3 p-4">
                <div>
                  <Label htmlFor="subject">Tiêu đề</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!canCreate}
                  />
                </div>
                <div>
                  <Label>Nội dung</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={bodyHtml}
                      onChange={setBodyHtml}
                      minHeight={320}
                      readOnly={!canCreate}
                      variables={VARIABLES}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <div className="rounded-md border border-slate-200 bg-white">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Xem trước (mẫu đầu tiên)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sẽ gửi {targetProjects.length} thông báo tới{' '}
                  {previewByOrg.length} đơn vị
                </p>
              </header>
              <div className="max-h-[480px] overflow-auto p-4">
                {previewSample ? (
                  <div className="space-y-3">
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <strong>Tiêu đề:</strong>{' '}
                      {targetProjects[0]
                        ? substitute(subject, {
                            tenDonVi: targetProjects[0]!.organizationName,
                            tenDeAn: targetProjects[0]!.name,
                            kinhPhiDuyet:
                              decision.approvedItems.find(
                                (x) => x.projectId === targetProjects[0]!.id,
                              )?.approvedBudget !== undefined
                                ? formatVND(
                                    decision.approvedItems.find(
                                      (x) =>
                                        x.projectId === targetProjects[0]!.id,
                                    )!.approvedBudget,
                                  )
                                : '—',
                            soQD: decision.decisionNumber,
                            ngayKy: formatDate(decision.decisionDate),
                          })
                        : ''}
                    </div>
                    <iframe
                      sandbox=""
                      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; font-size: 13px; line-height: 1.5; color: #0f172a;} p{margin: 0 0 8px;} strong{color: #0f172a;}</style></head><body>${previewSample}</body></html>`}
                      className="h-72 w-full rounded border border-slate-200 bg-white"
                      title="Email preview"
                    />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Đơn vị nhận
                      </h4>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {previewByOrg.map((g) => (
                          <li key={g.orgName}>
                            <Badge
                              variant="outline"
                              className="mr-1 border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {g.projects.length} đề án
                            </Badge>
                            {g.orgName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">
                    Không có đề án nào để gửi thông báo.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Send button */}
        {canCreate ? (
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-slate-200 bg-white p-4">
            <Button onClick={handleSend} disabled={busy || targetProjects.length === 0}>
              {busy ? (
                <>
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Đang gửi…
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Gửi thông báo cho {previewByOrg.length} đơn vị
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
      {confirmDialog}
    </>
  );
}

// ---------------------------------------------------------------------------

function substitute(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}
