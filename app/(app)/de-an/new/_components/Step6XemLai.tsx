'use client';

// Step 6 — Xem lại & Nộp đề án (PROJ-11 / PROJ-14).
// Placeholder shell for Task 2 — full impl in Task 3.

import * as React from 'react';

import { useProjectWizardStore } from '../_lib/wizardStore';
import type { ContactOption, WizardCatalogData } from '../_lib/types';

export type Step6Props = {
  catalogs: WizardCatalogData;
  contacts: ContactOption[];
  year: number;
  programCycleId: string;
  onSubmitted: (projectId: string) => void;
};

export function Step6XemLai(_props: Step6Props) {
  const formData = useProjectWizardStore((s) => s.formData);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Bước 6: Xem lại & nộp đề án
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kiểm tra lại toàn bộ thông tin đã khai báo, xác nhận cam đoan và nộp
          đề án đến Ban quản lý. Bạn có thể quay lại chỉnh sửa từng bước trước
          khi nộp.
        </p>
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Tóm tắt và submit form bước 6 đang được hoàn thiện trong Task 3 của
        plan 05-02. (Hiện có {Object.keys(formData).length} step có dữ liệu.)
      </div>
    </div>
  );
}

export default Step6XemLai;
