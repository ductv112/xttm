'use client';

// Wizard root client component — Stepper + dynamic step + nav buttons + autosave indicator.
// Plan 03-04 CYCLE-01..04 hero flow.
//
// Pattern:
// - useImperativeHandle on each Step exposes validateAndCommit(): Promise<boolean>
// - On "Tiếp tục" click, shell calls ref.current?.validateAndCommit(); if true → setStep+1
// - Step 5 (Xem lại) renders own action buttons (Lưu nháp / Tạo và chuyển sẵn sàng)
// - Autosave debounce 2s on formData change → setLastAutosaveAt + persist (auto via Zustand)
// - Stepper completed steps clickable to revisit (visual primitive's onStepClick)
// - Hydration gate: <Skeleton /> until useWizardHasHydrated() returns true

import * as React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/shared/program-cycle';
import type { StepperStep } from '@/components/shared/program-cycle';
import { formatDateTime } from '@/lib/format';

import { useWizardStore, useWizardHasHydrated } from '../_lib/wizardStore';
import type {
  ScoringCriterionOption,
  OrganizationOption,
  EmailTemplateOption,
} from '../_lib/types';

import { Step1ThongTinChung } from './Step1ThongTinChung';
import { Step2MocThoiGian } from './Step2MocThoiGian';
import { Step3CauHinhTieuChi } from './Step3CauHinhTieuChi';
import { Step4DonViMoi } from './Step4DonViMoi';
import { Step5XemLai } from './Step5XemLai';

export type CycleWizardShellProps = {
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

export interface StepHandle {
  validateAndCommit: () => Promise<boolean>;
}

const STEPS: StepperStep[] = [
  { id: '1', label: 'Thông tin chung', description: 'Tên + năm + ngân sách' },
  { id: '2', label: 'Mốc thời gian', description: '6 mốc nghiệp vụ' },
  { id: '3', label: 'Cấu hình tiêu chí', description: 'Sơ bộ + thẩm định' },
  { id: '4', label: 'Đơn vị mời', description: 'Danh sách + mẫu email' },
  { id: '5', label: 'Xem lại', description: 'Lưu nháp / chuyển sẵn sàng' },
];

const TOTAL_STEPS = STEPS.length;

function ShellSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function CycleWizardShell({
  scoringCriteria,
  organizations,
  emailTemplates,
}: CycleWizardShellProps) {
  const hasHydrated = useWizardHasHydrated();
  const currentStep = useWizardStore((s) => s.currentStep);
  const setStep = useWizardStore((s) => s.setStep);
  const formData = useWizardStore((s) => s.formData);
  const lastAutosaveAt = useWizardStore((s) => s.lastAutosaveAt);
  const setLastAutosaveAt = useWizardStore((s) => s.setLastAutosaveAt);
  const isSubmitting = useWizardStore((s) => s.isSubmitting);

  const stepRef = React.useRef<StepHandle | null>(null);

  // Autosave indicator: debounce 2s on formData change → bump lastAutosaveAt.
  // Persist itself happens automatically (Zustand persist on every set), this only
  // refreshes the timestamp shown to user.
  const lastFormDataKey = React.useRef<string>('');
  React.useEffect(() => {
    const key = JSON.stringify(formData);
    if (key === lastFormDataKey.current) return;
    lastFormDataKey.current = key;
    if (key === '{}') return; // skip initial empty
    const handle = setTimeout(() => {
      setLastAutosaveAt(new Date());
    }, 2000);
    return () => clearTimeout(handle);
  }, [formData, setLastAutosaveAt]);

  const handleNext = async () => {
    const handle = stepRef.current;
    if (!handle) return;
    const ok = await handle.validateAndCommit();
    if (ok && currentStep < TOTAL_STEPS - 1) {
      setStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const handleStepClick = (idx: number) => {
    // Stepper visual already restricts clickable to completed steps;
    // we keep that contract (only allow back-navigation to completed).
    if (idx < currentStep) {
      setStep(idx);
    }
  };

  if (!hasHydrated) {
    return <ShellSkeleton />;
  }

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const autosaveLabel =
    lastAutosaveAt && lastAutosaveAt.length > 0
      ? `Đã lưu nháp lúc ${formatDateTime(new Date(lastAutosaveAt))}`
      : 'Tự động lưu nháp khi bạn nhập dữ liệu';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Stepper
            steps={STEPS}
            currentIndex={currentStep}
            onStepClick={handleStepClick}
          />
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap pt-2 flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>{autosaveLabel}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {currentStep === 0 ? (
          <Step1ThongTinChung ref={stepRef} />
        ) : currentStep === 1 ? (
          <Step2MocThoiGian ref={stepRef} />
        ) : currentStep === 2 ? (
          <Step3CauHinhTieuChi
            ref={stepRef}
            scoringCriteria={scoringCriteria}
          />
        ) : currentStep === 3 ? (
          <Step4DonViMoi
            ref={stepRef}
            organizations={organizations}
            emailTemplates={emailTemplates}
          />
        ) : (
          <Step5XemLai
            scoringCriteria={scoringCriteria}
            organizations={organizations}
            emailTemplates={emailTemplates}
          />
        )}
      </div>

      {!isLastStep ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Quay lại
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            Tiếp tục
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Quay lại chỉnh sửa
          </Button>
        </div>
      )}
    </div>
  );
}
