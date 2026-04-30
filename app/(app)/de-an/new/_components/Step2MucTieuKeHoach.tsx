'use client';

// Step 2 — Mục tiêu, nội dung, kế hoạch (PROJ-06).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore, getDefaultStep2 } from '../_lib/wizardStore';
import { Step2Schema } from '../_lib/schemas';
import type { StepHandle } from './ProjectWizardShell';

export const Step2MucTieuKeHoach = React.forwardRef<StepHandle, object>(
  function Step2MucTieuKeHoach(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step2);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const data = stored ?? getDefaultStep2();
          const parsed = Step2Schema.safeParse(data);
          if (!parsed.success) return false;
          setStepData('step2', data);
          return true;
        },
      }),
      [stored, setStepData],
    );

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 2: Mục tiêu, nội dung, kế hoạch
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Mô tả mục tiêu (rich text, tối thiểu 100 ký tự), nội dung
            (tối thiểu 200 ký tự), và lập bảng kế hoạch chi tiết.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Form bước 2 đang được hoàn thiện trong Task 3 của plan 05-02.
        </div>
      </div>
    );
  },
);

export default Step2MucTieuKeHoach;
