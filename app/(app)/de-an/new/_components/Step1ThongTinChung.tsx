'use client';

// Step 1 — Thông tin chung (PROJ-05).
// Fields:
//   - name (Input, min 5 chars)
//   - kind (Select 9 ProjectKind từ catalog)
//   - industrySectorIds (MultiSelect, min 1)
//   - marketIds, countryIds, promotionTypeIds (MultiSelect, optional)
//   - timeRange — DateRangePicker (start/end), với toggle "Theo quý" cho đoàn nước ngoài
//   - isTwoYear toggle → if ON, show nextYear input
//
// Pattern: forwardRef + useImperativeHandle exposes validateAndCommit().
// Mỗi field on-change writes back to store immediately (autosave debounce in shell
// catches it). RHF chỉ dùng cho validation surface; data of truth = Zustand store.

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MultiSelect } from '@/components/shared/MultiSelect';
import { cn } from '@/lib/utils';

import { useProjectWizardStore, getDefaultStep1 } from '../_lib/wizardStore';
import { Step1Schema, type Step1Input } from '../_lib/schemas';
import type { Quarter, WizardCatalogData } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

export type Step1Props = {
  catalogs: WizardCatalogData;
  year: number;
};

const QUARTER_OPTIONS: Array<{ value: Quarter; label: string }> = [
  { value: 'Q1', label: 'Quý 1 (tháng 1-3)' },
  { value: 'Q2', label: 'Quý 2 (tháng 4-6)' },
  { value: 'Q3', label: 'Quý 3 (tháng 7-9)' },
  { value: 'Q4', label: 'Quý 4 (tháng 10-12)' },
];

const KIND_CODES_USING_QUARTER = new Set([
  'TRADE_DELEGATION_OUT',
  'TRADE_DELEGATION_IN',
]);

