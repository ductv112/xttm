'use client';

// BaoCaoTab — Phase 9 Plan 09-01 Task 2.
// Tab "Báo cáo" — đơn vị nhập chỉ tiêu định lượng + nội dung định tính, BQL review.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileBarChart,
  Save,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import {
  saveReportDraft,
  submitReport,
  reviewReport,
  returnReport,
  type ProjectReportSummary,
} from '../_actions/report-actions';
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_BADGE,
  DEFAULT_QUANTITATIVE_ROWS,
  type QuantitativeRow,
  type ReportStatus,
} from '@/lib/workflows/report';
import { formatDateTime } from '@/lib/format';
import type { ProjectDetail } from '../../_actions/get-detail';

function generateId(): string {
  return 'qr-' + Math.random().toString(36).slice(2, 10);
}

export function BaoCaoTab({
  project,
  initialReport,
  isOwner,
  canReview,
  reportSlaWarning,
}: {
  project: ProjectDetail;
  initialReport: ProjectReportSummary | null;
  isOwner: boolean;
  canReview: boolean;
  reportSlaWarning: { daysOverdue: number; endDate: Date } | null;
}) {
  const router = useRouter();
  const [report, setReport] = React.useState<ProjectReportSummary | null>(
    initialReport,
  );
  const [rows, setRows] = React.useState<QuantitativeRow[]>(
    initialReport?.quantitativeRows ?? DEFAULT_QUANTITATIVE_ROWS,
  );
  const [qualitativeHtml, setQualitativeHtml] = React.useState(
    initialReport?.qualitativeHtml ?? '',
  );
  const [attendingCount, setAttendingCount] = React.useState<string>(
    initialReport?.attendingCompaniesCount?.toString() ?? '',
  );
  const [busy, setBusy] = React.useState(false);
  const [reviewComment, setReviewComment] = React.useState('');

  const status: ReportStatus = report?.status ?? 'DRAFT';
  const isApproved = status === 'APPROVED';
  const canEdit =
    isOwner && (status === 'DRAFT' || status === 'RETURNED');
  const canSubmit =
    isOwner && (status === 'DRAFT' || status === 'RETURNED') && !!report;
  const canReviewNow = canReview && status === 'SUBMITTED';

  const eligibleStatus = ['IN_PROGRESS', 'COMPLETED', 'APPROVED'].includes(
    project.status,
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        name: '',
        unit: '',
        planned: null,
        actual: null,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, patch: Partial<QuantitativeRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  async function handleSaveDraft() {
    setBusy(true);
    try {
      const result = await saveReportDraft({
        projectId: project.id,
        reportId: report?.id,
        quantitativeRows: rows,
        qualitativeHtml,
        attendingCompaniesCount: attendingCount
          ? Number.parseInt(attendingCount, 10) || 0
          : null,
      });
      if (result.ok) {
        toast.success('Đã lưu nháp báo cáo');
        router.refresh();
      } else {
        toast.error('Lưu thất bại', { description: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!report) return;
    if (
      !window.confirm(
        'Sau khi nộp báo cáo, bạn không sửa được trừ khi BQL trả về. Tiếp tục?',
      )
    )
      return;

    setBusy(true);
    try {
      // Save before submit để đảm bảo có data mới nhất
      const save = await saveReportDraft({
        projectId: project.id,
        reportId: report.id,
        quantitativeRows: rows,
        qualitativeHtml,
        attendingCompaniesCount: attendingCount
          ? Number.parseInt(attendingCount, 10) || 0
          : null,
      });
      if (!save.ok) {
        toast.error('Lưu thất bại', { description: save.error });
        return;
      }
      const result = await submitReport(report.id);
      if (result.ok) {
        toast.success('Đã nộp báo cáo');
        router.refresh();
      } else {
        toast.error('Nộp thất bại', { description: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(action: 'approve' | 'return') {
    if (!report) return;
    if (action === 'return' && reviewComment.trim().length < 10) {
      toast.error('Vui lòng ghi rõ lý do trả bổ sung (≥10 ký tự)');
      return;
    }
    setBusy(true);
    try {
      const result =
        action === 'approve'
          ? await reviewReport(report.id, reviewComment.trim() || null)
          : await returnReport(report.id, reviewComment.trim());
      if (result.ok) {
        toast.success(
          action === 'approve' ? 'Đã duyệt báo cáo' : 'Đã trả bổ sung báo cáo',
        );
        setReviewComment('');
        router.refresh();
      } else {
        toast.error('Thao tác thất bại', { description: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!eligibleStatus) {
    return (
      <EmptyState
        icon="file-x"
        heading="Chưa thể nộp báo cáo"
        description="Báo cáo kết quả chỉ có thể tạo khi đề án đang triển khai hoặc đã hoàn thành."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart
              className="h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-slate-900">
              Báo cáo kết quả đề án
            </h2>
            <Badge
              variant="outline"
              className={REPORT_STATUS_BADGE[status]}
            >
              {REPORT_STATUS_LABELS[status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Đơn vị chủ trì khai báo chỉ tiêu định lượng + định tính kết quả
            triển khai. BQL sẽ review và có thể trả bổ sung nếu cần.
          </p>
        </div>
        {report?.submittedAt ? (
          <div className="text-xs text-slate-500">
            Đã nộp {formatDateTime(report.submittedAt)}
            {report.reviewedAt
              ? ` · Review ${formatDateTime(report.reviewedAt)}`
              : ''}
          </div>
        ) : null}
      </header>

      {reportSlaWarning && status !== 'APPROVED' && status !== 'SUBMITTED' ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Quá hạn nộp báo cáo {reportSlaWarning.daysOverdue} ngày
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Theo quy định SLA, đơn vị phải nộp báo cáo tổng hợp trong vòng
                15 ngày sau khi hoạt động kết thúc. Vui lòng hoàn thiện và nộp
                báo cáo sớm nhất có thể.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {report?.reviewComments && status === 'RETURNED' ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            BQL yêu cầu bổ sung:
          </p>
          <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">
            {report.reviewComments}
          </p>
        </div>
      ) : null}

      {report?.reviewComments && status === 'APPROVED' ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            BQL đã duyệt:
          </p>
          <p className="mt-1 text-sm text-emerald-800 whitespace-pre-wrap">
            {report.reviewComments}
          </p>
        </div>
      ) : null}

      {/* Chỉ tiêu định lượng */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">
          Chỉ tiêu định lượng
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Khai báo chỉ tiêu cụ thể, có thể đo lường (số doanh nghiệp tham gia,
          số HĐ ký, doanh thu...).
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-2 py-2 font-medium">Chỉ tiêu</th>
                <th className="px-2 py-2 font-medium">Đơn vị</th>
                <th className="px-2 py-2 text-right font-medium">Kế hoạch</th>
                <th className="px-2 py-2 text-right font-medium">Thực tế</th>
                <th className="px-2 py-2 font-medium">Ghi chú</th>
                {canEdit && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-2 py-2">
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.id, { name: e.target.value })
                      }
                      disabled={!canEdit}
                      placeholder="Tên chỉ tiêu"
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.id, { unit: e.target.value })
                      }
                      disabled={!canEdit}
                      placeholder="đơn vị"
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={row.planned ?? ''}
                      onChange={(e) =>
                        updateRow(row.id, {
                          planned: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      disabled={!canEdit}
                      className="h-8 w-28 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={row.actual ?? ''}
                      onChange={(e) =>
                        updateRow(row.id, {
                          actual: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      disabled={!canEdit}
                      className="h-8 w-28 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={row.note ?? ''}
                      onChange={(e) =>
                        updateRow(row.id, { note: e.target.value })
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        aria-label="Xóa dòng"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="mt-3"
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Thêm chỉ tiêu
          </Button>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="attending-count" className="text-sm">
              Tổng số doanh nghiệp tham gia thực tế
            </Label>
            <Input
              id="attending-count"
              type="number"
              value={attendingCount}
              onChange={(e) => setAttendingCount(e.target.value)}
              disabled={!canEdit}
              placeholder="VD: 25"
              className="mt-1"
            />
          </div>
        </div>
      </section>

      {/* Định tính */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">
          Đánh giá định tính
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Mô tả chi tiết quá trình triển khai, kết quả thu được, bài học kinh
          nghiệm, đề xuất cho kỳ tiếp theo.
        </p>
        <div className="mt-3">
          <RichTextEditor
            value={qualitativeHtml}
            onChange={setQualitativeHtml}
            placeholder="Nhập đánh giá định tính kết quả đề án..."
            minHeight={240}
            readOnly={!canEdit}
          />
        </div>
      </section>

      {/* Tài liệu đính kèm — placeholder demo */}
      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <h3 className="text-base font-semibold text-slate-900">
          Tài liệu đính kèm
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Upload danh sách DN tham gia (Excel), hình ảnh sự kiện, hồ sơ HĐ ký
          kết. Các tệp này được liệt kê tại tab "Tài liệu" của đề án.
        </p>
        {project.documents.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {project.documents.slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="text-slate-400">•</span>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  {d.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Chưa có tài liệu nào.
          </p>
        )}
      </section>

      {/* Action buttons */}
      {canEdit && !isApproved ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveDraft} disabled={busy} variant="outline">
            <Save className="mr-1 h-4 w-4" aria-hidden="true" />
            Lưu nháp
          </Button>
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={busy}>
              <Send className="mr-1 h-4 w-4" aria-hidden="true" />
              Nộp báo cáo
            </Button>
          )}
        </div>
      ) : null}

      {/* BQL review actions */}
      {canReviewNow ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-base font-semibold text-blue-900">
            Review báo cáo
          </h3>
          <p className="mt-1 text-xs text-blue-800">
            BQL có thể duyệt báo cáo hoặc trả về để đơn vị bổ sung.
          </p>
          <Textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Ghi chú review (bắt buộc nếu trả bổ sung)..."
            rows={3}
            className="mt-3 bg-white"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => handleReview('approve')}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
              Duyệt báo cáo
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('return')}
              disabled={busy}
            >
              <XCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              Trả bổ sung
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
