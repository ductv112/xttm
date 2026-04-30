'use client';

// Step 1 — Thông tin chung (PROJ-05).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore, getDefaultStep1 } from '../_lib/wizardStore';
import { Step1Schema } from '../_lib/schemas';
import type { WizardCatalogData } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

export type Step1Props = {
  catalogs: WizardCatalogData;
  year: number;
};

export const Step1ThongTinChung = React.forwardRef<StepHandle, Step1Props>(
  function Step1ThongTinChung(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step1);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const data = stored ?? getDefaultStep1();
          const parsed = Step1Schema.safeParse(data);
          if (!parsed.success) return false;
          setStepData('step1', data);
          return true;
        },
      }),
      [stored, setStepData],
    );

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 1: Thông tin chung
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Khai báo tên đề án, loại đề án, ngành hàng, thị trường và thời gian
            triển khai.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Form bước 1 đang được hoàn thiện trong Task 3 của plan 05-02.
        </div>
      </div>
    );
  },
);

export default Step1ThongTinChung;
