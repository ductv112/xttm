'use client';

// Step 3 — Dự toán kinh phí (PROJ-07).
// Bảng dự toán table — rows: hạng mục (text), đơn vị tính (text), số lượng (number),
// đơn giá (number), thành tiền (auto = qty × unitPrice, readonly), nguồn (Select).
// Total auto-sum bottom + ngân sách tổng tham chiếu (manual, validate >= total).

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

import {
  useProjectWizardStore,
  getDefaultStep3,
} from '../_lib/wizardStore';
import { Step3Schema } from '../_lib/schemas';
import type { Step3BudgetRow, Step3Data } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

const SOURCE_OPTIONS: Array<{ value: 'STATE' | 'SELF'; label: string }> = [
  { value: 'STATE', label: 'Ngân sách Nhà nước' },
  { value: 'SELF', label: 'Đối ứng đơn vị' },
];

function makeRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function recompute(rows: Step3BudgetRow[]): {
  rows: Step3BudgetRow[];
  totalState: number;
  totalSelf: number;
  total: number;
} {
  let totalState = 0;
  let totalSelf = 0;
  const next = rows.map((r) => {
    const amount = (r.quantity ?? 0) * (r.unitPrice ?? 0);
    if (r.source === 'SELF') totalSelf += amount;
    else totalState += amount;
    return { ...r, amount };
  });
  return { rows: next, totalState, totalSelf, total: totalState + totalSelf };
}

