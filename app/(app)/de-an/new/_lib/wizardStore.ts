'use client';

// Zustand store cho project wizard 6 bước — single instance, persisted to localStorage.
// Plan 05-02. Pattern mirror app/(app)/chuong-trinh/new/_lib/wizardStore.ts với
// điều chỉnh:
//   - persistence key parameterized theo userId (project-wizard-{userId}) để tránh
//     leak giữa các tài khoản đang share cùng browser
//   - 6 step formData
//   - extra transient flags: copyFromProjectId (đề án nguồn khi user clone),
//     savedDraftProjectId (id của draft đã được lưu server-side cho autosave)
//
// Hydration gate: useProjectWizardHasHydrated() để gate render Skeleton tránh
// hydration mismatch (Next.js SSR vs localStorage rehydrate).

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type {
  ProjectWizardData,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step5DocumentEntry,
  Step6Data,
} from './types';

type StepKey = keyof ProjectWizardData;

type WizardState = {
  currentStep: number; // 0..5
  completedSteps: number[]; // ordered list of step indices that passed validation
  formData: Partial<ProjectWizardData>;
  /** Server-side draft id once first autosave succeeds. */
  savedDraftProjectId: string | null;
  /** When user clones from a previous-year project — drives "Đã sao chép" badge. */
  copyFromProjectId: string | null;
  lastAutosaveAt: string | null; // ISO string
  isSubmitting: boolean;
};

type WizardActions = {
  setStep: (step: number) => void;
  markCompleted: (stepIndex: number) => void;
  setStepData: <K extends StepKey>(
    key: K,
    data: ProjectWizardData[K],
  ) => void;
  /** Replace entire form data — used after copyFromPrevious server action. */
  replaceAll: (data: Partial<ProjectWizardData>) => void;
  setSavedDraftProjectId: (id: string | null) => void;
  setCopyFromProjectId: (id: string | null) => void;
  setLastAutosaveAt: (at: Date | null) => void;
  setSubmitting: (b: boolean) => void;
  /** Step 5 documents managed inline by uploadDocument server action. */
  addDocument: (doc: Step5DocumentEntry) => void;
  removeDocument: (attachmentId: string) => void;
  resetWizard: () => void;
};

const INITIAL: WizardState = {
  currentStep: 0,
  completedSteps: [],
  formData: {},
  savedDraftProjectId: null,
  copyFromProjectId: null,
  lastAutosaveAt: null,
  isSubmitting: false,
};

const TOTAL_STEPS = 6;

/**
 * Build a userId-scoped persist key. Falls back to "anonymous" when userId
 * unavailable at construction time (server render). Client useEffect should
 * never persist anonymous data because actions only fire after hydration.
 */
function buildPersistKey(userId: string | null | undefined): string {
  return `project-wizard-${userId && userId.length > 0 ? userId : 'anonymous'}`;
}

// Step 1 timeRange.start/end stored as ISO string — no Date round-trip issues.
// Step 2 plan rows dueDate also ISO. Step 5 uploadedAt ISO. No revival hooks needed.

export type ProjectWizardStore = WizardState & WizardActions;

/**
 * Factory — module-level cached singleton store, but the persist key is
 * resolved at first access via getCurrentUserId() bridge. Since the key is
 * static for a given render of the app (user only changes by full reload),
 * we accept a small simplification: read the key from a global window var
 * stamped by the page server-side render.
 */
declare global {
  interface Window {
    __PROJECT_WIZARD_USER_ID__?: string;
  }
}

