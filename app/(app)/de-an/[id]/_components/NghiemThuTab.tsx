'use client';

// NghiemThuTab — Phase 9 Plan 09-01 Task 2.
// Tab "Nghiệm thu" — BQL lập biên bản nghiệm thu sau khi báo cáo APPROVED.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileWarning,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  createAcceptanceRecord,
  uploadScannedRecord,
  finalizeAcceptance,
  liquidateContract,
  type AcceptanceSummary,
} from '../_actions/acceptance-actions';
import {
  ACCEPTANCE_RESULT_LABELS,
  ACCEPTANCE_RESULT_BADGE,
  type AcceptanceResult,
} from '@/lib/workflows/acceptance';
import { formatDate, formatDateTime } from '@/lib/format';
import type { ProjectDetail } from '../../_actions/get-detail';
import type { ProjectReportSummary } from '../_actions/report-actions';

const MOCK_SCAN_URL = '/mock-files/hop-dong-mau.pdf';

export function NghiemThuTab({
  project,
  report,
  initialAcceptance,
  isOwner: _isOwner,
  canManage,
}: {
  project: ProjectDetail;
  report: ProjectReportSummary | null;
  initialAcceptance: AcceptanceSummary | null;
  isOwner: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [recordDate, setRecordDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [result, setResult] = React.useState<AcceptanceResult>('PASS');
  const [comments, setComments] = React.useState('');
  const [recordNumber, setRecordNumber] = React.useState('');

  const acceptance = initialAcceptance;
  const reportApproved = report?.status === 'APPROVED';

  async function handleCreate() {
    if (!report) {
      toast.error('Cần có báo cáo đã duyệt trước');
      return;
    }
    setBusy(true);
    try {
      const res = await createAcceptanceRecord({
        projectId: project.id,
        reportId: report.id,
        recordNumber: recordNumber.trim() || undefined,
        recordDate: new Date(recordDate),
        result,
        comments: comments.trim() || undefined,
      });
      if (res.ok) {
        toast.success(`Đã lập biên bản ${res.data.recordNumber}`);
        router.refresh();
      } else {
        toast.error('Lập biên bản thất bại', { description: res.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadScan() {
    if (!acceptance) return;
    setBusy(true);
    try {
      // POC: dùng mock file URL
      const res = await uploadScannedRecord(acceptance.id, MOCK_SCAN_URL);
      if (res.ok) {
        toast.success('Đã upload bản scan biên bản');
        router.refresh();
      } else {
        toast.error('Upload thất bại', { description: res.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalize() {
    if (!acceptance) return;
    if (
      !window.confirm(
        'Sau khi chốt nghiệm thu, đề án sẽ chuyển trạng thái COMPLETED. Tiếp tục?',
      )
    )
      return;
    setBusy(true);
    try {
      const res = await finalizeAcceptance(acceptance.id);
      if (res.ok) {
        toast.success('Đã chốt nghiệm thu — đề án COMPLETED');
        router.refresh();
      } else {
        toast.error('Thao tác thất bại', { description: res.error });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLiquidate() {
    if (!acceptance) return;
    if (
      !window.confirm(
        'Thanh lý hợp đồng sẽ đóng vòng đời đề án + chuyển HĐ sang LIQUIDATED. Tiếp tục?',
      )
    )
      return;
    setBusy(true);
    try {
      const res = await liquidateContract(
        acceptance.id,
        new Date(),
        MOCK_SCAN_URL,
      );
      if (res.ok) {
        toast.success('Đã thanh lý hợp đồng');
        router.refresh();
      } else {
        toast.error('Thanh lý thất bại', { description: res.error });
      }
    } finally {
      setBusy(false);
    }
  }

  // No report yet
  if (!report) {
    return (
      <EmptyState
        icon="file-x"
        heading="Chưa có báo cáo kết quả"
        description="Đơn vị chủ trì cần nộp báo cáo kết quả trước khi BQL lập biên bản nghiệm thu."
      />
    );
  }

  if (!reportApproved) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Báo cáo chưa được duyệt
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Báo cáo đang ở trạng thái <strong>{report.status}</strong>. BQL
                cần duyệt báo cáo trước khi lập biên bản nghiệm thu.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <ClipboardCheck
            className="h-5 w-5 text-blue-600"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold text-slate-900">
            Nghiệm thu & Thanh lý
          </h2>
          {acceptance ? (
            <Badge
              variant="outline"
              className={ACCEPTANCE_RESULT_BADGE[acceptance.result]}
            >
              {ACCEPTANCE_RESULT_LABELS[acceptance.result]}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          BQL lập biên bản nghiệm thu, sinh PDF, in + ký tay → upload bản scan.
          Sau khi chốt nghiệm thu, có thể tiến hành thanh lý hợp đồng.
        </p>
      </header>

      {!acceptance ? (
        canManage ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              Lập biên bản nghiệm thu mới
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="record-number">
                  Số biên bản (để trống = tự động)
                </Label>
                <Input
                  id="record-number"
                  value={recordNumber}
                  onChange={(e) => setRecordNumber(e.target.value)}
                  placeholder="VD: 12/BB-NT-XTTM/2026"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="record-date">Ngày lập biên bản</Label>
                <Input
                  id="record-date"
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="record-result">Kết quả nghiệm thu</Label>
                <Select
                  value={result}
                  onValueChange={(v) => setResult(v as AcceptanceResult)}
                >
                  <SelectTrigger id="record-result" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASS">
                      Đạt yêu cầu (toàn bộ)
                    </SelectItem>
                    <SelectItem value="PARTIAL">
                      Đạt một phần
                    </SelectItem>
                    <SelectItem value="FAIL">Không đạt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="record-comments">Ghi chú nghiệm thu</Label>
                <Textarea
                  id="record-comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Đánh giá tổng thể, các nội dung đạt/chưa đạt, kiến nghị..."
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={busy}
              className="mt-4"
            >
              <FileText className="mr-1 h-4 w-4" aria-hidden="true" />
              Lập biên bản nghiệm thu
            </Button>
          </section>
        ) : (
          <EmptyState
            icon="file-x"
            heading="Chưa có biên bản nghiệm thu"
            description="BQL chưa lập biên bản nghiệm thu cho đề án này."
          />
        )
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Số biên bản</p>
              <p className="font-mono text-base font-semibold text-blue-700">
                {acceptance.recordNumber}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Ngày lập:{' '}
                <span className="font-medium text-slate-900">
                  {formatDate(acceptance.recordDate)}
                </span>
              </p>
              {acceptance.comments ? (
                <p className="mt-2 max-w-xl text-sm text-slate-700 whitespace-pre-wrap">
                  {acceptance.comments}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/pdf/acceptance/${acceptance.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                  Sinh biên bản PDF
                </a>
              </Button>
              {canManage && !acceptance.scannedFileUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadScan}
                  disabled={busy}
                >
                  <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
                  Upload bản scan đã ký
                </Button>
              ) : null}
              {acceptance.scannedFileUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={acceptance.scannedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-1 h-4 w-4" aria-hidden="true" />
                    Xem bản scan
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {canManage &&
          acceptance.scannedFileUrl &&
          project.status !== 'COMPLETED' ? (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <Button onClick={handleFinalize} disabled={busy}>
                <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                Chốt nghiệm thu — đóng đề án
              </Button>
            </div>
          ) : null}

          {/* Liquidation section */}
          {project.contractId && project.status === 'COMPLETED' ? (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="text-base font-semibold text-slate-900">
                Thanh lý hợp đồng
              </h3>
              {acceptance.liquidationDate ? (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 text-emerald-700"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Hợp đồng đã thanh lý
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        Thanh lý ngày{' '}
                        {formatDateTime(acceptance.liquidationDate)}
                      </p>
                      {acceptance.liquidationFileUrl ? (
                        <a
                          href={acceptance.liquidationFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-700 hover:underline"
                        >
                          Xem biên bản thanh lý
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                canManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a
                        href={`/api/pdf/liquidation/${acceptance.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        Sinh biên bản thanh lý PDF
                      </a>
                    </Button>
                    <Button
                      onClick={handleLiquidate}
                      disabled={busy}
                    >
                      <FileWarning
                        className="mr-1 h-4 w-4"
                        aria-hidden="true"
                      />
                      Xác nhận thanh lý HĐ
                    </Button>
                  </div>
                )
              )}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
