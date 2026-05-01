'use client';

// ContractDetailHeader — Phase 8 Plan 08-01 Task 2.
// Header với số HĐ + status + nút chuyển trạng thái.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileSignature, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE,
  type ContractStatus,
} from '@/lib/amendment-rules';
import { formatDate, formatVND } from '@/lib/format';

import type { ContractDetail } from '../../_actions/get-detail';
import { transitionContract } from '../../_actions/update';

const NEXT_STATUS: Record<ContractStatus, ContractStatus | null> = {
  DRAFT: 'SIGNED',
  SIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'LIQUIDATED',
  LIQUIDATED: null,
};

const NEXT_STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: 'Đánh dấu đã ký',
  SIGNED: 'Bắt đầu triển khai',
  IN_PROGRESS: 'Đánh dấu đã nghiệm thu',
  COMPLETED: 'Thanh lý hợp đồng',
  LIQUIDATED: '',
};

export function ContractDetailHeader({
  contract,
  canUpdate,
}: {
  contract: ContractDetail;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const status = contract.status as ContractStatus;
  const next = NEXT_STATUS[status];

  async function handleTransition() {
    if (!next) return;
    setPending(true);
    try {
      const result = await transitionContract(contract.id, next);
      if (result.ok) {
        toast.success(`Đã chuyển sang ${CONTRACT_STATUS_LABELS[next]}`);
        router.refresh();
      } else {
        toast.error('Không thể chuyển trạng thái', {
          description: result.error,
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/hop-dong">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Quay về danh sách
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <FileSignature
            className="h-7 w-7 text-blue-600"
            aria-hidden="true"
          />
          <h1 className="font-mono text-2xl font-semibold text-slate-900">
            {contract.contractNo}
          </h1>
          <Badge
            variant="outline"
            className={CONTRACT_STATUS_BADGE[status]}
          >
            {CONTRACT_STATUS_LABELS[status] ?? contract.status}
          </Badge>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          <Link
            href={`/de-an/${contract.project.id}`}
            className="text-blue-700 hover:underline"
          >
            <span className="font-mono">{contract.project.code}</span> —{' '}
            {contract.project.name}
          </Link>
        </div>
        <div className="mt-1 text-sm text-slate-700">
          Đơn vị chủ trì: <strong>{contract.organization.name}</strong> · Giá
          trị hợp đồng: <strong>{formatVND(contract.totalValue)}</strong>
          {contract.signedDate ? (
            <> · Ký ngày {formatDate(contract.signedDate)}</>
          ) : null}
        </div>
      </div>
      {canUpdate && next ? (
        <Button onClick={handleTransition} disabled={pending}>
          {pending ? 'Đang xử lý...' : NEXT_STATUS_LABEL[status]}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
    </header>
  );
}
