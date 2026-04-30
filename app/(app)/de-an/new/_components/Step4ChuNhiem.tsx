'use client';

// Step 4 — Chủ nhiệm đề án (PROJ-08).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore, getDefaultStep4 } from '../_lib/wizardStore';
import { Step4Schema } from '../_lib/schemas';
import type { ContactOption } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

export type Step4Props = {
  contacts: ContactOption[];
};

export const Step4ChuNhiem = React.forwardRef<StepHandle, Step4Props>(
  function Step4ChuNhiem(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step4);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const data = stored ?? getDefaultStep4();
          if (!data.pmContactId) return false;
          const parsed = Step4Schema.safeParse({
            pmContactId: data.pmContactId,
          });
          if (!parsed.success) return false;
          setStepData('step4', data);
          return true;
        },
      }),
      [stored, setStepData],
    );

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 4: Chủ nhiệm đề án
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn người chịu trách nhiệm chính từ danh sách đầu mối liên hệ của
            đơn vị. Có thể bổ sung đầu mối mới ngay tại đây.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Form bước 4 đang được hoàn thiện trong Task 3 của plan 05-02.
        </div>
      </div>
    );
  },
);

export default Step4ChuNhiem;
