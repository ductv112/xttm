// SideBySideDiff — Phase 8 Plan 08-01 Task 4.
// Simple CSS grid 2-column diff view với inline highlight.
// KHÔNG dùng react-diff-view library — build với simple text comparison.

import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import {
  AMENDMENT_TYPE_LABELS,
  type AmendmentType,
} from '@/lib/amendment-rules';
import { formatVND } from '@/lib/format';

export type SideBySideDiffProps = {
  amendmentType: string;
  oldValue: unknown;
  newValue: unknown;
};

export function SideBySideDiff({
  amendmentType,
  oldValue,
  newValue,
}: SideBySideDiffProps) {
  const typeKey = amendmentType as AmendmentType;
  const label = AMENDMENT_TYPE_LABELS[typeKey] ?? amendmentType;

  const oldDisplay = formatValue(typeKey, oldValue);
  const newDisplay = formatValue(typeKey, newValue);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-semibold text-slate-900">
          So sánh trước & sau điều chỉnh
        </h3>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-red-700">
            Hiện tại (Bản cũ)
          </div>
          <div className="break-words text-sm text-slate-900">
            <span className="line-through decoration-red-400 decoration-1">
              {oldDisplay || (
                <span className="italic text-slate-500 no-underline">
                  (Trống)
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <ArrowRight
            className="h-6 w-6 text-slate-400"
            aria-hidden="true"
          />
        </div>

        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-emerald-700">
            Đề xuất (Bản mới)
          </div>
          <div className="break-words text-sm font-medium text-slate-900">
            {newDisplay || (
              <span className="italic text-slate-500">(Trống)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatValue(type: AmendmentType, value: unknown): string {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'TIME': {
      if (typeof value === 'object' && value !== null) {
        const v = value as { start?: string; end?: string };
        return [v.start, v.end].filter(Boolean).join(' → ');
      }
      return String(value);
    }
    case 'BUDGET': {
      if (typeof value === 'object' && value !== null) {
        const v = value as { total?: number };
        if (typeof v.total === 'number') return formatVND(v.total);
      }
      if (typeof value === 'number') return formatVND(value);
      return String(value);
    }
    default:
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
  }
}
