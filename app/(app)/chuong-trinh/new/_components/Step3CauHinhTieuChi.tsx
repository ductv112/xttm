'use client';

// Step 3 — Cấu hình tiêu chí (CYCLE-03)
// 2 MultiSelect: scoring (chấm điểm sơ bộ chuyên viên) + evaluation (hội đồng thẩm định)
// Cùng pool ScoringCriterion từ catalog tieu-chi-cham-diem (Phase 2 Plan 02-02 seed).

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/shared/MultiSelect';

import { useWizardStore } from '../_lib/wizardStore';
import { Step3Schema, type Step3Input } from '../_lib/schemas';
import type { ScoringCriterionOption } from '../_lib/types';
import type { StepHandle } from './CycleWizardShell';

export type Step3Props = {
  scoringCriteria: ScoringCriterionOption[];
};

function buildOptionLabel(c: ScoringCriterionOption): string {
  const weightLabel = c.weight > 0 ? ` (trọng số ${c.weight}%)` : '';
  const groupLabel = c.parentName ? ` · ${c.parentName}` : '';
  return `${c.name}${groupLabel}${weightLabel}`;
}

export const Step3CauHinhTieuChi = React.forwardRef<StepHandle, Step3Props>(
  function Step3CauHinhTieuChi({ scoringCriteria }, ref) {
    const stored = useWizardStore((s) => s.formData.step3);
    const setStepData = useWizardStore((s) => s.setStepData);

    const form = useForm<Step3Input>({
      resolver: zodResolver(Step3Schema),
      mode: 'onSubmit',
      defaultValues: {
        scoringCriteriaIds: stored?.scoringCriteriaIds ?? [],
        evaluationCriteriaIds: stored?.evaluationCriteriaIds ?? [],
      },
    });

    const {
      control,
      handleSubmit,
      formState: { errors },
    } = form;

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          let valid = false;
          await handleSubmit(
            (data) => {
              setStepData('step3', {
                scoringCriteriaIds: data.scoringCriteriaIds,
                evaluationCriteriaIds: data.evaluationCriteriaIds,
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

    const options = React.useMemo(
      () =>
        scoringCriteria.map((c) => ({
          value: c.id,
          label: buildOptionLabel(c),
        })),
      [scoringCriteria],
    );

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 3: Cấu hình tiêu chí
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn bộ tiêu chí áp dụng cho chu kỳ. Có thể tinh chỉnh trọng số sau ở
            tab Cấu hình kỳ.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="step3-scoring">
            Tiêu chí chấm điểm sơ bộ <span className="text-red-600">*</span>
          </Label>
          <Controller
            control={control}
            name="scoringCriteriaIds"
            render={({ field }) => (
              <MultiSelect
                id="step3-scoring"
                options={options}
                values={field.value}
                onChange={field.onChange}
                placeholder="Chọn tiêu chí chấm điểm sơ bộ"
                searchPlaceholder="Tìm tiêu chí..."
                maxBadgesShown={5}
              />
            )}
          />
          {errors.scoringCriteriaIds ? (
            <p className="text-sm text-red-600">
              {errors.scoringCriteriaIds.message?.toString()}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Áp dụng khi chuyên viên kiểm tra hồ sơ đầu vào của đề án
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="step3-evaluation">
            Tiêu chí thẩm định <span className="text-red-600">*</span>
          </Label>
          <Controller
            control={control}
            name="evaluationCriteriaIds"
            render={({ field }) => (
              <MultiSelect
                id="step3-evaluation"
                options={options}
                values={field.value}
                onChange={field.onChange}
                placeholder="Chọn tiêu chí thẩm định"
                searchPlaceholder="Tìm tiêu chí..."
                maxBadgesShown={5}
              />
            )}
          />
          {errors.evaluationCriteriaIds ? (
            <p className="text-sm text-red-600">
              {errors.evaluationCriteriaIds.message?.toString()}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Áp dụng cho hội đồng thẩm định khi chấm điểm chính thức
            </p>
          )}
        </div>
      </form>
    );
  },
);
