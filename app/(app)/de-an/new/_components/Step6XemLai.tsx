'use client';

// Step 6 — Xem lại & nộp đề án (PROJ-11 / PROJ-14).
// Readonly summary cho 5 bước trước + checkbox cam đoan + 2 actions:
//   - "Lưu nháp" (silent, route back to wizard step 1)
//   - "Nộp đề án" — calls saveDraftProject lần cuối (đảm bảo server sync) +
//     submitProject. Idempotency 5s window in server action.
// Vietnamese formal tone.

import * as React from 'react';
import { toast } from 'sonner';
import { Pencil, Send, Save, Loader2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate, formatVND } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';
import { ORG_PROFILE_CONTACT_ROLE_LABELS } from '@/lib/workflows/orgProfile';

import {
  useProjectWizardStore,
  getDefaultStep1,
  getDefaultStep2,
  getDefaultStep3,
  getDefaultStep4,
  getDefaultStep5,
} from '../_lib/wizardStore';
import type {
  ContactOption,
  Step5DocumentEntry,
  WizardCatalogData,
} from '../_lib/types';
import { saveDraftProject } from '@/app/(app)/de-an/_actions/save-draft';
import { submitProject } from '@/app/(app)/de-an/_actions/submit';

const QUARTER_LABELS: Record<string, string> = {
  Q1: 'Quý 1',
  Q2: 'Quý 2',
  Q3: 'Quý 3',
  Q4: 'Quý 4',
};

const DOCUMENT_CATEGORY_LABELS: Record<Step5DocumentEntry['category'], string> =
  {
    PLAN: 'Kế hoạch chi tiết',
    CAPABILITY: 'Hồ sơ năng lực',
    EVIDENCE: 'Bằng chứng kinh nghiệm',
    OTHER: 'Khác',
  };

export type Step6Props = {
  catalogs: WizardCatalogData;
  contacts: ContactOption[];
  year: number;
  programCycleId: string;
  onSubmitted: (projectId: string) => void;
};

function FieldRow({
  label,
  value,
  emptyText,
}: {
  label: string;
  value: React.ReactNode;
  emptyText?: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-1 lg:gap-4 py-2 border-b border-slate-100 last:border-b-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">
        {value ?? (
          <span className="text-slate-400 italic">
            {emptyText ?? 'Chưa nhập'}
          </span>
        )}
      </dd>
    </div>
  );
}

function SectionHeader({
  title,
  onEdit,
}: {
  title: string;
  onEdit?: () => void;
}) {
  return (
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center justify-between text-base">
        <span>{title}</span>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-800"
            onClick={onEdit}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Quay lại chỉnh sửa
          </Button>
        ) : null}
      </CardTitle>
    </CardHeader>
  );
}

function lookup<T extends { id: string; name: string }>(
  list: T[],
  ids: string[],
): string {
  if (ids.length === 0) return '';
  const map = new Map(list.map((x) => [x.id, x.name]));
  return ids.map((id) => map.get(id) ?? id).join(', ');
}

