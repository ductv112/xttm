'use client';

// CreateRecordDialogs — Phase 9 Plan 09-01 Task 3.
// Buttons + dialogs để tạo Tạm ứng / Thanh toán / Quyết toán.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Wallet, ReceiptText, FileBarChart2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatVND } from '@/lib/format';
import {
  type FinancialRecordType,
  FINANCIAL_TYPE_LABELS,
  FINANCIAL_TYPE_DESCRIPTIONS,
} from '@/lib/workflows/financial';

import {
  createAdvance,
  createPayment,
  createSettlement,
} from '../_actions/create';
import type { EligibleProject } from '../_actions/list';

export function CreateRecordDialogs({
  eligibleProjects,
}: {
  eligibleProjects: ReadonlyArray<EligibleProject>;
}) {
  const [openType, setOpenType] = React.useState<FinancialRecordType | null>(
    null,
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenType('ADVANCE')}
        >
          <Wallet className="mr-1 h-4 w-4" aria-hidden="true" />
          Tạo tạm ứng
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenType('PAYMENT')}
        >
          <ReceiptText className="mr-1 h-4 w-4" aria-hidden="true" />
          Tạo thanh toán
        </Button>
        <Button size="sm" onClick={() => setOpenType('SETTLEMENT')}>
          <FileBarChart2 className="mr-1 h-4 w-4" aria-hidden="true" />
          Tạo quyết toán
        </Button>
      </div>

      <CreateRecordDialog
        type={openType}
        eligibleProjects={eligibleProjects}
        onClose={() => setOpenType(null)}
      />
    </>
  );
}

function CreateRecordDialog({
  type,
  eligibleProjects,
  onClose,
}: {
  type: FinancialRecordType | null;
  eligibleProjects: ReadonlyArray<EligibleProject>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!type) {
      // Reset on close
      setProjectId('');
      setAmount('');
      setNotes('');
    }
  }, [type]);

  const selectedProject = eligibleProjects.find((p) => p.id === projectId);

  async function handleSubmit() {
    if (!type) return;
    if (!projectId) {
      toast.error('Vui lòng chọn đề án');
      return;
    }
    const amt = Number.parseFloat(amount.replace(/[\s,]/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }

    setBusy(true);
    try {
      const fn =
        type === 'ADVANCE'
          ? createAdvance
          : type === 'PAYMENT'
            ? createPayment
            : createSettlement;
      const result = await fn({
        projectId,
        amount: amt,
        notes,
        transactionDate: undefined,
      });
      if (result.ok) {
        toast.success(
          `Đã tạo ${FINANCIAL_TYPE_LABELS[type].toLowerCase()} ${result.recordNumber}`,
        );
        router.refresh();
        onClose();
      } else {
        toast.error('Tạo hồ sơ thất bại', { description: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!type} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {type ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Tạo hồ sơ {FINANCIAL_TYPE_LABELS[type].toLowerCase()}
              </DialogTitle>
              <DialogDescription>
                {FINANCIAL_TYPE_DESCRIPTIONS[type]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="fin-project">Đề án</Label>
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                >
                  <SelectTrigger id="fin-project" className="mt-1">
                    <SelectValue placeholder="Chọn đề án..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleProjects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Không có đề án nào đủ điều kiện
                      </div>
                    ) : (
                      eligibleProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-mono text-xs text-blue-700">
                            {p.code}
                          </span>{' '}
                          —{' '}
                          {p.name.length > 40
                            ? p.name.slice(0, 40) + '…'
                            : p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedProject ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedProject.organizationName}
                    {selectedProject.contractNo
                      ? ` · HĐ ${selectedProject.contractNo}`
                      : ''}
                    {selectedProject.contractValue
                      ? ` · ${formatVND(selectedProject.contractValue)}`
                      : ''}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="fin-amount">Số tiền (VND)</Label>
                <Input
                  id="fin-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="VD: 500000000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fin-notes">Ghi chú</Label>
                <Textarea
                  id="fin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Lý do, nội dung hồ sơ tài chính..."
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={busy}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Tạo hồ sơ
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