export const useProjectWizardStore = create<ProjectWizardStore>()(
  persist(
    (set) => ({
      ...INITIAL,
      setStep: (step) =>
        set(() => ({
          currentStep: Math.max(0, Math.min(TOTAL_STEPS - 1, step)),
        })),
      markCompleted: (stepIndex) =>
        set((s) => {
          if (s.completedSteps.includes(stepIndex)) return s;
          return {
            completedSteps: [...s.completedSteps, stepIndex].sort((a, b) => a - b),
          };
        }),
      setStepData: (key, data) =>
        set((s) => ({
          formData: { ...s.formData, [key]: data },
        })),
      replaceAll: (data) =>
        set(() => ({
          formData: data,
          completedSteps: [],
          currentStep: 0,
        })),
      setSavedDraftProjectId: (id) =>
        set(() => ({ savedDraftProjectId: id })),
      setCopyFromProjectId: (id) =>
        set(() => ({ copyFromProjectId: id })),
      setLastAutosaveAt: (at) =>
        set(() => ({ lastAutosaveAt: at ? at.toISOString() : null })),
      setSubmitting: (b) => set(() => ({ isSubmitting: b })),
      addDocument: (doc) =>
        set((s) => {
          const existing =
            (s.formData.step5?.documents as
              | Step5Data['documents']
              | undefined) ?? [];
          const next: Step5Data = {
            documents: [...existing, doc],
          };
          return { formData: { ...s.formData, step5: next } };
        }),
      removeDocument: (attachmentId) =>
        set((s) => {
          const existing =
            (s.formData.step5?.documents as
              | Step5Data['documents']
              | undefined) ?? [];
          const next: Step5Data = {
            documents: existing.filter((d) => d.attachmentId !== attachmentId),
          };
          return { formData: { ...s.formData, step5: next } };
        }),
      resetWizard: () => set(() => ({ ...INITIAL })),
    }),
    {
      // name evaluated lazily at storage construction time on the client
      name: 'project-wizard-default',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        // Override the persist key after window mounted with userId-scoped key.
        // Zustand persist reads the `name` once at first storage call; rehydrate
        // is triggered manually on client mount via setUserScopeKey().
        return localStorage;
      }),
      partialize: (s) => ({
        currentStep: s.currentStep,
        completedSteps: s.completedSteps,
        formData: s.formData,
        savedDraftProjectId: s.savedDraftProjectId,
        copyFromProjectId: s.copyFromProjectId,
        lastAutosaveAt: s.lastAutosaveAt,
        isSubmitting: false,
      }) as unknown as WizardState,
    },
  ),
);

// =============================================================================
// User-scoped persist key — call once on client mount với session userId.
// Re-reads localStorage under userId-scoped key, replaces in-memory state.
// =============================================================================

let userScopeApplied = false;

export function setUserScopeKey(userId: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const key = buildPersistKey(userId);
  // Persist middleware uses persist.setOptions({ name }) to switch keys;
  // we then call rehydrate() to load from new key. Idempotent: only switch once.
  if (userScopeApplied) return;
  userScopeApplied = true;
  window.__PROJECT_WIZARD_USER_ID__ = userId ?? '';
  useProjectWizardStore.persist.setOptions({ name: key });
  void useProjectWizardStore.persist.rehydrate();
}

// =============================================================================
// Hydration gate — Skeleton until persist middleware finishes rehydrating
// =============================================================================

export function useProjectWizardHasHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState<boolean>(() =>
    useProjectWizardStore.persist.hasHydrated(),
  );

  React.useEffect(() => {
    const unsubFinish = useProjectWizardStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useProjectWizardStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => {
      unsubFinish();
    };
  }, []);

  return hydrated;
}

// =============================================================================
// Helpers — pure derivations from store state for components
// =============================================================================

export function getDefaultStep1(): Step1Data {
  return {
    name: '',
    kind: '',
    industrySectorIds: [],
    marketIds: [],
    countryIds: [],
    promotionTypeIds: [],
    timeRange: null,
    isTwoYear: false,
    nextYear: null,
  };
}

export function getDefaultStep2(): Step2Data {
  return { objective: '', content: '', planRows: [] };
}

export function getDefaultStep3(): Step3Data {
  return {
    rows: [],
    totalState: 0,
    totalSelf: 0,
    total: 0,
    proposedTotalReference: null,
  };
}

export function getDefaultStep4(): Step4Data {
  return { pmContactId: null };
}

export function getDefaultStep5(): Step5Data {
  return { documents: [] };
}

export function getDefaultStep6(): Step6Data {
  return { declarationConfirmed: false };
}
