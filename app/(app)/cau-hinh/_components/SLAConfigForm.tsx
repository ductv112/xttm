'use client';

// SLAConfigForm — Plan 02-07 (CONFIG-01)
// 4 number/regex fields với defaults từ SLA_THRESHOLDS.
// Footer: Lưu + Khôi phục mặc định (ConfirmDialog).

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SLA_THRESHOLDS } from '@/lib/constants';
import type { SLAParams } from '@/lib/system-config';

import { slaParamsSchema, type SLAParamsInput } from '../_actions/schemas';
import { updateSLAConfig } from '../_actions/sla';

type Props = {
  initialData: SLAParams;
};

export function SLAConfigForm({ initialData }: Props) {
  const { confirm, dialog } = useConfirmDialog();

  const form = useForm<SLAParamsInput>({
    resolver: zodResolver(slaParamsSchema),
    defaultValues: {
      CONTRACT_DAYS: initialData.CONTRACT_DAYS,
      REPORT_DAYS: initialData.REPORT_DAYS,
      CONSULATE_DAYS: initialData.CONSULATE_DAYS,
      REGISTRATION_DEADLINE_MMDD: initialData.REGISTRATION_DEADLINE_MMDD,
    },
  });

  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (values: SLAParamsInput) => {
    startTransition(async () => {
      try {
        await updateSLAConfig(values);
        toast.success('Đã cập nhật tham số SLA');
        form.reset(values);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
        toast.error(msg);
      }
    });
  };

  const handleRestoreDefaults = async () => {
    const ok = await confirm({
      title: 'Khôi phục về mặc định?',
      description:
        'Hành động này sẽ đặt 4 tham số SLA về giá trị mặc định (60/30/15/05-30). Bạn cần bấm "Lưu" để áp dụng.',
      confirmLabel: 'Khôi phục',
      variant: 'default',
    });
    if (!ok) return;
    form.reset({
      CONTRACT_DAYS: SLA_THRESHOLDS.CONTRACT_DAYS,
      REPORT_DAYS: SLA_THRESHOLDS.REPORT_DAYS,
      CONSULATE_DAYS: SLA_THRESHOLDS.CONSULATE_DAYS,
      REGISTRATION_DEADLINE_MMDD: SLA_THRESHOLDS.REGISTRATION_DEADLINE_MMDD,
    });
    toast.info('Đã đặt lại 4 tham số về mặc định — bấm "Lưu" để áp dụng');
  };

  return (
    <>
      {dialog}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Tham số cảnh báo SLA
          </h2>
          <p className="text-sm text-slate-600">
            Áp dụng cho tất cả cảnh báo tự động trong hệ thống — Phase 8 (Hợp
            đồng), Phase 9 (Báo cáo) và Phase 10 (Dashboard).
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="CONTRACT_DAYS"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cảnh báo chậm ký hợp đồng (ngày){' '}
                        <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          step={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Mặc định 60 ngày — sau quyết định phê duyệt mà chưa ký HĐ
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="CONSULATE_DAYS"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cảnh báo liên hệ thương vụ (ngày){' '}
                        <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={180}
                          step={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Mặc định 30 ngày — trước sự kiện quốc tế phải liên hệ
                        thương vụ
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="REPORT_DAYS"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hạn nộp báo cáo sau hoạt động (ngày){' '}
                        <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={180}
                          step={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Mặc định 15 ngày — sau khi kết thúc hoạt động đơn vị
                        chủ trì phải nộp báo cáo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="REGISTRATION_DEADLINE_MMDD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hạn nộp đề án (MM-DD){' '}
                        <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="05-30"
                          maxLength={5}
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mặc định 05-30 (hết tháng 5) — hạn cuối nhận đăng ký
                        đề án mỗi năm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRestoreDefaults}
                  disabled={isPending}
                >
                  <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                  Khôi phục mặc định
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isDirty}
                >
                  {isPending ? (
                    <Loader2
                      className="mr-1 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="mr-1 h-4 w-4" aria-hidden="true" />
                  )}
                  Lưu
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
