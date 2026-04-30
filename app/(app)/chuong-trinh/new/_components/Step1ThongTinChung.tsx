'use client';

// Step 1 — Thông tin chung (CYCLE-01)
// Fields: year + name (auto-prefill từ year) + description + totalBudget
// Async year-exists check qua listCycles() server action on blur.
// Pattern: forwardRef + useImperativeHandle exposes validateAndCommit().

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/format';

import { useWizardStore } from '../_lib/wizardStore';
import { Step1Schema, type Step1Input } from '../_lib/schemas';
import { listCycles } from '@/app/(app)/chuong-trinh/_actions';
import type { StepHandle } from './CycleWizardShell';

const NAME_PREFIX = 'Chương trình XTTM Quốc gia ';

export const Step1ThongTinChung = React.forwardRef<StepHandle, object>(
  function Step1ThongTinChung(_props, ref) {
    const stored = useWizardStore((s) => s.formData.step1);
    const setStepData = useWizardStore((s) => s.setStepData);

    const defaultYear = stored?.year ?? new Date().getFullYear() + 1;
    const defaultName = stored?.name ?? `${NAME_PREFIX}${defaultYear}`;

    const form = useForm<Step1Input>({
      resolver: zodResolver(Step1Schema),
      mode: 'onBlur',
      defaultValues: {
        year: defaultYear,
        name: defaultName,
        description: stored?.description ?? '',
        totalBudget: stored?.totalBudget ?? null,
      },
    });

    const {
      register,
      handleSubmit,
      formState: { errors },
      setError,
      clearErrors,
      watch,
      setValue,
      getValues,
    } = form;

    const watchedYear = watch('year');

    // Auto-prefill name on year change if name is empty or matches the prefix-only pattern
    const handleYearBlur = async () => {
      const year = Number(getValues('year'));
      if (!Number.isFinite(year) || !Number.isInteger(year)) return;

      // Auto-fill name if user hasn't typed a custom name
      const currentName = getValues('name')?.trim() ?? '';
      const looksLikeAutoFill =
        currentName === '' || /^Chương trình XTTM Quốc gia\s*\d{0,4}$/.test(currentName);
      if (looksLikeAutoFill) {
        setValue('name', `${NAME_PREFIX}${year}`, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }

      // Async check: year already exists?
      try {
        const list = await listCycles({ year });
        if (list.length > 0) {
          setError('year', {
            type: 'manual',
            message: `Chu kỳ năm ${year} đã tồn tại`,
          });
        } else {
          // Clear only if previous error was the manual duplicate one
          clearErrors('year');
        }
      } catch {
        // Network error — silent (user will see error on submit if year duplicate)
      }
    };

    const handleBudgetBlur = () => {
      const v = getValues('totalBudget');
      if (v == null || Number.isNaN(v)) return;
      // No-op — display formatting via separate readonly span below
    };

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          let valid = false;
          await handleSubmit(
            (data) => {
              setStepData('step1', {
                year: data.year,
                name: data.name,
                description: data.description ?? null,
                totalBudget: data.totalBudget ?? null,
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

    const totalBudget = watch('totalBudget');
    const budgetDisplay =
      typeof totalBudget === 'number' && totalBudget > 0
        ? `${formatNumber(totalBudget)} đồng`
        : null;

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 1: Thông tin chung
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Khai báo năm chu kỳ, tên chương trình và ngân sách dự kiến
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="step1-year">
              Năm chu kỳ <span className="text-red-600">*</span>
            </Label>
            <Input
              id="step1-year"
              type="number"
              min={2020}
              max={2050}
              {...register('year', { valueAsNumber: true })}
              onBlur={(e) => {
                register('year', { valueAsNumber: true }).onBlur(e);
                void handleYearBlur();
              }}
              aria-invalid={!!errors.year}
            />
            {errors.year ? (
              <p className="text-sm text-red-600">{errors.year.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="step1-name">
              Tên chu kỳ <span className="text-red-600">*</span>
            </Label>
            <Input
              id="step1-name"
              type="text"
              placeholder={`${NAME_PREFIX}${watchedYear ?? ''}`}
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name ? (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Tự động điền theo năm — bạn có thể chỉnh sửa
              </p>
            )}
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="step1-description">Mô tả ngắn</Label>
            <Textarea
              id="step1-description"
              rows={4}
              placeholder="Mô tả mục đích, định hướng của chu kỳ chương trình năm này"
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="step1-budget">Ngân sách dự kiến (VND)</Label>
            <Input
              id="step1-budget"
              type="number"
              min={0}
              step={1000000}
              placeholder="Ví dụ: 100000000000"
              {...register('totalBudget', {
                setValueAs: (v) => {
                  if (v === '' || v == null) return null;
                  const n = Number(v);
                  return Number.isNaN(n) ? null : n;
                },
              })}
              onBlur={(e) => {
                register('totalBudget').onBlur(e);
                handleBudgetBlur();
              }}
              aria-invalid={!!errors.totalBudget}
            />
            {errors.totalBudget ? (
              <p className="text-sm text-red-600">
                {errors.totalBudget.message}
              </p>
            ) : budgetDisplay ? (
              <p className="text-xs text-slate-500">{budgetDisplay}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Có thể bỏ trống — bổ sung sau khi có quyết định ngân sách
              </p>
            )}
          </div>
        </div>
      </form>
    );
  },
);
