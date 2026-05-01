'use client';

// ContractInfoTab — Phase 8 Plan 08-01 Task 2.
// Form edit termsHtml + dates + value (BQL only).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { formatDate, formatVND } from '@/lib/format';

import type { ContractDetail } from '../../_actions/get-detail';
import { updateContract } from '../../_actions/update';

function toDateInputValue(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export function ContractInfoTab({
  contract,
  canUpdate,
}: {
  contract: ContractDetail;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [termsHtml, setTermsHtml] = React.useState(contract.termsHtml ?? '');
  const [totalValue, setTotalValue] = React.useState(
    String(contract.totalValue ?? 0),
  );
  const [signedDate, setSignedDate] = React.useState(
    toDateInputValue(contract.signedDate),
  );
  const [effectiveFrom, setEffectiveFrom] = React.useState(
    toDateInputValue(contract.effectiveFrom),
  );
  const [effectiveTo, setEffectiveTo] = React.useState(
    toDateInputValue(contract.effectiveTo),
  );
  const [pending, setPending] = React.useState(false);

  async function handleSave() {
    setPending(true);
    try {
      const value = Number.parseFloat(totalValue);
      const result = await updateContract(contract.id, {
        termsHtml,
        totalValue: Number.isFinite(value) ? value : undefined,
        signedDate: signedDate || null,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
      });
      if (result.ok) {
        toast.success('Đã lưu hợp đồng');
        router.refresh();
      } else {
        toast.error('Lưu thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Thông tin chung</h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <DefRow label="Đơn vị chủ trì" value={contract.organization.name} />
          <DefRow
            label="Mã số thuế"
            value={contract.organization.taxCode ?? '—'}
          />
          <DefRow
            label="Địa chỉ"
            value={contract.organization.address ?? '—'}
            colSpan={2}
          />
          <DefRow
            label="Đề án"
            value={
              <span className="font-medium">
                <span className="font-mono text-xs">
                  {contract.project.code}
                </span>{' '}
                — {contract.project.name}
              </span>
            }
            colSpan={2}
          />
          {contract.decision ? (
            <DefRow
              label="Quyết định phê duyệt"
              value={
                <>
                  <span className="font-mono">
                    {contract.decision.decisionNumber}
                  </span>{' '}
                  ngày {formatDate(contract.decision.decisionDate)} · KP duyệt{' '}
                  <strong>{formatVND(contract.decision.approvedBudget)}</strong>
                </>
              }
              colSpan={2}
            />
          ) : null}
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-900">
          Các thông số hợp đồng
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="totalValue">Tổng giá trị hợp đồng (VND)</Label>
            <Input
              id="totalValue"
              type="number"
              step="1000000"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              disabled={!canUpdate}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="signedDate">Ngày ký hợp đồng</Label>
            <Input
              id="signedDate"
              type="date"
              value={signedDate}
              onChange={(e) => setSignedDate(e.target.value)}
              disabled={!canUpdate}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="effectiveFrom">Hiệu lực từ ngày</Label>
            <Input
              id="effectiveFrom"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              disabled={!canUpdate}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="effectiveTo">Hiệu lực đến ngày</Label>
            <Input
              id="effectiveTo"
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              disabled={!canUpdate}
              className="mt-1"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-2 font-semibold text-slate-900">Điều khoản hợp đồng</h3>
        <p className="mb-3 text-xs text-slate-500">
          Soạn thảo các điều khoản hợp đồng. Mặc định đã có 8 điều khoản chuẩn —
          BQL có thể chỉnh sửa cho phù hợp từng đề án.
        </p>
        {canUpdate ? (
          <RichTextEditor
            value={termsHtml}
            onChange={setTermsHtml}
            placeholder="Nhập các điều khoản hợp đồng..."
            minHeight={400}
          />
        ) : (
          <div
            className="prose prose-sm max-w-none text-slate-800"
            // eslint-disable-next-line react/no-danger -- POC: trust admin-edited content
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        )}
      </section>

      {canUpdate ? (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending}>
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function DefRow({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <div className={colSpan === 2 ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{value}</dd>
    </div>
  );
}