function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function Step6XemLai({
  catalogs,
  contacts,
  year,
  programCycleId,
  onSubmitted,
}: Step6Props) {
  const formData = useProjectWizardStore((s) => s.formData);
  const setStep = useProjectWizardStore((s) => s.setStep);
  const savedDraftProjectId = useProjectWizardStore(
    (s) => s.savedDraftProjectId,
  );
  const setSavedDraftProjectId = useProjectWizardStore(
    (s) => s.setSavedDraftProjectId,
  );
  const setSubmitting = useProjectWizardStore((s) => s.setSubmitting);
  const isSubmitting = useProjectWizardStore((s) => s.isSubmitting);
  const resetWizard = useProjectWizardStore((s) => s.resetWizard);

  const step1 = formData.step1 ?? getDefaultStep1();
  const step2 = formData.step2 ?? getDefaultStep2();
  const step3 = formData.step3 ?? getDefaultStep3();
  const step4 = formData.step4 ?? getDefaultStep4();
  const step5 = formData.step5 ?? getDefaultStep5();

  const [declared, setDeclared] = React.useState<boolean>(
    formData.step6?.declarationConfirmed ?? false,
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);

  const pmContact = step4.pmContactId
    ? contacts.find((c) => c.id === step4.pmContactId)
    : null;
  const kindLabel =
    PROJECT_KIND_LABELS[step1.kind] ??
    catalogs.projectKinds.find((k) => k.code === step1.kind)?.name ??
    step1.kind;

  const sectorNames = lookup(catalogs.industrySectors, step1.industrySectorIds);
  const marketNames = lookup(catalogs.markets, step1.marketIds);
  const countryNames = lookup(catalogs.countries, step1.countryIds);
  const promotionNames = lookup(
    catalogs.promotionTypes,
    step1.promotionTypeIds,
  );

  const timeRangeText = (() => {
    if (!step1.timeRange) return null;
    if (step1.timeRange.quarter) {
      const q = QUARTER_LABELS[step1.timeRange.quarter] ?? step1.timeRange.quarter;
      return `${q} năm ${year}`;
    }
    const start = step1.timeRange.start
      ? formatDate(new Date(step1.timeRange.start))
      : null;
    const end = step1.timeRange.end
      ? formatDate(new Date(step1.timeRange.end))
      : null;
    if (start && end) return `${start} → ${end}`;
    if (start) return `Từ ${start}`;
    if (end) return `Đến ${end}`;
    return null;
  })();

  const buildDraftInput = () => ({
    projectId: savedDraftProjectId ?? undefined,
    name: step1.name,
    kind: step1.kind,
    year,
    programCycleId,
    generalInfo: {
      industrySectorIds: step1.industrySectorIds,
      marketIds: step1.marketIds,
      countryIds: step1.countryIds,
      promotionTypeIds: step1.promotionTypeIds,
      timeRange: step1.timeRange ?? null,
      isTwoYear: step1.isTwoYear,
      nextYear: step1.nextYear ?? null,
    },
    objectives: { objective: step2.objective, content: step2.content },
    plan: {
      rows: step2.planRows.map((r) => ({
        id: r.id,
        task: r.task,
        deliverable: r.deliverable,
        dueDate: r.dueDate ?? null,
        owner: r.owner,
      })),
    },
    budget: {
      rows: step3.rows.map((r) => ({
        id: r.id,
        item: r.item,
        unit: r.unit,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        amount: r.amount,
        source: r.source,
        note: r.note,
      })),
      totalState: step3.totalState,
      totalSelf: step3.totalSelf,
      total: step3.total,
    },
    pmContactId: step4.pmContactId ?? null,
  });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const result = await saveDraftProject(buildDraftInput());
      setSavedDraftProjectId(result.id);
      toast.success(`Đã lưu nháp đề án ${result.code}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Không thể lưu nháp đề án';
      toast.error(msg);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Final sync pass
      const draft = await saveDraftProject(buildDraftInput());
      setSavedDraftProjectId(draft.id);
      // Submit
      const submitted = await submitProject(draft.id);
      toast.success(`Đã nộp đề án ${submitted.code}`);
      resetWizard();
      onSubmitted(submitted.id);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Không thể nộp đề án';
      toast.error(msg);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Bước 6: Xem lại & nộp đề án
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kiểm tra lại toàn bộ thông tin đã khai báo. Sau khi xác nhận cam đoan,
          đề án sẽ được gửi đến Ban quản lý để tiếp nhận và thẩm định.
        </p>
      </div>

      {/* Section 1 — Thông tin chung */}
      <Card>
        <SectionHeader title="1. Thông tin chung" onEdit={() => setStep(0)} />
        <CardContent>
          <dl>
            <FieldRow label="Tên đề án" value={step1.name || null} />
            <FieldRow label="Loại đề án" value={kindLabel || null} />
            <FieldRow label="Năm thực hiện" value={year} />
            <FieldRow
              label="Ngành hàng"
              value={sectorNames || null}
              emptyText="Chưa chọn"
            />
            <FieldRow
              label="Thị trường mục tiêu"
              value={marketNames || null}
              emptyText="Không có"
            />
            <FieldRow
              label="Quốc gia liên quan"
              value={countryNames || null}
              emptyText="Không có"
            />
            <FieldRow
              label="Loại hình XTTM"
              value={promotionNames || null}
              emptyText="Không có"
            />
            <FieldRow
              label="Thời gian triển khai"
              value={timeRangeText}
              emptyText="Chưa nhập"
            />
            <FieldRow
              label="Đề án 2 năm"
              value={
                step1.isTwoYear ? (
                  <Badge variant="secondary">
                    Có — tiếp nối sang năm {step1.nextYear ?? year + 1}
                  </Badge>
                ) : (
                  'Không'
                )
              }
            />
          </dl>
        </CardContent>
      </Card>

      {/* Section 2 — Mục tiêu / nội dung / kế hoạch */}
      <Card>
        <SectionHeader
          title="2. Mục tiêu, nội dung, kế hoạch"
          onEdit={() => setStep(1)}
        />
        <CardContent>
          <dl>
            <FieldRow
              label="Mục tiêu"
              value={
                stripHtml(step2.objective) ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: step2.objective }}
                  />
                ) : null
              }
              emptyText="Chưa khai báo"
            />
            <FieldRow
              label="Nội dung"
              value={
                stripHtml(step2.content) ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: step2.content }}
                  />
                ) : null
              }
              emptyText="Chưa khai báo"
            />
            <FieldRow
              label="Số hạng mục kế hoạch"
              value={
                step2.planRows.length > 0
                  ? `${step2.planRows.length} hạng mục`
                  : null
              }
              emptyText="Chưa có hạng mục"
            />
          </dl>
          {step2.planRows.length > 0 ? (
            <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">
                      Hạng mục
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium">
                      Sản phẩm
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium">Hạn</th>
                    <th className="px-2 py-1.5 text-left font-medium">
                      Phụ trách
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {step2.planRows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-2 py-1.5 text-slate-900">{r.task}</td>
                      <td className="px-2 py-1.5 text-slate-700">
                        {r.deliverable || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-700">
                        {r.dueDate ? formatDate(new Date(r.dueDate)) : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-700">
                        {r.owner || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Section 3 — Dự toán */}
      <Card>
        <SectionHeader
          title="3. Dự toán kinh phí"
          onEdit={() => setStep(2)}
        />
        <CardContent>
          <dl>
            <FieldRow
              label="Số hạng mục"
              value={
                step3.rows.length > 0
                  ? `${step3.rows.length} hạng mục`
                  : null
              }
              emptyText="Chưa có"
            />
            <FieldRow
              label="Ngân sách Nhà nước"
              value={formatVND(step3.totalState)}
            />
            <FieldRow
              label="Đối ứng đơn vị"
              value={formatVND(step3.totalSelf)}
            />
            <FieldRow
              label="Tổng dự toán"
              value={
                <span className="text-base font-semibold text-emerald-700">
                  {formatVND(step3.total)}
                </span>
              }
            />
            {typeof step3.proposedTotalReference === 'number' &&
            step3.proposedTotalReference > 0 ? (
              <FieldRow
                label="Ngân sách tham chiếu"
                value={formatVND(step3.proposedTotalReference)}
              />
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {/* Section 4 — Chủ nhiệm */}
      <Card>
        <SectionHeader
          title="4. Chủ nhiệm đề án"
          onEdit={() => setStep(3)}
        />
        <CardContent>
          {pmContact ? (
            <dl>
              <FieldRow
                label="Họ tên"
                value={`${pmContact.title ? pmContact.title + ' ' : ''}${pmContact.name}`}
              />
              <FieldRow
                label="Vai trò"
                value={
                  ORG_PROFILE_CONTACT_ROLE_LABELS[
                    pmContact.role as keyof typeof ORG_PROFILE_CONTACT_ROLE_LABELS
                  ] ?? pmContact.role
                }
              />
              <FieldRow label="Email" value={pmContact.email} />
              <FieldRow label="Điện thoại" value={pmContact.phone} />
            </dl>
          ) : (
            <p className="text-sm text-amber-600">
              <AlertTriangle
                className="mr-1 inline-block h-4 w-4"
                aria-hidden="true"
              />
              Chưa chọn chủ nhiệm đề án
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Tài liệu */}
      <Card>
        <SectionHeader
          title="5. Tài liệu đính kèm"
          onEdit={() => setStep(4)}
        />
        <CardContent>
          {step5.documents.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              Chưa có tài liệu nào được đính kèm.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {step5.documents.map((doc) => (
                <li
                  key={doc.attachmentId}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate text-slate-900">{doc.fileName}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {DOCUMENT_CATEGORY_LABELS[doc.category]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Cam đoan */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="step6-declaration"
            checked={declared}
            onCheckedChange={(v) => setDeclared(v === true)}
            disabled={isSubmitting}
            className="mt-0.5"
          />
          <label
            htmlFor="step6-declaration"
            className="text-sm font-medium text-amber-900 leading-relaxed cursor-pointer"
          >
            Tôi cam đoan các thông tin và tài liệu khai báo trong đề án này là
            đúng sự thật và chịu trách nhiệm hoàn toàn trước pháp luật.
          </label>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={savingDraft || isSubmitting}
        >
          {savingDraft ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          Lưu nháp
        </Button>
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!declared || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          Nộp đề án
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setConfirmOpen(open);
        }}
        title="Xác nhận nộp đề án"
        description="Sau khi nộp, đề án sẽ được Ban quản lý tiếp nhận và bạn không thể chỉnh sửa nội dung. Bạn vẫn có thể rút hồ sơ trước khi đề án được phân công cho chuyên viên."
        confirmLabel="Nộp đề án"
        onConfirm={handleSubmit}
        loading={isSubmitting}
      />
    </div>
  );
}

export default Step6XemLai;