function parseIsoOrNull(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function DateInputField({
  id,
  value,
  onChange,
  placeholder = 'Chọn ngày',
  ariaInvalid,
}: {
  id: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const display = value
    ? format(value, 'dd/MM/yyyy', { locale: vi })
    : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

export const Step1ThongTinChung = React.forwardRef<StepHandle, Step1Props>(
  function Step1ThongTinChung({ catalogs, year }, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step1);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    const initialValues = stored ?? getDefaultStep1();

    const form = useForm<Step1Input>({
      resolver: zodResolver(Step1Schema),
      mode: 'onBlur',
      defaultValues: {
        name: initialValues.name,
        kind: initialValues.kind,
        industrySectorIds: initialValues.industrySectorIds,
        marketIds: initialValues.marketIds,
        countryIds: initialValues.countryIds,
        promotionTypeIds: initialValues.promotionTypeIds,
        timeRange: initialValues.timeRange ?? null,
        isTwoYear: initialValues.isTwoYear,
        nextYear: initialValues.nextYear ?? null,
      },
    });

    const {
      control,
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
    } = form;

    const watchedKind = watch('kind');
    const watchedIsTwoYear = watch('isTwoYear');
    const watchedTimeRange = watch('timeRange');
    const useQuarter = !!watchedTimeRange?.quarter;
    const allowQuarterToggle = KIND_CODES_USING_QUARTER.has(watchedKind ?? '');

    // Sync RHF values → store on every change (autosave in shell debounces server call)
    const allValues = watch();
    React.useEffect(() => {
      const next = {
        name: allValues.name ?? '',
        kind: allValues.kind ?? '',
        industrySectorIds: allValues.industrySectorIds ?? [],
        marketIds: allValues.marketIds ?? [],
        countryIds: allValues.countryIds ?? [],
        promotionTypeIds: allValues.promotionTypeIds ?? [],
        timeRange: allValues.timeRange ?? null,
        isTwoYear: allValues.isTwoYear ?? false,
        nextYear: allValues.nextYear ?? null,
      };
      setStepData('step1', next);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(allValues)]);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          let valid = false;
          await handleSubmit(
            (data) => {
              setStepData('step1', {
                name: data.name,
                kind: data.kind,
                industrySectorIds: data.industrySectorIds,
                marketIds: data.marketIds ?? [],
                countryIds: data.countryIds ?? [],
                promotionTypeIds: data.promotionTypeIds ?? [],
                timeRange: data.timeRange ?? null,
                isTwoYear: data.isTwoYear ?? false,
                nextYear: data.nextYear ?? null,
              });
              valid = true;
            },
            () => {
              valid = false;
            },
          )();
          return valid;
        },
      }),
      [handleSubmit, setStepData],
    );

    const sectorOptions = React.useMemo(
      () => catalogs.industrySectors.map((c) => ({ value: c.id, label: c.name })),
      [catalogs.industrySectors],
    );
    const marketOptions = React.useMemo(
      () => catalogs.markets.map((c) => ({ value: c.id, label: c.name })),
      [catalogs.markets],
    );
    const countryOptions = React.useMemo(
      () => catalogs.countries.map((c) => ({ value: c.id, label: c.name })),
      [catalogs.countries],
    );
    const promotionOptions = React.useMemo(
      () =>
        catalogs.promotionTypes.map((c) => ({ value: c.id, label: c.name })),
      [catalogs.promotionTypes],
    );

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 1: Thông tin chung
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Khai báo các thông tin cốt lõi để định danh đề án xúc tiến thương
            mại của đơn vị.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Name */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="step1-name">
              Tên đề án <span className="text-red-600">*</span>
            </Label>
            <Input
              id="step1-name"
              type="text"
              placeholder="Ví dụ: Tham gia Hội chợ Nguồn cung Toàn cầu HKTDC 2026"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name ? (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Tên đề án nên ngắn gọn, phản ánh đúng nội dung và năm thực hiện.
              </p>
            )}
          </div>

          {/* Kind */}
          <div className="space-y-2">
            <Label htmlFor="step1-kind">
              Loại đề án <span className="text-red-600">*</span>
            </Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="step1-kind" aria-invalid={!!errors.kind}>
                    <SelectValue placeholder="Chọn loại đề án" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.projectKinds.map((k) => (
                      <SelectItem key={k.code} value={k.code}>
                        {k.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kind ? (
              <p className="text-sm text-red-600">{errors.kind.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Phù hợp với 8 loại hình theo quy định Bộ Công Thương.
              </p>
            )}
          </div>

          {/* Industry sectors */}
          <div className="space-y-2">
            <Label htmlFor="step1-sectors">
              Ngành hàng <span className="text-red-600">*</span>
            </Label>
            <Controller
              control={control}
              name="industrySectorIds"
              render={({ field }) => (
                <MultiSelect
                  id="step1-sectors"
                  options={sectorOptions}
                  values={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Chọn ngành hàng"
                  searchPlaceholder="Tìm ngành hàng..."
                  maxBadgesShown={5}
                />
              )}
            />
            {errors.industrySectorIds ? (
              <p className="text-sm text-red-600">
                {errors.industrySectorIds.message?.toString()}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Tối thiểu 1, tối đa 10 ngành hàng.
              </p>
            )}
          </div>

          {/* Markets */}
          <div className="space-y-2">
            <Label htmlFor="step1-markets">Thị trường mục tiêu</Label>
            <Controller
              control={control}
              name="marketIds"
              render={({ field }) => (
                <MultiSelect
                  id="step1-markets"
                  options={marketOptions}
                  values={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Chọn thị trường"
                  searchPlaceholder="Tìm thị trường..."
                  maxBadgesShown={5}
                />
              )}
            />
            <p className="text-xs text-slate-500">
              Có thể bỏ trống nếu đề án không định hướng thị trường cụ thể.
            </p>
          </div>

          {/* Countries */}
          <div className="space-y-2">
            <Label htmlFor="step1-countries">Quốc gia liên quan</Label>
            <Controller
              control={control}
              name="countryIds"
              render={({ field }) => (
                <MultiSelect
                  id="step1-countries"
                  options={countryOptions}
                  values={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Chọn quốc gia"
                  searchPlaceholder="Tìm quốc gia..."
                  maxBadgesShown={3}
                />
              )}
            />
            <p className="text-xs text-slate-500">
              Áp dụng cho đoàn ra/đoàn vào và các đề án có yếu tố quốc tế.
            </p>
          </div>

          {/* Promotion types */}
          <div className="space-y-2">
            <Label htmlFor="step1-promotion">Loại hình XTTM</Label>
            <Controller
              control={control}
              name="promotionTypeIds"
              render={({ field }) => (
                <MultiSelect
                  id="step1-promotion"
                  options={promotionOptions}
                  values={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Chọn loại hình"
                  searchPlaceholder="Tìm loại hình..."
                  maxBadgesShown={3}
                />
              )}
            />
            <p className="text-xs text-slate-500">
              Bổ trợ cho phân tích thống kê — có thể bỏ trống.
            </p>
          </div>
        </div>

        {/* Time range */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-900">
              Thời gian triển khai
            </Label>
            {allowQuarterToggle ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="step1-use-quarter"
                  checked={useQuarter}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setValue('timeRange', {
                        start: null,
                        end: null,
                        quarter: 'Q1',
                      });
                    } else {
                      setValue('timeRange', {
                        start: null,
                        end: null,
                        quarter: null,
                      });
                    }
                  }}
                />
                <Label htmlFor="step1-use-quarter" className="text-xs">
                  Theo quý
                </Label>
              </div>
            ) : null}
          </div>
          {useQuarter ? (
            <div className="space-y-2">
              <Label htmlFor="step1-quarter" className="text-xs text-slate-500">
                Quý dự kiến
              </Label>
              <Controller
                control={control}
                name="timeRange"
                render={({ field }) => (
                  <Select
                    value={field.value?.quarter ?? 'Q1'}
                    onValueChange={(q) =>
                      field.onChange({
                        start: field.value?.start ?? null,
                        end: field.value?.end ?? null,
                        quarter: q as Quarter,
                      })
                    }
                  >
                    <SelectTrigger id="step1-quarter" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTER_OPTIONS.map((q) => (
                        <SelectItem key={q.value} value={q.value}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-slate-500">
                Sau khi xác định lịch cụ thể, bạn có thể chuyển sang chọn ngày.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="step1-start"
                  className="text-xs text-slate-500"
                >
                  Từ ngày
                </Label>
                <Controller
                  control={control}
                  name="timeRange"
                  render={({ field }) => (
                    <DateInputField
                      id="step1-start"
                      value={parseIsoOrNull(field.value?.start)}
                      onChange={(d) =>
                        field.onChange({
                          start: d ? d.toISOString() : null,
                          end: field.value?.end ?? null,
                          quarter: null,
                        })
                      }
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="step1-end" className="text-xs text-slate-500">
                  Đến ngày
                </Label>
                <Controller
                  control={control}
                  name="timeRange"
                  render={({ field }) => (
                    <DateInputField
                      id="step1-end"
                      value={parseIsoOrNull(field.value?.end)}
                      onChange={(d) =>
                        field.onChange({
                          start: field.value?.start ?? null,
                          end: d ? d.toISOString() : null,
                          quarter: null,
                        })
                      }
                      ariaInvalid={!!errors.timeRange}
                    />
                  )}
                />
                {errors.timeRange &&
                typeof errors.timeRange === 'object' &&
                'end' in errors.timeRange ? (
                  <p className="text-sm text-red-600">
                    {(errors.timeRange as { end?: { message?: string } }).end
                      ?.message ?? ''}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Two-year toggle */}
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label className="text-sm font-medium text-slate-900">
                Đề án 2 năm
              </Label>
              <p className="mt-1 text-xs text-slate-600">
                Đề án triển khai liên tục trong 2 năm liên tiếp. Hệ thống sẽ tạo
                bản ghi năm 2 dạng dự kiến (TENTATIVE) liên kết với đề án này.
              </p>
            </div>
            <Controller
              control={control}
              name="isTwoYear"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      setValue('nextYear', year + 1);
                    } else {
                      setValue('nextYear', null);
                    }
                  }}
                />
              )}
            />
          </div>
          {watchedIsTwoYear ? (
            <div className="space-y-1.5">
              <Label htmlFor="step1-next-year" className="text-xs">
                Năm tiếp theo
              </Label>
              <Input
                id="step1-next-year"
                type="number"
                min={year + 1}
                max={2050}
                className="max-w-[200px]"
                {...register('nextYear', {
                  setValueAs: (v) => {
                    if (v === '' || v == null) return null;
                    const n = Number(v);
                    return Number.isNaN(n) ? null : n;
                  },
                })}
                aria-invalid={!!errors.nextYear}
              />
              {errors.nextYear ? (
                <p className="text-sm text-red-600">
                  {errors.nextYear.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </form>
    );
  },
);

export default Step1ThongTinChung;
