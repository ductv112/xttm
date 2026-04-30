'use client';

// Zustand store cho wizard state — single instance, persisted to localStorage.
// Plan 03-04 CYCLE-01..04 — restore on refresh, clear on submit thành công.
//
// Persistence key: 'program-cycle-wizard' (POC scope — không append userId vì
// localStorage là browser-scoped và POC dùng 1 device per role; production sẽ
// scope theo userId để tránh leak khi share device).
//
// Hydration gate: Next.js SSR render store với initial state, client-side
// rehydrate sau mount. useWizardHasHydrated() để gate render Skeleton tránh
// hydration mismatch.

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CycleWizardData } from './types';

type StepKey = keyof CycleWizardData;

type WizardState = {
  currentStep: number; // 0..4
  formData: Partial<CycleWizardData>;
  lastAutosaveAt: string | null; // ISO string (Date không persist gọn qua JSON)
  isSubmitting: boolean;
};

type WizardActions = {
  setStep: (step: number) => void;
  setStepData: <K extends StepKey>(key: K, data: CycleWizardData[K]) => void;
  setLastAutosaveAt: (at: Date | null) => void;
  setSubmitting: (b: boolean) => void;
  resetWizard: () => void;
};

const INITIAL: WizardState = {
  currentStep: 0,
  formData: {},
  lastAutosaveAt: null,
  isSubmitting: false,
};

// Step2 dates round-trip qua JSON: serialize dùng .toISOString(), deserialize
// detect ISO string → new Date().
const STEP2_DATE_FIELDS = [
  'registrationOpenAt',
  'registrationCloseAt',
  'supplementDeadline',
  'evaluationStartAt',
  'evaluationEndAt',
  'approvalDeadline',
] as const;

function reviveStep2Dates(formData: Partial<CycleWizardData>): Partial<CycleWizardData> {
  const step2 = formData?.step2;
  if (!step2) return formData;
  const revived: Record<string, unknown> = { ...step2 };
  for (const k of STEP2_DATE_FIELDS) {
    const v = (step2 as Record<string, unknown>)[k];
    if (typeof v === 'string') {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) {
        revived[k] = d;
      }
    }
  }
  return {
    ...formData,
    step2: revived as CycleWizardData['step2'],
  };
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...INITIAL,
      setStep: (step) =>
        set(() => ({ currentStep: Math.max(0, Math.min(4, step)) })),
      setStepData: (key, data) =>
        set((s) => ({
          formData: { ...s.formData, [key]: data },
        })),
      setLastAutosaveAt: (at) =>
        set(() => ({ lastAutosaveAt: at ? at.toISOString() : null })),
      setSubmitting: (b) => set(() => ({ isSubmitting: b })),
      resetWizard: () => set(() => ({ ...INITIAL })),
    }),
    {
      name: 'program-cycle-wizard',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR safe — no-op storage during server render
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Persist only the form state, not transient flags
      partialize: (s) =>
        ({
          currentStep: s.currentStep,
          formData: s.formData,
          lastAutosaveAt: s.lastAutosaveAt,
          isSubmitting: false,
        }) as WizardState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Revive Date objects in-place on the rehydrated state
          state.formData = reviveStep2Dates(state.formData ?? {});
        }
      },
    },
  ),
);

/**
 * Hook checking whether Zustand persist middleware has hydrated.
 *
 * Why: SSR render returns INITIAL state (currentStep=0, formData={}); client
 * rehydrates from localStorage AFTER first paint. Rendering wizard before
 * hydration would flash currentStep=0 even khi user đã ở step 3.
 *
 * Pattern: useEffect subscribe to onFinishHydration; return boolean.
 * Caller renders <Skeleton /> when false.
 */
export function useWizardHasHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState<boolean>(() =>
    useWizardStore.persist.hasHydrated(),
  );

  React.useEffect(() => {
    const unsubFinish = useWizardStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useWizardStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => {
      unsubFinish();
    };
  }, []);

  return hydrated;
}
