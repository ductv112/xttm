'use client';

// Step 3 — Dự toán kinh phí (PROJ-07).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore, getDefaultStep3 } from '../_lib/wizardStore';
import { Step3Schema } from '../_lib/schemas';
import type { StepHandle } from './ProjectWizardShell';

export const Step3DuToan = React.forwardRef<StepHandle, object>(
  function Step3DuToan(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step3);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const data = stored ?? getDefaultStep3();
          const parsed = Step3Schema.safeParse(data);
          if (!parsed.success) return false;
          setStepData('step3', data);
          return true;
        },
      }),
      [stored, setStepData],
    );

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 3: Dự toán kinh phí
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Lập bảng dự toán theo hạng mục — đơn vị tính, số lượng, đơn giá,
            thành tiền, nguồn vốn (Nhà nước / Đối ứng đơn vị). Tổng tự động
            cập nhật ở chân bảng.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Form bước 3 đang được hoàn thiện trong Task 3 của plan 05-02.
        </div>
      </div>
    );
  },
);

export default Step3DuToan;
