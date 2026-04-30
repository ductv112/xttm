'use client';

// Step 3 — Cấu hình tiêu chí (CYCLE-03) STUB — full impl arrives in Task 3.

import * as React from 'react';

import type { ScoringCriterionOption } from '../_lib/types';
import type { StepHandle } from './CycleWizardShell';

export type Step3Props = {
  scoringCriteria: ScoringCriterionOption[];
};

export const Step3CauHinhTieuChi = React.forwardRef<StepHandle, Step3Props>(
  function Step3CauHinhTieuChi(_props, ref) {
    React.useImperativeHandle(ref, () => ({
      async validateAndCommit() {
        return true;
      },
    }));
    return (
      <div className="text-sm text-slate-600">
        Bước 3 sẽ được hoàn thiện ở task tiếp theo.
      </div>
    );
  },
);
