'use client';

// ProjectEditEntry — client entry cho /de-an/[id]/edit (Plan 05-03 Task 3).
// Hydrate Zustand wizard store với existing project data + redirect tới /de-an/new.
//
// Pattern: server-side load existing project → pass props → on client mount call
// replaceAll(initialData) + setSavedDraftProjectId → router.push(/de-an/new).
// Wizard tiếp tục autosave vào cùng project record (server merges qua projectId).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  setUserScopeKey,
  useProjectWizardStore,
  useProjectWizardHasHydrated,
} from '@/app/(app)/de-an/new/_lib/wizardStore';
import type { ProjectWizardData } from '@/app/(app)/de-an/new/_lib/types';
import type { ProjectStatus } from '@/lib/workflows/project';

export type ProjectEditEntryProps = {
  userId: string;
  projectId: string;
  projectCode: string;
  status: ProjectStatus;
  initialData: Partial<ProjectWizardData>;
  /** Hint text hiển thị trên redirect screen */
  hintLabel: string;
};

export function ProjectEditEntry({
  userId,
  projectId,
  projectCode,
  status,
  initialData,
  hintLabel,
}: ProjectEditEntryProps) {
  const router = useRouter();
  const hasHydrated = useProjectWizardHasHydrated();
  const replaceAll = useProjectWizardStore((s) => s.replaceAll);
  const setSavedDraftProjectId = useProjectWizardStore(
    (s) => s.setSavedDraftProjectId,
  );
  const [step, setStep] = React.useState<'init' | 'loading' | 'done'>('init');

  // Apply userId-scoped persist key on mount (mirror /de-an/new shell)
  React.useEffect(() => {
    setUserScopeKey(userId);
  }, [userId]);

  // After hydration completes, hydrate wizard store với existing project data
  React.useEffect(() => {
    if (!hasHydrated || step !== 'init') return;
    setStep('loading');
    replaceAll(initialData);
    setSavedDraftProjectId(projectId);
    setStep('done');
    // Small delay để user đọc message trước khi redirect
    const t = setTimeout(() => {
      router.push('/de-an/new');
    }, 600);
    return () => clearTimeout(t);
  }, [
    hasHydrated,
    step,
    replaceAll,
    setSavedDraftProjectId,
    initialData,
    projectId,
    router,
  ]);

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Alert>
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
        <AlertTitle>{hintLabel}</AlertTitle>
        <AlertDescription>
          Đang tải dữ liệu đề án <span className="font-mono">{projectCode}</span> vào
          trình khai báo. Bạn sẽ được chuyển đến trang khai báo trong giây lát…
          {status === 'SUPPLEMENT_REQUIRED' ? (
            <>
              <br />
              <span className="mt-2 inline-block text-amber-700">
                Sau khi chỉnh sửa và nộp lại, hệ thống sẽ tự động lưu một bản
                snapshot phiên bản mới và tăng số phiên bản (currentVersion + 1).
              </span>
            </>
          ) : null}
        </AlertDescription>
      </Alert>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Đang chuẩn bị…
      </div>
    </div>
  );
}

export default ProjectEditEntry;
