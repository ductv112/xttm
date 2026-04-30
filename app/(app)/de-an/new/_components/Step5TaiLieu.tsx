'use client';

// Step 5 — Tài liệu đính kèm (PROJ-09 / PROJ-10).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore } from '../_lib/wizardStore';
import type { StepHandle } from './ProjectWizardShell';

export type Step5Props = {
  /** Server draft id once autosave succeeds. Required to upload (action keys docs by projectId). */
  projectId: string | null;
  /** Force-autosave before allowing first upload — returns the (possibly new) projectId. */
  onAutosaveBeforeUpload: () => Promise<string | null>;
};

export const Step5TaiLieu = React.forwardRef<StepHandle, Step5Props>(
  function Step5TaiLieu(_props, ref) {
    const documents =
      useProjectWizardStore((s) => s.formData.step5?.documents) ?? [];

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          // Step 5 không bắt buộc đính kèm tài liệu — submit-time validation
          // sẽ kiểm tra theo policy. Step always passes navigation.
          return true;
        },
      }),
      [],
    );

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 5: Tài liệu đính kèm
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tải lên các tài liệu liên quan: kế hoạch chi tiết, hồ sơ năng lực,
            bằng chứng kinh nghiệm. Định dạng PDF/DOC/DOCX/XLSX/JPG/PNG, tối đa
            10MB/tệp, 20 tệp/đề án.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Form bước 5 đang được hoàn thiện trong Task 3 của plan 05-02. (Hiện
          có {documents.length} tài liệu trong store.)
        </div>
      </div>
    );
  },
);

export default Step5TaiLieu;
