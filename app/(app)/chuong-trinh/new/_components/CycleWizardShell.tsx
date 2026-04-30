'use client';

// Wizard root client component — Stepper + dynamic step + nav buttons + autosave indicator.
// Plan 03-04 Task 2 — full implementation. Task 1 contains stub for tsc pass.
//
// NOTE: Full implementation arrives in Task 2 (this is a placeholder so page.tsx
// có thể import an toàn).

import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import type {
  ScoringCriterionOption,
  OrganizationOption,
  EmailTemplateOption,
} from '../_lib/types';

export type CycleWizardShellProps = {
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

export function CycleWizardShell(_props: CycleWizardShellProps) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
