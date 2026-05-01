'use client';

// TransitionActions — Phase 9 Plan 09-01 Task 3.
// Buttons để chuyển trạng thái hồ sơ tài chính theo state machine.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  CheckCircle2,
  Banknote,
  FileCheck2,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  FINANCIAL_STATUS_LABELS,
  type FinancialStatus,
} from '@/lib/workflows/financial';

import { transitionFinancial } from '../_actions/transition';

const STATUS_ICONS: Record<FinancialStatus, React.ComponentType<{ className?: string }>> = {
  DRAFT: Undo2,
  SUBMITTED: Send,
  APPROVED: CheckCircle2,
  DISBURSED: Banknote,
  SETTLED: FileCheck2,
};

const STATUS_BUTTON_VARIANT: Record<
  FinancialStatus,
  'default' | 'outline'
> = {
  DRAFT: 'outline',
  SUBMITTED: 'default',
  APPROVED: 'default',
  DISBURSED: 'default',
  SETTLED: 'default',
};

export function TransitionActions({
  recordId,
  nextStates,
}: {
  recordId: string;
  nextStates: ReadonlyArray<FinancialStatus>;
}) {
  const router = useRouter();
  const [target, setTarget] = React.useState<FinancialStatus | null>(null);
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function handleConfirm() {
    if (!target) return;
    setBusy(true);
    try {
      const result = await transitionFinancial(recordId, target, notes);
      if (result.ok) {
        toast.success(
          `Đã chuyển sang ${FINANCIAL_STATUS_LABELS[target]}`,
        );
        setTarget(null);
        setNotes('');
        router.refresh();
      } else {
        toast.error('Chuyển trạng thái thất bại', {
          description: result.error,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {nextStates.map((s) => {
          const Icon = STATUS_ICONS[s];
          return (
            <Button
              key={s}
              variant={STATUS_BUTTON_VARIANT[s]}
              size="sm"
              onClick={() => setTarget(s)}
            >
              <Icon className="mr-1 h-4 w-4" aria-hidden="true" />
              {FINANCIAL_STATUS_LABELS[s]}
            </Button>
          );
        })}
      </div>

      <Sheet open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <SheetContent side="right" size="md" className="flex flex-col p-0">
          {target ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  Chuyển sang {FINANCIAL_STATUS_LABELS[target]}
                </SheetTitle>
                <SheetDescription>
                  Xác nhận chuyển trạng thái hồ sơ tài chính. Có thể ghi chú
                  thêm trước khi xác nhận.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Ghi chú (không bắt buộc)..."
                />
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() => setTarget(null)}
                  disabled={busy}
                >
                  Hủy
                </Button>
                <Button onClick={handleConfirm} disabled={busy}>
                  Xác nhận
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
