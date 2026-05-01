'use client';

// ProjectWizardShell — root client component cho /de-an/new wizard 6 bước.
// Plan 05-02 (PROJ-04..11).
//
// Pattern (mirror app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx):
// - Stepper visual top + autosave indicator right
// - useImperativeHandle on each Step exposes validateAndCommit(): Promise<boolean>
// - On "Tiếp tục" click, shell calls ref.current?.validateAndCommit(); if true → setStep+1
// - Step 6 (Xem lại) renders own action buttons (Lưu nháp / Nộp đề án)
// - Autosave debounce 2s on formData change → call saveDraftProject(server)
//   → setLastAutosaveAt + persist (auto via Zustand)
// - Stepper completed steps clickable to revisit
// - Hydration gate: <Skeleton /> until useProjectWizardHasHydrated() returns true
//
// Top bar buttons:
//   - "Sao chép từ đề án cũ" (visible nếu user có ≥1 previousProject) — opens Dialog
//   - "Lưu nháp" — manual trigger (autosave còn auto)

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Copy,
  Save,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/shared/program-cycle';
import type { StepperStep } from '@/components/shared/program-cycle';
import { formatDateTime } from '@/lib/format';

import {
  useProjectWizardStore,
  useProjectWizardHasHydrated,
  setUserScopeKey,
  getDefaultStep1,
  getDefaultStep2,
  getDefaultStep3,
  getDefaultStep4,
} from '../_lib/wizardStore';
import type {
  ContactOption,
  PreviousProjectOption,
  WizardCatalogData,
} from '../_lib/types';
import {
  saveDraftProject,
  type SaveDraftResult,
} from '@/app/(app)/de-an/_actions/save-draft';
import type { SaveDraftInput } from '@/app/(app)/de-an/_actions/types';

import { Step1ThongTinChung } from './Step1ThongTinChung';
import { Step2MucTieuKeHoach } from './Step2MucTieuKeHoach';
import { Step3DuToan } from './Step3DuToan';
import { Step4ChuNhiem } from './Step4ChuNhiem';
import { Step5TaiLieu } from './Step5TaiLieu';
import { Step6XemLai } from './Step6XemLai';
import { CopyFromPreviousDialog } from './CopyFromPreviousDialog';

export interface StepHandle {
  validateAndCommit: () => Promise<boolean>;
}

const STEPS: StepperStep[] = [
  { id: '1', label: 'Thông tin chung', description: 'Tên + loại + ngành' },
  { id: '2', label: 'Mục tiêu, kế hoạch', description: 'Nội dung + kế hoạch' },
  { id: '3', label: 'Dự toán kinh phí', description: 'Bảng dự toán' },
  { id: '4', label: 'Chủ nhiệm đề án', description: 'Đầu mối phụ trách' },
  { id: '5', label: 'Tài liệu đính kèm', description: 'Hồ sơ minh chứng' },
  { id: '6', label: 'Xem lại & nộp', description: 'Kiểm tra & cam đoan' },
];

const TOTAL_STEPS = STEPS.length;
const AUTOSAVE_DEBOUNCE_MS = 2000;

export type ProjectWizardShellProps = {
  userId: string;
  organizationId: string;
  programCycleId: string;
  year: number;
  catalogs: WizardCatalogData;
  contacts: ContactOption[];
  previousProjects: PreviousProjectOption[];
};

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

