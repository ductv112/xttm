'use client';

// Step 5 — Xem lại & lưu (CYCLE-04 final submit)
// 4 readonly summary sections + "Quay lại chỉnh sửa" links per section + 2 submit actions:
//   - "Lưu nháp" → createCycle (status DRAFT)
//   - "Tạo và chuyển sẵn sàng" → createCycle then transitionCycle DRAFT→READY
// Auto-redirect tới /chuong-trinh/[id] sau success + reset wizard + clear localStorage.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate, formatVND } from '@/lib/format';

import { useWizardStore } from '../_lib/wizardStore';
import { CycleWizardFullSchema } from '../_lib/schemas';
import type {
  ScoringCriterionOption,
  OrganizationOption,
  EmailTemplateOption,
} from '../_lib/types';

import {
  createCycle,
  transitionCycle,
} from '@/app/(app)/chuong-trinh/_actions';
import type { CreateCycleInput } from '@/app/(app)/chuong-trinh/_actions';

export type Step5Props = {
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-1 lg:gap-4 py-2 border-b border-slate-100 last:border-b-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 font-medium">
        {value ?? <span className="text-slate-400 italic">Chưa nhập</span>}
      </dd>
    </div>
  );
}

function SectionHeader({
  title,
  onEdit,
}: {
  title: string;
  onEdit: () => void;
}) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{title}</span>
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
      </CardTitle>
    </CardHeader>
  );
}

