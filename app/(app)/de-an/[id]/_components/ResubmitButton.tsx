'use client';

// ResubmitButton — "Chỉnh sửa và nộp lại" entry point khi đề án ở trạng thái
// SUPPLEMENT_REQUIRED (PROJ-21). Plan 05-03: redirect tới /de-an/[id]/edit page
// (load existing project data into wizard store). Resubmit thực hiện qua
// submitProject server action — đã handle SUPPLEMENT_REQUIRED → RESUBMITTED
// transition + version increment.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileEdit } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type ResubmitButtonProps = {
  projectId: string;
  projectCode: string;
};

export function ResubmitButton({
  projectId,
}: ResubmitButtonProps) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      onClick={() => router.push(`/de-an/${projectId}/edit`)}
    >
      <FileEdit className="h-4 w-4" aria-hidden="true" />
      Chỉnh sửa và nộp lại
    </Button>
  );
}

export default ResubmitButton;
