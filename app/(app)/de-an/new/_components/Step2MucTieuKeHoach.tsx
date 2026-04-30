'use client';

// Step 2 — Mục tiêu, nội dung, kế hoạch (PROJ-06).
// Fields:
//   - objective (RichTextEditor Tiptap, min 100 printable chars)
//   - content (RichTextEditor Tiptap, min 200 printable chars)
//   - planRows (table inline CRUD: hạng mục / deliverable / dueDate / owner, min 1)

import * as React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { cn } from '@/lib/utils';

import {
  useProjectWizardStore,
  getDefaultStep2,
} from '../_lib/wizardStore';
import { Step2Schema } from '../_lib/schemas';
import type { Step2Data, Step2PlanRow } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

const MIN_OBJECTIVE = 100;
const MIN_CONTENT = 200;

function makeRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function stripHtmlPrintableLength(html: string | undefined | null): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

function parseIso(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function PlanRowDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const date = parseIso(value);
  const display = date ? format(date, 'dd/MM/yyyy', { locale: vi }) : 'Chọn';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-9 w-full justify-start font-normal',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon
            className="mr-1.5 h-3.5 w-3.5"
            aria-hidden="true"
          />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => {
            onChange(d ? d.toISOString() : null);
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

export const Step2MucTieuKeHoach = React.forwardRef<StepHandle, object>(
  function Step2MucTieuKeHoach(_props, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step2);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    const [data, setData] = React.useState<Step2Data>(
      stored ?? getDefaultStep2(),
    );
    const [showErrors, setShowErrors] = React.useState(false);

    const writeStore = React.useCallback(
      (next: Step2Data) => {
        setData(next);
        setStepData('step2', next);
      },
      [setStepData],
    );

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const parsed = Step2Schema.safeParse(data);
          if (!parsed.success) {
            setShowErrors(true);
            return false;
          }
          setStepData('step2', data);
          return true;
        },
      }),
      [data, setStepData],
    );

    const objectiveLength = stripHtmlPrintableLength(data.objective);
    const contentLength = stripHtmlPrintableLength(data.content);
    const objectiveError = showErrors && objectiveLength < MIN_OBJECTIVE;
    const contentError = showErrors && contentLength < MIN_CONTENT;
    const planError = showErrors && data.planRows.length === 0;

    const handleAddRow = () => {
      const newRow: Step2PlanRow = {
        id: makeRowId(),
        task: '',
        deliverable: '',
        dueDate: null,
        owner: '',
      };
      writeStore({ ...data, planRows: [...data.planRows, newRow] });
    };

    const handleUpdateRow = (
      idx: number,
      patch: Partial<Step2PlanRow>,
    ) => {
      const next = data.planRows.map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      );
      writeStore({ ...data, planRows: next });
    };

    const handleRemoveRow = (idx: number) => {
      const next = data.planRows.filter((_, i) => i !== idx);
      writeStore({ ...data, planRows: next });
    };

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 2: Mục tiêu, nội dung, kế hoạch
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Mô tả mục tiêu, nội dung triển khai và lập bảng kế hoạch chi tiết
            theo từng hạng mục công việc.
          </p>
        </div>

        {/* Objective */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="step2-objective">
              Mục tiêu đề án <span className="text-red-600">*</span>
            </Label>
            <span
              className={cn(
                'text-xs',
                objectiveLength < MIN_OBJECTIVE
                  ? 'text-amber-600'
                  : 'text-emerald-600',
              )}
            >
              {objectiveLength}/{MIN_OBJECTIVE} ký tự tối thiểu
            </span>
          </div>
          <RichTextEditor
            id="step2-objective"
            value={data.objective}
            onChange={(html) => writeStore({ ...data, objective: html })}
            placeholder="Mô tả các mục tiêu cần đạt được khi triển khai đề án..."
            minHeight={180}
          />
          {objectiveError ? (
            <p className="text-sm text-red-600">
              Mục tiêu tối thiểu {MIN_OBJECTIVE} ký tự
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Nêu rõ mục tiêu định lượng (số đối tác, số đơn hàng, tỉ lệ tăng
              trưởng) và mục tiêu định tính (uy tín thương hiệu, mở thị trường).
            </p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="step2-content">
              Nội dung triển khai <span className="text-red-600">*</span>
            </Label>
            <span
              className={cn(
                'text-xs',
                contentLength < MIN_CONTENT
                  ? 'text-amber-600'
                  : 'text-emerald-600',
              )}
            >
              {contentLength}/{MIN_CONTENT} ký tự tối thiểu
            </span>
          </div>
          <RichTextEditor
            id="step2-content"
            value={data.content}
            onChange={(html) => writeStore({ ...data, content: html })}
            placeholder="Mô tả các hoạt động chính, cách thức triển khai, đối tác phối hợp..."
            minHeight={220}
          />
          {contentError ? (
            <p className="text-sm text-red-600">
              Nội dung tối thiểu {MIN_CONTENT} ký tự
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Nêu các hoạt động cụ thể: khảo sát thị trường, gian hàng, hội
              thảo, tiếp xúc đối tác, chương trình truyền thông...
            </p>
          )}
        </div>

        {/* Plan rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Kế hoạch chi tiết <span className="text-red-600">*</span>
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

          {data.planRows.length === 0 ? (
            <div
              className={cn(
                'rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm',
                planError ? 'border-red-300 bg-red-50' : '',
              )}
            >
              <p className="text-slate-600">
                Chưa có hạng mục nào. Vui lòng thêm tối thiểu 1 hạng mục công
                việc.
              </p>
              {planError ? (
                <p className="mt-1 text-sm text-red-600">
                  Vui lòng khai báo ít nhất 1 dòng kế hoạch chi tiết
                </p>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-[28%]">
                      Hạng mục công việc
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-[28%]">
                      Sản phẩm đầu ra
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-[18%]">
                      Hạn hoàn thành
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-[20%]">
                      Người phụ trách
                    </th>
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.planRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-2 align-top">
                        <Input
                          value={row.task}
                          onChange={(e) =>
                            handleUpdateRow(idx, { task: e.target.value })
                          }
                          placeholder="Ví dụ: Khảo sát đối tác mục tiêu"
                          aria-invalid={
                            showErrors && row.task.trim().length === 0
                          }
                        />
                        {showErrors && row.task.trim().length === 0 ? (
                          <p className="mt-1 text-xs text-red-600">
                            Bắt buộc
                          </p>
                        ) : null}
                      </td>
                      <td className="p-2 align-top">
                        <Input
                          value={row.deliverable}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              deliverable: e.target.value,
                            })
                          }
                          placeholder="Báo cáo / sản phẩm cụ thể"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <PlanRowDatePicker
                          value={row.dueDate}
                          onChange={(iso) =>
                            handleUpdateRow(idx, { dueDate: iso })
                          }
                        />
                      </td>
                      <td className="p-2 align-top">
                        <Input
                          value={row.owner}
                          onChange={(e) =>
                            handleUpdateRow(idx, { owner: e.target.value })
                          }
                          placeholder="Họ tên đầu mối"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveRow(idx)}
                          aria-label="Xóa dòng kế hoạch"
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
              </table>
            </div>
          )}
        </div>
      </form>
    );
  },
);

export default Step2MucTieuKeHoach;
