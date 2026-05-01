'use client';

// SubmissionDraftForm — chọn projects + soạn nội dung tờ trình + lưu/chốt.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatVNDCompact } from '@/lib/format';

import type { SubmissionCandidate } from '../../_actions/list-candidates';
import type { SubmissionDetail } from '../../_actions/save-submission';
import {
  saveSubmission,
  finalizeSubmission,
} from '../../_actions/save-submission';

type Props =
  | {
      mode: 'create';
      candidates: SubmissionCandidate[];
      initial: null;
      canEdit?: undefined;
    }
  | {
      mode: 'edit';
      candidates: SubmissionCandidate[];
      initial: SubmissionDetail;
      canEdit: boolean;
    };

const DEFAULT_TEMPLATE = `<p><strong>BAN QUẢN LÝ CHƯƠNG TRÌNH XÚC TIẾN THƯƠNG MẠI QUỐC GIA</strong></p>
<p>Kính gửi: <strong>BỘ TRƯỞNG BỘ CÔNG THƯƠNG</strong></p>
<p>Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01 tháng 3 năm 2018 của Chính phủ quy định chi tiết Luật Quản lý ngoại thương về một số biện pháp phát triển ngoại thương;</p>
<p>Căn cứ Quyết định thành lập Hội đồng thẩm định Chương trình XTTM Quốc gia năm hiện tại;</p>
<p>Căn cứ kết quả thẩm định của Hội đồng (xem Biên bản kèm theo);</p>
<p>Ban Quản lý Chương trình Xúc tiến Thương mại Quốc gia kính trình Bộ trưởng xem xét, phê duyệt danh mục các đề án Xúc tiến Thương mại Quốc gia và kinh phí thực hiện như sau:</p>
<p><strong>1. Danh mục đề án đề nghị phê duyệt</strong> — chi tiết tại bảng đính kèm.</p>
<p><strong>2. Kiến nghị</strong></p>
<p>Kính đề nghị Bộ trưởng xem xét, phê duyệt và ban hành Quyết định để Cục Xúc tiến Thương mại tổ chức triển khai theo quy định.</p>
<p>Trân trọng./.</p>`;