export const Step3DuToan = React.forwardRef<StepHandle, object>(
  function Step3DuToan(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step3);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    const [data, setData] = React.useState<Step3Data>(() => {
      const initial = stored ?? getDefaultStep3();
      const recomputed = recompute(initial.rows);
      return {
        ...initial,
        rows: recomputed.rows,
        totalState: recomputed.totalState,
        totalSelf: recomputed.totalSelf,
        total: recomputed.total,
      };
    });
    const [showErrors, setShowErrors] = React.useState(false);

    const writeStore = React.useCallback(
      (next: Step3Data) => {
        setData(next);
        setStepData('step3', next);
      },
      [setStepData],
    );

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const parsed = Step3Schema.safeParse(data);
          if (!parsed.success) {
            setShowErrors(true);
            return false;
          }
          setStepData('step3', data);
          return true;
        },
      }),
      [data, setStepData],
    );

    const proposedReferenceTooLow =
      typeof data.proposedTotalReference === 'number' &&
      data.proposedTotalReference > 0 &&
      data.proposedTotalReference < data.total;

    const handleAddRow = () => {
      const newRow: Step3BudgetRow = {
        id: makeRowId(),
        item: '',
        unit: '',
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        source: 'STATE',
        note: '',
      };
      const updated = recompute([...data.rows, newRow]);
      writeStore({
        ...data,
        rows: updated.rows,
        totalState: updated.totalState,
        totalSelf: updated.totalSelf,
        total: updated.total,
      });
    };

    const handleUpdateRow = (
      idx: number,
      patch: Partial<Step3BudgetRow>,
    ) => {
      const next = data.rows.map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      );
      const updated = recompute(next);
      writeStore({
        ...data,
        rows: updated.rows,
        totalState: updated.totalState,
        totalSelf: updated.totalSelf,
        total: updated.total,
      });
    };

    const handleRemoveRow = (idx: number) => {
      const next = data.rows.filter((_, i) => i !== idx);
      const updated = recompute(next);
      writeStore({
        ...data,
        rows: updated.rows,
        totalState: updated.totalState,
        totalSelf: updated.totalSelf,
        total: updated.total,
      });
    };

    const handleProposedChange = (raw: string) => {
      if (raw === '') {
        writeStore({ ...data, proposedTotalReference: null });
        return;
      }
      const n = Number(raw);
      writeStore({
        ...data,
        proposedTotalReference: Number.isFinite(n) ? n : null,
      });
    };

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 3: Dự toán kinh phí
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Lập bảng dự toán theo từng hạng mục. Thành tiền = số lượng × đơn
            giá (tự động tính). Tổng cộng tự động cập nhật ở chân bảng.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Bảng dự toán <span className="text-red-600">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              Thêm hạng mục
            </Button>
          </div>

          {data.rows.length === 0 ? (
            <div
              className={cn(
                'rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm',
                showErrors ? 'border-red-300 bg-red-50' : '',
              )}
            >
              <p className="text-slate-600">
                Chưa có hạng mục dự toán. Vui lòng thêm tối thiểu 1 hạng mục.
              </p>
              {showErrors ? (
                <p className="mt-1 text-sm text-red-600">
                  Vui lòng khai báo ít nhất 1 dòng dự toán kinh phí
                </p>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-[24%]">
                      Hạng mục
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-[10%]">
                      ĐVT
                    </th>
                    <th className="px-3 py-2 text-right font-medium w-[10%]">
                      SL
                    </th>
                    <th className="px-3 py-2 text-right font-medium w-[15%]">
                      Đơn giá
                    </th>
                    <th className="px-3 py-2 text-right font-medium w-[15%]">
                      Thành tiền
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-[18%]">
                      Nguồn
                    </th>
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rows.map((row, idx) => (
                    <tr key={row.id} className="align-top">
                      <td className="p-2">
                        <Input
                          value={row.item}
                          onChange={(e) =>
                            handleUpdateRow(idx, { item: e.target.value })
                          }
                          placeholder="Tên hạng mục"
                          aria-invalid={
                            showErrors && row.item.trim().length === 0
                          }
                        />
                        {showErrors && row.item.trim().length === 0 ? (
                          <p className="mt-1 text-xs text-red-600">
                            Bắt buộc
                          </p>
                        ) : null}
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.unit}
                          onChange={(e) =>
                            handleUpdateRow(idx, { unit: e.target.value })
                          }
                          placeholder="lượt / m² / ..."
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={row.quantity}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            handleUpdateRow(idx, {
                              quantity: Number.isFinite(v) ? v : 0,
                            });
                          }}
                          className="text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={row.unitPrice}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            handleUpdateRow(idx, {
                              unitPrice: Number.isFinite(v) ? v : 0,
                            });
                          }}
                          className="text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-900">
                        {formatVND(row.amount)}
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.source}
                          onValueChange={(v) =>
                            handleUpdateRow(idx, {
                              source: v as 'STATE' | 'SELF',
                            })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveRow(idx)}
                          aria-label="Xóa dòng dự toán"
                        >
                          <Trash2
                            className="h-4 w-4 text-red-600"
                            aria-hidden="true"
                          />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm font-semibold">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      Ngân sách Nhà nước:
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatVND(data.totalState)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      Đối ứng đơn vị:
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatVND(data.totalSelf)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                  <tr className="border-t-2 border-slate-300">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right text-base"
                    >
                      Tổng dự toán:
                    </td>
                    <td className="px-3 py-2 text-right text-base tabular-nums text-emerald-700">
                      {formatVND(data.total)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {showErrors && data.total <= 0 && data.rows.length > 0 ? (
            <p className="text-sm text-red-600">
              Tổng dự toán kinh phí phải lớn hơn 0
            </p>
          ) : null}
        </div>

        {/* Reference budget */}
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/50 p-4">
          <Label htmlFor="step3-ref-budget" className="text-sm font-medium">
            Ngân sách tổng tham chiếu (tùy chọn)
          </Label>
          <Input
            id="step3-ref-budget"
            type="number"
            min={0}
            step={1_000_000}
            placeholder="Ví dụ: 500000000"
            value={
              data.proposedTotalReference == null
                ? ''
                : data.proposedTotalReference
            }
            onChange={(e) => handleProposedChange(e.target.value)}
            aria-invalid={proposedReferenceTooLow}
            className="max-w-sm"
          />
          {proposedReferenceTooLow ? (
            <p className="text-sm text-red-600">
              Ngân sách tham chiếu không được nhỏ hơn tổng dự toán (
              {formatVND(data.total)})
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Đây là ngân sách dự kiến đăng ký với Ban quản lý — phải lớn hơn
              hoặc bằng tổng dự toán chi tiết ở trên. Có thể bỏ trống.
            </p>
          )}
        </div>
      </form>
    );
  },
);

export default Step3DuToan;