export function ProjectWizardShell({
  userId,
  programCycleId,
  year,
  catalogs,
  contacts,
  previousProjects,
}: ProjectWizardShellProps) {
  const router = useRouter();

  // Apply userId-scoped persist key on mount
  React.useEffect(() => {
    setUserScopeKey(userId);
  }, [userId]);

  const hasHydrated = useProjectWizardHasHydrated();
  const currentStep = useProjectWizardStore((s) => s.currentStep);
  const setStep = useProjectWizardStore((s) => s.setStep);
  const completedSteps = useProjectWizardStore((s) => s.completedSteps);
  const markCompleted = useProjectWizardStore((s) => s.markCompleted);
  const formData = useProjectWizardStore((s) => s.formData);
  const lastAutosaveAt = useProjectWizardStore((s) => s.lastAutosaveAt);
  const setLastAutosaveAt = useProjectWizardStore((s) => s.setLastAutosaveAt);
  const isSubmitting = useProjectWizardStore((s) => s.isSubmitting);
  const savedDraftProjectId = useProjectWizardStore(
    (s) => s.savedDraftProjectId,
  );
  const setSavedDraftProjectId = useProjectWizardStore(
    (s) => s.setSavedDraftProjectId,
  );

  const stepRef = React.useRef<StepHandle | null>(null);
  const [autosaveBusy, setAutosaveBusy] = React.useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false);
  const [manualSavePending, setManualSavePending] = React.useState(false);

  // Build SaveDraftInput from current store formData
  const buildDraftInput = React.useCallback(
    (overrideProjectId?: string | null): SaveDraftInput | null => {
      const step1 = formData.step1 ?? getDefaultStep1();
      const step2 = formData.step2 ?? getDefaultStep2();
      const step3 = formData.step3 ?? getDefaultStep3();
      const step4 = formData.step4 ?? getDefaultStep4();

      // Don't autosave until name + kind are present (otherwise server rejects)
      if (
        !step1.name ||
        step1.name.trim().length < 1 ||
        !step1.kind ||
        step1.kind.trim().length < 1
      ) {
        return null;
      }

      const projectId =
        overrideProjectId !== undefined
          ? overrideProjectId ?? undefined
          : savedDraftProjectId ?? undefined;

      return {
        projectId,
        name: step1.name,
        kind: step1.kind,
        year,
        programCycleId,
        generalInfo: {
          industrySectorIds: step1.industrySectorIds,
          marketIds: step1.marketIds,
          countryIds: step1.countryIds,
          promotionTypeIds: step1.promotionTypeIds,
          timeRange: step1.timeRange ?? null,
          isTwoYear: step1.isTwoYear,
          nextYear: step1.nextYear ?? null,
        },
        objectives: {
          objective: step2.objective,
          content: step2.content,
        },
        plan: {
          rows: step2.planRows.map((r) => ({
            id: r.id,
            task: r.task,
            deliverable: r.deliverable,
            dueDate: r.dueDate ?? null,
            owner: r.owner,
          })),
        },
        budget: {
          rows: step3.rows.map((r) => ({
            id: r.id,
            item: r.item,
            unit: r.unit,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            amount: r.amount,
            source: r.source,
            note: r.note,
          })),
          totalState: step3.totalState,
          totalSelf: step3.totalSelf,
          total: step3.total,
        },
        pmContactId: step4.pmContactId ?? null,
      };
    },
    [formData, savedDraftProjectId, year, programCycleId],
  );

  const performAutosave = React.useCallback(
    async (silent = true): Promise<SaveDraftResult | null> => {
      const input = buildDraftInput();
      if (!input) return null;
      try {
        setAutosaveBusy(true);
        const result = await saveDraftProject(input);
        setSavedDraftProjectId(result.id);
        setLastAutosaveAt(new Date());
        return result;
      } catch (err) {
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Không thể lưu nháp';
          toast.error(msg);
        }
        return null;
      } finally {
        setAutosaveBusy(false);
      }
    },
    [buildDraftInput, setLastAutosaveAt, setSavedDraftProjectId],
  );

  // Autosave debounce 2s on formData change
  const lastFormDataKey = React.useRef<string>('');
  React.useEffect(() => {
    if (!hasHydrated) return;
    const key = JSON.stringify(formData);
    if (key === lastFormDataKey.current) return;
    lastFormDataKey.current = key;
    if (key === '{}') return; // skip initial empty state

    const handle = setTimeout(() => {
      void performAutosave(true);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [formData, hasHydrated, performAutosave]);

  const handleManualSave = async () => {
    setManualSavePending(true);
    try {
      const result = await performAutosave(false);
      if (result) {
        toast.success('Đã lưu nháp đề án');
      } else {
        toast.warning(
          'Vui lòng nhập tối thiểu tên đề án và loại đề án trước khi lưu nháp',
        );
      }
    } finally {
      setManualSavePending(false);
    }
  };

  const handleNext = async () => {
    const handle = stepRef.current;
    if (!handle) return;
    const ok = await handle.validateAndCommit();
    if (ok) {
      markCompleted(currentStep);
      if (currentStep < TOTAL_STEPS - 1) {
        setStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const handleStepClick = (idx: number) => {
    // Allow navigation to completed steps OR to the next step if all prior completed
    if (idx < currentStep || completedSteps.includes(idx)) {
      setStep(idx);
    }
  };

  if (!hasHydrated) {
    return <ShellSkeleton />;
  }

  // For Stepper visual: currentIndex is the highest "reachable" step =
  // max(currentStep, max(completedSteps)+1). We render currentStep though.
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const autosaveLabel = autosaveBusy
    ? 'Đang tự động lưu...'
    : lastAutosaveAt && lastAutosaveAt.length > 0
      ? `Đã lưu lúc ${formatDateTime(new Date(lastAutosaveAt))}`
      : 'Tự động lưu nháp khi bạn nhập dữ liệu';

  return (
    <div className="space-y-6">
      {/* Top toolbar: copy + manual save */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {autosaveBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check
              className="h-3.5 w-3.5 text-emerald-600"
              aria-hidden="true"
            />
          )}
          <span>{autosaveLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {previousProjects.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopyDialogOpen(true)}
              disabled={isSubmitting}
            >
              <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Sao chép từ đề án cũ
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={manualSavePending || isSubmitting}
          >
            {manualSavePending ? (
              <Loader2
                className="mr-1.5 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            Lưu nháp
          </Button>
        </div>
      </div>

      {/* Stepper + step content */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <Stepper
          steps={STEPS}
          currentIndex={currentStep}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {currentStep === 0 ? (
          <Step1ThongTinChung ref={stepRef} catalogs={catalogs} year={year} />
        ) : currentStep === 1 ? (
          <Step2MucTieuKeHoach ref={stepRef} />
        ) : currentStep === 2 ? (
          <Step3DuToan ref={stepRef} />
        ) : currentStep === 3 ? (
          <Step4ChuNhiem ref={stepRef} contacts={contacts} />
        ) : currentStep === 4 ? (
          <Step5TaiLieu
            ref={stepRef}
            projectId={savedDraftProjectId}
            onAutosaveBeforeUpload={async () => {
              const r = await performAutosave(false);
              return r?.id ?? savedDraftProjectId ?? null;
            }}
          />
        ) : (
          <Step6XemLai
            catalogs={catalogs}
            contacts={contacts}
            year={year}
            programCycleId={programCycleId}
            onSubmitted={(projectId) => {
              router.push(`/de-an/${projectId}`);
            }}
          />
        )}
      </div>

      {/* Footer nav */}
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
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            Tiếp tục
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-start">
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

      {previousProjects.length > 0 ? (
        <CopyFromPreviousDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          previousProjects={previousProjects}
        />
      ) : null}
    </div>
  );
}

export default ProjectWizardShell;
