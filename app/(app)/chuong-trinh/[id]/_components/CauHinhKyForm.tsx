'use client';

// CauHinhKyForm — tab Cấu hình kỳ form edit. Plan 03-06 CYCLE-12 (cho phép sửa khi OPEN).
//
// Status gate:
//   - DRAFT / READY / OPEN_REGISTRATION → fields enabled
//   - CLOSED_REGISTRATION / EVALUATING / APPROVED / COMPLETED → all disabled với banner
//
// Submit flow:
//   1. updateCycle(input) — server action returns { significantChange }
//   2. If significantChange === true AND status === 'OPEN_REGISTRATION' → confirmDialog
//      "Gửi thông báo cho đơn vị mời?"
//   3. If user confirms → sendInvitation với template default
//   4. Toast feedback at each step

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/shared/MultiSelect';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CYCLE_STATUS_LABELS, type ProgramCycleStatus } from '@/lib/workflows/programCycle';
import { cn } from '@/lib/utils';

import { updateCycle, sendInvitation } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';

// Reused mostly the wizard schema shape, but all dates optional + add basic info fields
// (name + description + totalBudget editable inline — wizard Step1 covered these on creation).
const FormSchema = z
  .object({
    name: z
      .string({ message: 'Vui lòng nhập tên chu kỳ' })
      .trim()
      .min(5, 'Tên tối thiểu 5 ký tự')
      .max(200, 'Tên tối đa 200 ký tự'),
    description: z
      .string()
      .trim()
      .max(2000, 'Mô tả tối đa 2000 ký tự')
      .optional()
      .nullable(),
    totalBudget: z
      .number({ message: 'Ngân sách phải là số' })
      .nonnegative('Ngân sách không thể âm')
      .nullable()
      .optional(),
    registrationOpenAt: z.date().nullable().optional(),
    registrationCloseAt: z.date().nullable().optional(),
    supplementDeadline: z.date().nullable().optional(),
    evaluationStartAt: z.date().nullable().optional(),
    evaluationEndAt: z.date().nullable().optional(),
    approvalDeadline: z.date().nullable().optional(),
    scoringCriteriaIds: z.array(z.string().min(1)).min(1, 'Vui lòng chọn ít nhất 1 tiêu chí chấm điểm sơ bộ'),
    evaluationCriteriaIds: z.array(z.string().min(1)).min(1, 'Vui lòng chọn ít nhất 1 tiêu chí thẩm định'),
    invitedOrganizationIds: z.array(z.string().min(1)).min(1, 'Vui lòng chọn ít nhất 1 đơn vị mời'),
    emailTemplateIds: z.array(z.string().min(1)).default([]),
  })
  .superRefine((val, ctx) => {
    if (
      val.registrationOpenAt &&
      val.registrationCloseAt &&
      val.registrationCloseAt <= val.registrationOpenAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationCloseAt'],
        message: 'Hạn nộp phải sau ngày mở cổng',
      });
    }
    if (
      val.registrationCloseAt &&
      val.supplementDeadline &&
      val.supplementDeadline <= val.registrationCloseAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplementDeadline'],
        message: 'Hạn bổ sung phải sau hạn nộp',
      });
    }
  });

type FormInput = z.infer<typeof FormSchema>;

const EDITABLE_STATUSES: ReadonlyArray<ProgramCycleStatus> = [
  'DRAFT',
  'READY',
  'OPEN_REGISTRATION',
];

export type CauHinhKyFormProps = {
  cycle: CycleDetail;
  scoringCriteriaOptions: ReadonlyArray<{ id: string; name: string; weight: number }>;
  organizationOptions: ReadonlyArray<{ id: string; name: string }>;
  emailTemplateOptions: ReadonlyArray<{ id: string; name: string }>;
  canEdit: boolean;
};

