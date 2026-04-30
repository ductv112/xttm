'use client';

// Step 4 — Đơn vị mời (CYCLE-04) STUB — full impl arrives in Task 3.

import * as React from 'react';

import type { OrganizationOption, EmailTemplateOption } from '../_lib/types';
import type { StepHandle } from './CycleWizardShell';

export type Step4Props = {
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

export const Step4DonViMoi = React.forwardRef<StepHandle, Step4Props>(
  function Step4DonViMoi(_props, ref) {
    React.useImperativeHandle(ref, () => ({
      async validateAndCommit() {
        return true;
      },
    }));
    return (
      <div className="text-sm text-slate-600">
        Bước 4 sẽ được hoàn thiện ở task tiếp theo.
      </div>
    );
  },
);