export function Step5XemLai({
  scoringCriteria,
  organizations,
  emailTemplates,
}: Step5Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const formData = useWizardStore((s) => s.formData);
  const setStep = useWizardStore((s) => s.setStep);
  const resetWizard = useWizardStore((s) => s.resetWizard);
  const setSubmitting = useWizardStore((s) => s.setSubmitting);

  const step1 = formData.step1;
  const step2 = formData.step2;
  const step3 = formData.step3;
  const step4 = formData.step4;

  // Lookup maps for display
  const criteriaById = React.useMemo(() => {
    const m = new Map<string, ScoringCriterionOption>();
    for (const c of scoringCriteria) m.set(c.id, c);
    return m;
  }, [scoringCriteria]);

  const orgById = React.useMemo(() => {
    const m = new Map<string, OrganizationOption>();
    for (const o of organizations) m.set(o.id, o);
    return m;
  }, [organizations]);

  const tmplById = React.useMemo(() => {
    const m = new Map<string, EmailTemplateOption>();
    for (const t of emailTemplates) m.set(t.id, t);
    return m;
  }, [emailTemplates]);

  // Disable "Tạo và chuyển sẵn sàng" if missing required dates for READY transition
  const canTransitionToReady =
    !!step2?.registrationOpenAt && !!step2?.registrationCloseAt;

  // Validate full schema before submit
  const validateAll = (): { ok: boolean; reason?: string } => {
    const result = CycleWizardFullSchema.safeParse({
      step1,
      step2,
      step3,
      step4,
    });
    if (result.success) return { ok: true };
    const first = result.error.issues[0];
    return {
      ok: false,
      reason:
        first?.message ??
        'Vui lòng hoàn thành đầy đủ các bước trước khi tạo chu kỳ',
    };
  };

  const buildCreateInput = (): CreateCycleInput => {
    return {
      year: step1!.year,
      name: step1!.name,
      description: step1?.description ?? null,
      totalBudget: step1?.totalBudget ?? null,
      registrationOpenAt: step2?.registrationOpenAt ?? null,
      registrationCloseAt: step2?.registrationCloseAt ?? null,
      supplementDeadline: step2?.supplementDeadline ?? null,
      evaluationStartAt: step2?.evaluationStartAt ?? null,
      evaluationEndAt: step2?.evaluationEndAt ?? null,
      approvalDeadline: step2?.approvalDeadline ?? null,
      scoringCriteriaIds: step3?.scoringCriteriaIds ?? [],
      evaluationCriteriaIds: step3?.evaluationCriteriaIds ?? [],
      emailTemplateIds: step4?.emailTemplateIds ?? [],
      invitedOrganizationIds: step4?.invitedOrganizationIds ?? [],
    };
  };

  const handleSubmit = (alsoTransitionToReady: boolean) => {
    const v = validateAll();
    if (!v.ok) {
      toast.error(v.reason ?? 'Dữ liệu chưa hợp lệ');
      return;
    }
    startTransition(async () => {
      try {
        setSubmitting(true);
        const created = await createCycle(buildCreateInput());
        toast.success(`Đã tạo chu kỳ năm ${created.year}`);

        if (alsoTransitionToReady) {
          try {
            await transitionCycle({ cycleId: created.id, target: 'READY' });
            toast.success('Đã chuyển trạng thái sang "Sẵn sàng"');
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : 'Không thể chuyển trạng thái sang Sẵn sàng';
            toast.warning(`Chu kỳ đã tạo nhưng chưa chuyển trạng thái: ${msg}`);
          }
        }

        resetWizard();
        router.push(`/chuong-trinh/${created.id}`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Không thể tạo chu kỳ';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    });
  };

  const renderCriteriaList = (ids: string[] = []) => {
    if (ids.length === 0)
      return <span className="text-slate-400 italic">Chưa chọn</span>;
    const names = ids
      .map((id) => criteriaById.get(id)?.name ?? id)
      .join(', ');
    return (
      <span>
        {ids.length} tiêu chí: <span className="text-slate-600">{names}</span>
      </span>
    );
  };

  const renderOrgList = (ids: string[] = []) => {
    if (ids.length === 0)
      return <span className="text-slate-400 italic">Chưa chọn</span>;
    const names = ids.map((id) => orgById.get(id)?.name ?? id).join(', ');
    return (
      <span>
        {ids.length} đơn vị: <span className="text-slate-600">{names}</span>
      </span>
    );
  };

  const renderTemplateList = (ids: string[] = []) => {
    if (ids.length === 0)
      return <span className="text-slate-400 italic">Bỏ trống</span>;
    const names = ids.map((id) => tmplById.get(id)?.name ?? id).join(', ');
    return (
      <span>
        {ids.length} mẫu: <span className="text-slate-600">{names}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Bước 5: Xem lại
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kiểm tra lại toàn bộ thông tin trước khi tạo chu kỳ. Bạn có thể quay lại
          chỉnh sửa từng bước.
        </p>
      </div>

      <Card>
        <SectionHeader
          title="1. Thông tin chung"
          onEdit={() => setStep(0)}
        />
        <CardContent>
          <dl>
            <FieldRow label="Năm chu kỳ" value={step1?.year} />
            <FieldRow label="Tên chu kỳ" value={step1?.name} />
            <FieldRow
              label="Mô tả"
              value={
                step1?.description && step1.description.trim().length > 0
                  ? step1.description
                  : null
              }
            />
            <FieldRow
              label="Ngân sách dự kiến"
              value={
                typeof step1?.totalBudget === 'number' && step1.totalBudget > 0
                  ? formatVND(step1.totalBudget)
                  : null
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader title="2. Mốc thời gian" onEdit={() => setStep(1)} />
        <CardContent>
          <dl>
            <FieldRow
              label="Ngày mở cổng"
              value={step2?.registrationOpenAt ? formatDate(step2.registrationOpenAt) : null}
            />
            <FieldRow
              label="Hạn nộp đề án"
              value={step2?.registrationCloseAt ? formatDate(step2.registrationCloseAt) : null}
            />
            <FieldRow
              label="Hạn nộp bổ sung"
              value={step2?.supplementDeadline ? formatDate(step2.supplementDeadline) : null}
            />
            <FieldRow
              label="Bắt đầu thẩm định"
              value={step2?.evaluationStartAt ? formatDate(step2.evaluationStartAt) : null}
            />
            <FieldRow
              label="Kết thúc thẩm định"
              value={step2?.evaluationEndAt ? formatDate(step2.evaluationEndAt) : null}
            />
            <FieldRow
              label="Hạn phê duyệt"
              value={step2?.approvalDeadline ? formatDate(step2.approvalDeadline) : null}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader title="3. Cấu hình tiêu chí" onEdit={() => setStep(2)} />
        <CardContent>
          <dl>
            <FieldRow
              label="Tiêu chí chấm điểm sơ bộ"
              value={renderCriteriaList(step3?.scoringCriteriaIds)}
            />
            <FieldRow
              label="Tiêu chí thẩm định"
              value={renderCriteriaList(step3?.evaluationCriteriaIds)}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader title="4. Đơn vị mời" onEdit={() => setStep(3)} />
        <CardContent>
          <dl>
            <FieldRow
              label="Đơn vị mời"
              value={renderOrgList(step4?.invitedOrganizationIds)}
            />
            <FieldRow
              label="Mẫu công văn / email"
              value={renderTemplateList(step4?.emailTemplateIds)}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={pending}
        >
          {pending ? 'Đang lưu...' : 'Lưu nháp'}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={pending || !canTransitionToReady}
          title={
            canTransitionToReady
              ? undefined
              : 'Bổ sung mốc mở cổng và hạn nộp ở Bước 2 để có thể chuyển sẵn sàng'
          }
        >
          {pending ? 'Đang lưu...' : 'Tạo và chuyển sẵn sàng'}
        </Button>
      </div>
    </div>
  );
}