function DateField({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Chọn ngày',
}: {
  id: string;
  value: Date | null | undefined;
  onChange: (d: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const display = value ? format(value, 'dd/MM/yyyy', { locale: vi }) : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

export function CauHinhKyForm({
  cycle,
  scoringCriteriaOptions,
  organizationOptions,
  emailTemplateOptions,
  canEdit,
}: CauHinhKyFormProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [submitting, setSubmitting] = React.useState(false);

  const isStatusEditable = EDITABLE_STATUSES.includes(cycle.status);
  const fieldsEnabled = canEdit && isStatusEditable;

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: cycle.name,
      description: cycle.description ?? '',
      totalBudget: cycle.totalBudget,
      registrationOpenAt: cycle.registrationOpenAt,
      registrationCloseAt: cycle.registrationCloseAt,
      supplementDeadline: cycle.supplementDeadline,
      evaluationStartAt: cycle.evaluationStartAt,
      evaluationEndAt: cycle.evaluationEndAt,
      approvalDeadline: cycle.approvalDeadline,
      scoringCriteriaIds: cycle.scoringCriteriaIds,
      evaluationCriteriaIds: cycle.evaluationCriteriaIds,
      invitedOrganizationIds: cycle.invitedOrganizationIds,
      emailTemplateIds: cycle.emailTemplateIds,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = form;

  const scoringOptions = React.useMemo(
    () =>
      scoringCriteriaOptions.map((c) => ({
        value: c.id,
        label: c.weight > 0 ? `${c.name} (trọng số ${c.weight}%)` : c.name,
      })),
    [scoringCriteriaOptions]
  );

  const orgOptions = React.useMemo(
    () => organizationOptions.map((o) => ({ value: o.id, label: o.name })),
    [organizationOptions]
  );

  const templateOptions = React.useMemo(
    () => emailTemplateOptions.map((t) => ({ value: t.id, label: t.name })),
    [emailTemplateOptions]
  );

  const onSubmit = async (data: FormInput) => {
    setSubmitting(true);
    try {
      const result = await updateCycle({
        id: cycle.id,
        name: data.name,
        description: data.description ?? null,
        totalBudget: data.totalBudget ?? null,
        registrationOpenAt: data.registrationOpenAt ?? null,
        registrationCloseAt: data.registrationCloseAt ?? null,
        supplementDeadline: data.supplementDeadline ?? null,
        evaluationStartAt: data.evaluationStartAt ?? null,
        evaluationEndAt: data.evaluationEndAt ?? null,
        approvalDeadline: data.approvalDeadline ?? null,
        scoringCriteriaIds: data.scoringCriteriaIds,
        evaluationCriteriaIds: data.evaluationCriteriaIds,
        invitedOrganizationIds: data.invitedOrganizationIds,
        emailTemplateIds: data.emailTemplateIds,
      });

      toast.success('Đã cập nhật cấu hình chu kỳ');
      reset(data);

      if (result.significantChange && cycle.status === 'OPEN_REGISTRATION') {
        const ok = await confirm({
          title: 'Gửi thông báo cho đơn vị mời?',
          description:
            'Bạn vừa thay đổi mốc thời gian hoặc tiêu chí. Gửi thông báo cho danh sách đơn vị đã được mời để cập nhật?',
          confirmLabel: 'Gửi thông báo',
        });
        if (ok) {
          try {
            const dispatchResult = await sendInvitation({
              cycleId: cycle.id,
              subject: `Cập nhật cấu hình chu kỳ năm ${cycle.year}`,
              contentHtml: `<p>Kính gửi {{tenDonVi}},</p><p>Ban quản lý CT XTTM xin thông báo cập nhật cấu hình ${cycle.name}. Đề nghị quý đơn vị xem chi tiết tại Cổng thông tin và phối hợp triển khai.</p><p>Trân trọng,</p><p>Cục Xúc tiến Thương mại</p>`,
              recipientOrgIds: data.invitedOrganizationIds,
              notificationType: 'CYCLE_INVITATION',
            });
            toast.success(
              `Đã gửi thông báo cho ${dispatchResult.dispatchCount} đơn vị`
            );
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Lỗi gửi thông báo');
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật cấu hình');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {dialog}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {!fieldsEnabled ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {!canEdit
              ? 'Bạn không có quyền chỉnh sửa cấu hình chu kỳ này.'
              : `Không thể chỉnh sửa khi chu kỳ đang ở trạng thái "${CYCLE_STATUS_LABELS[cycle.status]}". Cấu hình chỉ có thể chỉnh sửa khi chu kỳ ở trạng thái Bản nháp, Sẵn sàng hoặc Đang mở đăng ký.`}
          </div>
        ) : null}

        {/* Section 1: Thông tin chung */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Thông tin chung</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-name">
                Tên chu kỳ <span className="text-red-600">*</span>
              </Label>
              <Input
                id="cycle-name"
                {...register('name')}
                disabled={!fieldsEnabled}
                placeholder="VD: Chương trình XTTM Quốc gia 2026"
              />
              {errors.name ? (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-desc">Mô tả</Label>
              <Textarea
                id="cycle-desc"
                rows={3}
                {...register('description')}
                disabled={!fieldsEnabled}
                placeholder="Mô tả ngắn về chu kỳ"
              />
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-budget">Tổng kinh phí dự kiến (VNĐ)</Label>
              <Controller
                control={control}
                name="totalBudget"
                render={({ field }) => (
                  <Input
                    id="cycle-budget"
                    type="number"
                    inputMode="numeric"
                    disabled={!fieldsEnabled}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                  />
                )}
              />
              {errors.totalBudget ? (
                <p className="text-sm text-red-600">{errors.totalBudget.message}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Section 2: Mốc thời gian */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Mốc thời gian</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                ['registrationOpenAt', 'Ngày mở cổng nhận đăng ký'],
                ['registrationCloseAt', 'Hạn nộp đề án'],
                ['supplementDeadline', 'Hạn nộp bổ sung'],
                ['evaluationStartAt', 'Ngày bắt đầu thẩm định'],
                ['evaluationEndAt', 'Ngày kết thúc thẩm định'],
                ['approvalDeadline', 'Hạn phê duyệt'],
              ] as const
            ).map(([name, label]) => {
              const err = errors[name];
              return (
                <div key={name} className="space-y-2">
                  <Label htmlFor={`cfg-${name}`}>{label}</Label>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <DateField
                        id={`cfg-${name}`}
                        value={field.value as Date | null | undefined}
                        onChange={(d) => field.onChange(d)}
                        disabled={!fieldsEnabled}
                      />
                    )}
                  />
                  {err ? (
                    <p className="text-sm text-red-600">{err.message?.toString()}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Cấu hình tiêu chí */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Cấu hình tiêu chí</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cfg-scoring">
                Tiêu chí chấm điểm sơ bộ <span className="text-red-600">*</span>
              </Label>
              <Controller
                control={control}
                name="scoringCriteriaIds"
                render={({ field }) => (
                  <MultiSelect
                    id="cfg-scoring"
                    options={scoringOptions}
                    values={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn tiêu chí chấm điểm sơ bộ"
                    searchPlaceholder="Tìm tiêu chí..."
                    maxBadgesShown={5}
                    disabled={!fieldsEnabled}
                  />
                )}
              />
              {errors.scoringCriteriaIds ? (
                <p className="text-sm text-red-600">
                  {errors.scoringCriteriaIds.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-eval">
                Tiêu chí thẩm định <span className="text-red-600">*</span>
              </Label>
              <Controller
                control={control}
                name="evaluationCriteriaIds"
                render={({ field }) => (
                  <MultiSelect
                    id="cfg-eval"
                    options={scoringOptions}
                    values={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn tiêu chí thẩm định"
                    searchPlaceholder="Tìm tiêu chí..."
                    maxBadgesShown={5}
                    disabled={!fieldsEnabled}
                  />
                )}
              />
              {errors.evaluationCriteriaIds ? (
                <p className="text-sm text-red-600">
                  {errors.evaluationCriteriaIds.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Section 4: Đơn vị mời */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Đơn vị mời + mẫu công văn</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cfg-orgs">
                Đơn vị mời tham gia <span className="text-red-600">*</span>
              </Label>
              <Controller
                control={control}
                name="invitedOrganizationIds"
                render={({ field }) => (
                  <MultiSelect
                    id="cfg-orgs"
                    options={orgOptions}
                    values={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn đơn vị mời"
                    searchPlaceholder="Tìm theo tên đơn vị..."
                    maxBadgesShown={6}
                    disabled={!fieldsEnabled}
                  />
                )}
              />
              {errors.invitedOrganizationIds ? (
                <p className="text-sm text-red-600">
                  {errors.invitedOrganizationIds.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-tpl">Mẫu công văn / email mời</Label>
              <Controller
                control={control}
                name="emailTemplateIds"
                render={({ field }) => (
                  <MultiSelect
                    id="cfg-tpl"
                    options={templateOptions}
                    values={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Chọn mẫu (có thể bỏ trống)"
                    searchPlaceholder="Tìm mẫu..."
                    maxBadgesShown={3}
                    disabled={!fieldsEnabled}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {fieldsEnabled ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting || !isDirty}
              onClick={() => reset()}
            >
              Hủy thay đổi
            </Button>
            <Button type="submit" disabled={submitting || !isDirty}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        ) : null}
      </form>
    </>
  );
}

export default CauHinhKyForm;
