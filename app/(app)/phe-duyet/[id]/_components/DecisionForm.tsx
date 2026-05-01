'use client';

// DecisionForm — BQL nhập quyết định phê duyệt từ Bộ.
// - Form: số QĐ, ngày ký, người ký + chức vụ
// - Bảng approvedItems: per-project approved budget input + comments + uncheck = REJECTED_FINAL
// - Validation: warn nếu approvedBudget > proposedBudget (red) + reject if total = 0

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Stamp,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatVNDCompact, formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { SubmissionDetail } from '../../_actions/save-submission';
import { saveDecision } from '../../_actions/save-decision';

type Props = {
  detail: SubmissionDetail;
  canCreate: boolean;
};

type ItemState = {
  projectId: string;
  approved: boolean;
  approvedBudget: number;
  comments: string;
};

export function DecisionForm({ detail, canCreate }: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const hasDecision = !!detail.decision;
  const editable = canCreate && !hasDecision;

  const [decisionNumber, setDecisionNumber] = React.useState(
    detail.decision?.decisionNumber ?? '',
  );
  const [decisionDate, setDecisionDate] = React.useState(
    detail.decision?.decisionDate
      ? toIsoDateString(detail.decision.decisionDate)
      : toIsoDateString(new Date()),
  );
  const [signedByName, setSignedByName] = React.useState(
    detail.decision?.signedByName ?? '',
  );
  const [signedByTitle, setSignedByTitle] = React.useState(
    detail.decision?.signedByTitle ?? 'BỘ TRƯỞNG\nBỘ CÔNG THƯƠNG',
  );
  const [notes, setNotes] = React.useState(detail.decision?.notes ?? '');
  const [busy, setBusy] = React.useState(false);

  const [items, setItems] = React.useState<ItemState[]>(() =>
    detail.projects.map((p) => {
      const decided = detail.decision?.approvedItems.find(
        (x) => x.projectId === p.id,
      );
      return {
        projectId: p.id,
        approved: decided !== undefined ? true : true, // default = approved (BQL deselects to reject)
        approvedBudget: decided?.approvedBudget ?? p.proposedBudget ?? 0,
        comments: decided?.comments ?? '',
      };
    }),
  );

  const updateItem = (id: string, patch: Partial<ItemState>) => {
    if (!editable) return;
    setItems((prev) =>
      prev.map((it) => (it.projectId === id ? { ...it, ...patch } : it)),
    );
  };

  const totalApproved = items
    .filter((it) => it.approved)
    .reduce((acc, it) => acc + (it.approvedBudget ?? 0), 0);
  const approvedCount = items.filter((it) => it.approved).length;
  const rejectedCount = items.length - approvedCount;

  const totalProposed = detail.projects.reduce(
    (acc, p) => acc + (p.proposedBudget ?? 0),
    0,
  );

  // Detect any approved budget > proposed
  const hasOverBudget = items.some((it) => {
    if (!it.approved) return false;
    const proj = detail.projects.find((p) => p.id === it.projectId);
    if (!proj?.proposedBudget) return false;
    return it.approvedBudget > proj.proposedBudget;
  });

  const handleSave = async () => {
    if (!decisionNumber.trim()) {
      toast.error('Vui lòng nhập số quyết định');
      return;
    }
    if (!signedByName.trim() || !signedByTitle.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin người ký');
      return;
    }
    const approvedItems = items.filter((it) => it.approved);
    if (approvedItems.length === 0) {
      toast.error('Phải phê duyệt ít nhất 1 đề án');
      return;
    }
    if (hasOverBudget) {
      const ok = await confirm({
        title: 'Cảnh báo: Kinh phí phê duyệt > đề nghị',
        description:
          'Một hoặc nhiều đề án có kinh phí phê duyệt vượt quá kinh phí đề nghị ban đầu. Bạn có chắc chắn muốn tiếp tục?',
        confirmLabel: 'Tiếp tục',
        variant: 'destructive',
      });
      if (!ok) return;
    } else {
      const ok = await confirm({
        title: 'Lưu quyết định phê duyệt',
        description: `Sẽ phê duyệt ${approvedItems.length} đề án (tổng ${formatVND(
          totalApproved,
        )}) và từ chối ${rejectedCount} đề án. Hành động này không thể hoàn tác.`,
        confirmLabel: 'Xác nhận lưu',
      });
      if (!ok) return;
    }

    try {
      setBusy(true);
      const r = await saveDecision({
        submissionId: detail.id,
        decisionNumber: decisionNumber.trim(),
        decisionDate,
        signedByName: signedByName.trim(),
        signedByTitle: signedByTitle.trim(),
        notes: notes.trim(),
        approvedItems: approvedItems.map((it) => ({
          projectId: it.projectId,
          approvedBudget: Number(it.approvedBudget) || 0,
          comments: it.comments.trim() || undefined,
        })),
      });
      toast.success(
        `Đã lưu quyết định ${decisionNumber} — ${r.approvedCount} đề án phê duyệt, ${r.rejectedCount} bị từ chối`,
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lưu quyết định thất bại',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Form header */}
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            <Stamp className="mr-1.5 inline h-4 w-4 text-blue-600" aria-hidden="true" />
            Thông tin quyết định
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="decision-number">Số quyết định</Label>
              <Input
                id="decision-number"
                value={decisionNumber}
                onChange={(e) => setDecisionNumber(e.target.value)}
                placeholder="VD: 1234/QĐ-BCT"
                disabled={!editable}
              />
            </div>
            <div>
              <Label htmlFor="decision-date">Ngày ký</Label>
              <Input
                id="decision-date"
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                disabled={!editable}
              />
            </div>
            <div>
              <Label htmlFor="signed-by-name">Người ký</Label>
              <Input
                id="signed-by-name"
                value={signedByName}
                onChange={(e) => setSignedByName(e.target.value)}
                placeholder="VD: Nguyễn Hồng Diên"
                disabled={!editable}
              />
            </div>
            <div>
              <Label htmlFor="signed-by-title">Chức vụ (xuống dòng để 2 dòng)</Label>
              <Textarea
                id="signed-by-title"
                value={signedByTitle}
                onChange={(e) => setSignedByTitle(e.target.value)}
                rows={2}
                placeholder="BỘ TRƯỞNG&#10;BỘ CÔNG THƯƠNG"
                disabled={!editable}
              />
            </div>
          </div>
        </section>

        {/* Items table */}
        <section className="rounded-md border border-slate-200 bg-white">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Danh sách đề án phê duyệt
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Phê duyệt {approvedCount}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700"
                >
                  Từ chối {rejectedCount}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tích chọn các đề án được phê duyệt. Bỏ chọn = không phê duyệt
              (REJECTED_FINAL).
            </p>
          </header>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Duyệt</TableHead>
                <TableHead>Mã / Đề án</TableHead>
                <TableHead className="text-right">Đề nghị</TableHead>
                <TableHead className="w-44 text-right">
                  Kinh phí phê duyệt
                </TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.projects.map((p) => {
                const it = items.find((x) => x.projectId === p.id);
                if (!it) return null;
                const isOver =
                  it.approved &&
                  p.proposedBudget !== null &&
                  it.approvedBudget > p.proposedBudget;
                return (
                  <TableRow
                    key={p.id}
                    className={
                      !it.approved
                        ? 'bg-red-50/30'
                        : isOver
                          ? 'bg-amber-50/30'
                          : undefined
                    }
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={it.approved}
                        onCheckedChange={(v) =>
                          updateItem(p.id, { approved: Boolean(v) })
                        }
                        disabled={!editable}
                        aria-label={`Phê duyệt ${p.code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-slate-500">
                        {p.code}
                      </div>
                      <div className="text-sm text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.organizationName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {p.proposedBudget
                        ? formatVNDCompact(p.proposedBudget)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={it.approvedBudget}
                        onChange={(e) =>
                          updateItem(p.id, {
                            approvedBudget: Number(e.target.value) || 0,
                          })
                        }
                        disabled={!editable || !it.approved}
                        className={cn(
                          'text-right tabular-nums',
                          isOver
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : '',
                        )}
                        min={0}
                      />
                      {isOver ? (
                        <p className="mt-1 text-right text-xs text-red-600">
                          <AlertTriangle
                            className="mr-0.5 inline h-3 w-3"
                            aria-hidden="true"
                          />
                          Vượt đề nghị
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={it.comments}
                        onChange={(e) =>
                          updateItem(p.id, { comments: e.target.value })
                        }
                        placeholder="Ghi chú (tùy chọn)..."
                        disabled={!editable}
                        className="text-sm"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-600">Tổng kinh phí phê duyệt:</span>
            <strong className="text-base text-emerald-700 tabular-nums">
              {formatVND(totalApproved)}
            </strong>
          </footer>
        </section>

        {/* Notes */}
        {editable ? (
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <Label htmlFor="decision-notes">Ghi chú quyết định (tùy chọn)</Label>
            <Textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ghi chú nội bộ hoặc tham chiếu công văn liên quan..."
              className="mt-1"
            />
          </section>
        ) : null}

        {/* Action footer */}
        {editable ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2
                className="h-4 w-4 text-emerald-500"
                aria-hidden="true"
              />
              {approvedCount}/{detail.projects.length} đề án sẽ được phê duyệt ·
              Tổng <strong>{formatVNDCompact(totalApproved)}</strong>
              {totalProposed > 0 ? (
                <>
                  {' '}
                  ({((totalApproved / totalProposed) * 100).toFixed(1)}% đề
                  nghị)
                </>
              ) : null}
            </div>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? (
                <>
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Đang lưu…
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Lưu quyết định
                </>
              )}
            </Button>
          </div>
        ) : hasDecision ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 text-emerald-600"
                aria-hidden="true"
              />
              <div className="flex-1 text-sm">
                <h4 className="font-semibold text-emerald-900">
                  Quyết định {detail.decision?.decisionNumber} đã được lưu
                </h4>
                <p className="mt-0.5 text-emerald-700">
                  Ký bởi {detail.decision?.signedByName} —{' '}
                  {(detail.decision?.signedByTitle ?? '').replace('\n', ' / ')}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`/api/pdf/decision/${detail.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="mr-1 h-3 w-3" aria-hidden="true" />
                  Xuất QĐ PDF
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Bạn không có quyền nhập quyết định phê duyệt.
          </div>
        )}
      </div>
      {confirmDialog}
    </>
  );
}

// ---------------------------------------------------------------------------

function toIsoDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Suppress unused import lint
void XCircle;
