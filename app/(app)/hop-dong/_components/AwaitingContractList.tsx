'use client';

// AwaitingContractList — Phase 8 Plan 08-01 Task 2.
// Card list các đề án APPROVED chưa có HĐ + nút "Tạo hợp đồng".

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatDate, formatVNDCompact } from '@/lib/format';

import type { ApprovedProjectAwaitingContract } from '../_actions/list';
import { createContractFromProject } from '../_actions/create-from-project';

export function AwaitingContractList({
  projects,
}: {
  projects: ApprovedProjectAwaitingContract[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  if (projects.length === 0) return null;

  async function handleCreate(projectId: string, projectCode: string) {
    setPending(projectId);
    try {
      const result = await createContractFromProject(projectId);
      if (result.ok) {
        toast.success(`Đã tạo hợp đồng ${result.contractNo}`, {
          description: `Đề án ${projectCode}`,
        });
        router.push(`/hop-dong/${result.contractId}`);
      } else {
        toast.error('Tạo hợp đồng thất bại', {
          description: result.error,
        });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FilePlus
          className="h-5 w-5 text-amber-700"
          aria-hidden="true"
        />
        <h3 className="font-semibold text-amber-900">
          Đề án sẵn sàng ký hợp đồng ({projects.length})
        </h3>
      </div>
      <ul className="space-y-2">
        {projects.map((p) => {
          const overdue =
            p.daysSinceDecision !== null && p.daysSinceDecision > 60;
          return (
            <li
              key={p.projectId}
              className="rounded border border-amber-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-blue-700">
                      {p.projectCode}
                    </span>
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                        <AlertCircle
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        Quá hạn 60 ngày
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900">
                    {p.projectName}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {p.organizationName} · Kinh phí phê duyệt{' '}
                    <strong>{formatVNDCompact(p.approvedBudget)}</strong>
                    {p.decisionNumber ? (
                      <>
                        {' '}
                        · QĐ <span className="font-mono">{p.decisionNumber}</span>
                        {p.decisionDate
                          ? ` ngày ${formatDate(p.decisionDate)}`
                          : ''}
                      </>
                    ) : null}
                    {p.daysSinceDecision !== null
                      ? ` (${p.daysSinceDecision} ngày trước)`
                      : ''}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCreate(p.projectId, p.projectCode)}
                  disabled={pending === p.projectId}
                >
                  {pending === p.projectId ? (
                    'Đang tạo...'
                  ) : (
                    <>
                      <FilePlus
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      Tạo hợp đồng
                      <ChevronRight
                        className="ml-1 h-4 w-4"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
