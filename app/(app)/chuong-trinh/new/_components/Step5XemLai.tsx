'use client';

// Step 5 — Xem lại & lưu (CYCLE-04 final submit) STUB — full impl arrives in Task 3.

import type {
  ScoringCriterionOption,
  OrganizationOption,
  EmailTemplateOption,
} from '../_lib/types';

export type Step5Props = {
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

export function Step5XemLai(_props: Step5Props) {
  return (
    <div className="text-sm text-slate-600">
      Bước 5 sẽ được hoàn thiện ở task tiếp theo.
    </div>
  );
}