export function SubmissionDraftForm(props: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const isCreate = props.mode === 'create';
  const initial = isCreate ? null : props.initial;
  const canEdit = isCreate ? true : (props.canEdit ?? false);
  const isLocked = !isCreate && initial?.decision !== null;

  const [draftNumber, setDraftNumber] = React.useState(
    initial?.draftNumber ?? '',
  );
  const [contentHtml, setContentHtml] = React.useState(
    initial?.contentHtml ?? DEFAULT_TEMPLATE,
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () =>
      new Set(initial?.projects.map((p) => p.id) ?? []),
  );
  const [busy, setBusy] = React.useState<'save' | 'finalize' | null>(null);

  const candidates = React.useMemo(() => {
    // For edit mode, ensure already-selected projects appear even if not in candidates list
    if (!isCreate && initial) {
      const candidateIds = new Set(props.candidates.map((c) => c.projectId));
      const extra = initial.projects
        .filter((p) => !candidateIds.has(p.id))
        .map((p) => ({
          projectId: p.id,
          projectCode: p.code,
          projectName: p.name,
          organizationName: p.organizationName,
          proposedBudget: p.proposedBudget,
          councilName: null,
          councilId: null,
          councilLockStatus: null,
          averageScore: p.averageScore,
          submittedCount: 0,
          totalMembers: 0,
          alreadyDecided: false,
        }) as SubmissionCandidate);
      return [...extra, ...props.candidates];
    }
    return props.candidates;
  }, [props.candidates, isCreate, initial]);

  const toggleSelect = (id: string) => {
    if (!canEdit) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalProposed = React.useMemo(() => {
    let sum = 0;
    for (const id of selectedIds) {
      const c = candidates.find((x) => x.projectId === id);
      if (c?.proposedBudget) sum += c.proposedBudget;
    }
    return sum;
  }, [selectedIds, candidates]);

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 đề án');
      return;
    }
    if (contentHtml.replace(/<[^>]+>/g, '').trim().length < 50) {
      toast.error('Nội dung tờ trình quá ngắn (tối thiểu 50 ký tự)');
      return;
    }
    try {
      setBusy('save');
      const r = await saveSubmission({
        id: initial?.id ?? null,
        draftNumber: draftNumber.trim() || null,
        projectIds: Array.from(selectedIds),
        contentHtml,
      });
      toast.success(
        isCreate
          ? 'Đã tạo tờ trình mới — chuyển tới trang chi tiết'
          : `Đã lưu tờ trình (${r.projectCount} đề án)`,
      );
      if (isCreate) {
        router.push(`/phe-duyet/${r.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setBusy(null);
    }
  };

  const handleFinalize = async () => {
    if (!initial) return;
    const ok = await confirm({
      title: 'Chốt tờ trình gửi Bộ',
      description:
        'Sau khi chốt, tờ trình sẽ được khóa và sẵn sàng để nhập quyết định phê duyệt từ Bộ. Bạn có chắc?',
      confirmLabel: 'Chốt và gửi',
    });
    if (!ok) return;
    try {
      setBusy('finalize');
      // Save first then finalize
      await saveSubmission({
        id: initial.id,
        draftNumber: draftNumber.trim() || null,
        projectIds: Array.from(selectedIds),
        contentHtml,
      });
      await finalizeSubmission(initial.id);
      toast.success('Đã chốt tờ trình');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chốt thất bại');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Project picker */}
        <section className="rounded-md border border-slate-200 bg-white lg:col-span-7">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Danh sách đề án thẩm định
              </h3>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                Đã chọn {selectedIds.size}/{candidates.length}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Sắp xếp theo điểm trung bình giảm dần. Tích chọn các đề án cần
              đưa vào tờ trình.
            </p>
          </header>
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">Chọn</TableHead>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Mã / Đề án</TableHead>
                  <TableHead className="text-right">Điểm TB</TableHead>
                  <TableHead className="text-right">Dự toán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Không có đề án nào ở trạng thái Đang thẩm định.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((c, idx) => {
                    const checked = selectedIds.has(c.projectId);
                    return (
                      <TableRow
                        key={c.projectId}
                        className={
                          c.alreadyDecided
                            ? 'bg-slate-50/60 opacity-70'
                            : checked
                              ? 'bg-blue-50/50'
                              : undefined
                        }
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSelect(c.projectId)}
                            aria-label={`Chọn ${c.projectCode}`}
                            disabled={!canEdit || c.alreadyDecided}
                          />
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-mono text-xs text-slate-500">
                                {c.projectCode}
                              </div>
                              <div className="text-sm text-slate-900">
                                {c.projectName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {c.organizationName}
                              </div>
                            </div>
                            {c.alreadyDecided ? (
                              <Badge
                                variant="outline"
                                className="border-slate-300 bg-slate-100 text-xs text-slate-600"
                              >
                                Đã có QĐ
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.averageScore !== null ? (
                            <span
                              className={`text-base font-semibold tabular-nums ${
                                c.averageScore >= 70
                                  ? 'text-emerald-700'
                                  : c.averageScore >= 50
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {c.averageScore.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                          <div className="text-xs text-slate-500">
                            {c.submittedCount}/{c.totalMembers} phiếu
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {c.proposedBudget
                            ? formatVNDCompact(c.proposedBudget)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-600">
              Tổng dự toán đã chọn:
            </span>
            <strong className="text-base text-slate-900 tabular-nums">
              {formatVNDCompact(totalProposed)}
            </strong>
          </footer>
        </section>

        {/* Body editor */}
        <section className="lg:col-span-5">
          <div className="rounded-md border border-slate-200 bg-white">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Nội dung tờ trình
              </h3>
            </header>
            <div className="space-y-3 p-4">
              <div>
                <Label htmlFor="draft-number">Số tờ trình (tùy chọn)</Label>
                <Input
                  id="draft-number"
                  value={draftNumber}
                  onChange={(e) => setDraftNumber(e.target.value)}
                  placeholder="VD: 12/TTr-XTTM"
                  disabled={!canEdit}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nội dung</Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={contentHtml}
                    onChange={setContentHtml}
                    minHeight={320}
                    readOnly={!canEdit}
                    placeholder="Soạn nội dung tờ trình..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Action footer */}
      {canEdit ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {selectedIds.size === 0 ? (
              <>
                <AlertTriangle
                  className="h-4 w-4 text-amber-500"
                  aria-hidden="true"
                />
                Vui lòng chọn ít nhất 1 đề án
              </>
            ) : (
              <>
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />
                {selectedIds.size} đề án sẽ được đưa vào tờ trình
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isCreate && initial ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/pdf/submission/${initial.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="mr-1 h-3 w-3" aria-hidden="true" />
                  Xem PDF
                </a>
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={busy !== null}
            >
              {busy === 'save' ? (
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
                  {isCreate ? 'Tạo tờ trình' : 'Lưu nháp'}
                </>
              )}
            </Button>
            {!isCreate && initial && initial.status === 'DRAFT' ? (
              <Button onClick={handleFinalize} disabled={busy !== null}>
                {busy === 'finalize' ? (
                  <>
                    <Loader2
                      className="mr-1.5 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Đang chốt…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Chốt và gửi Bộ
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {isLocked
            ? 'Tờ trình đã có quyết định phê duyệt — không thể chỉnh sửa.'
            : 'Bạn không có quyền chỉnh sửa tờ trình này.'}
        </div>
      )}
      {confirmDialog}
    </>
  );
}
