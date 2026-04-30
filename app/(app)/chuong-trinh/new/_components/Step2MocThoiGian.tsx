'use client';

// Step 2 — Mốc thời gian (CYCLE-02)
// 6 date pickers với cross-validation (Zod superRefine):
//   registrationOpenAt < registrationCloseAt < supplementDeadline
//   registrationCloseAt < evaluationStartAt < evaluationEndAt < approvalDeadline
//
// Quick action: "Sử dụng mốc mặc định 30/5" prefill registrationCloseAt từ year (Step 1).

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useWizardStore } from '../_lib/wizardStore';
import { Step2Schema, type Step2Input } from '../_lib/schemas';
import type { StepHandle } from './CycleWizardShell';

type DateFieldName =
  | 'registrationOpenAt'
  | 'registrationCloseAt'
  | 'supplementDeadline'
  | 'evaluationStartAt'
  | 'evaluationEndAt'
  | 'approvalDeadline';

const FIELDS: Array<{
  name: DateFieldName;
  label: string;
  helper?: string;
}> = [
  {
    name: 'registrationOpenAt',
    label: 'Ngày mở cổng nhận đăng ký',
  },
  {
    name: 'registrationCloseAt',
    label: 'Hạn nộp đề án',
    helper: 'Theo quy định Bộ CT, hạn nộp mặc định là 30/5 hàng năm',
  },
  {
    name: 'supplementDeadline',
    label: 'Hạn nộp bổ sung',
  },
  {
    name: 'evaluationStartAt',
    label: 'Ngày bắt đầu thẩm định',
  },
  {
    name: 'evaluationEndAt',
    label: 'Ngày kết thúc thẩm định',
  },
  {
    name: 'approvalDeadline',
    label: 'Hạn phê duyệt',
  },
];

function DatePickerField({
  id,
  value,
  onChange,
  placeholder = 'Chọn ngày',
}: {
  id: string;
  value: Date | null | undefined;
  onChange: (d: Date | null) => void;
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
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
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

export const Step2MocThoiGian = React.forwardRef<StepHandle, object>(
  function Step2MocThoiGian(_props, ref) {
    const stored = useWizardStore((s) => s.formData.step2);
    const step1 = useWizardStore((s) => s.formData.step1);
    const setStepData = useWizardStore((s) => s.setStepData);

    const form = useForm<Step2Input>({
      resolver: zodResolver(Step2Schema),
      mode: 'onBlur',
      defaultValues: {
        registrationOpenAt: stored?.registrationOpenAt ?? null,
        registrationCloseAt: stored?.registrationCloseAt ?? null,
        supplementDeadline: stored?.supplementDeadline ?? null,
        evaluationStartAt: stored?.evaluationStartAt ?? null,
        evaluationEndAt: stored?.evaluationEndAt ?? null,
        approvalDeadline: stored?.approvalDeadline ?? null,
      },
    });

    const {
      control,
      handleSubmit,
      formState: { errors },
      setValue,
    } = form;

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          let valid = false;
          await handleSubmit(
            (data) => {
              setStepData('step2', {
                registrationOpenAt: data.registrationOpenAt ?? null,
                registrationCloseAt: data.registrationCloseAt ?? null,
                supplementDeadline: data.supplementDeadline ?? null,
                evaluationStartAt: data.evaluationStartAt ?? null,
                evaluationEndAt: data.evaluationEndAt ?? null,
                approvalDeadline: data.approvalDeadline ?? null,
              });
              valid = true;
            },
            () => {
              valid = false;
            },
          )();
          return valid;
        },
      }),
      [handleSubmit, setStepData],
    );

    const handleApplyDefault = () => {
      const year = step1?.year ?? new Date().getFullYear() + 1;
      // 30/5 = month index 4, day 30
      setValue('registrationCloseAt', new Date(year, 4, 30), {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    return (
      <form className="space-y-6" noValidate>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Bước 2: Mốc thời gian
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Cấu hình 6 mốc nghiệp vụ — có thể bỏ trống và bổ sung sau
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyDefault}
          >
            Sử dụng mốc mặc định 30/5
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {FIELDS.map((field) => {
            const err = errors[field.name];
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`step2-${field.name}`}>{field.label}</Label>
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: ctl }) => (
                    <DatePickerField
                      id={`step2-${field.name}`}
                      value={ctl.value as Date | null | undefined}
                      onChange={(d) => ctl.onChange(d)}
                    />
                  )}
                />
                {err ? (
                  <p className="text-sm text-red-600">
                    {err.message?.toString()}
                  </p>
                ) : field.helper ? (
                  <p className="text-xs text-slate-500">{field.helper}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </form>
    );
  },
);
