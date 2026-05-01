'use client';

// ExtendCycleDialog — Plan 03-07 CYCLE-10 form gia hạn chu kỳ.
//
// CLOSED_REGISTRATION → OPEN_REGISTRATION với reason text bắt buộc + ngày hạn
// mới. Server action extendCycle (Plan 03-03) xử lý:
//   1. Validate RBAC + status === CLOSED_REGISTRATION
//   2. Append vào configJson.extensions[] (date, reason, oldCloseAt, newCloseAt)
//   3. Update status + registrationCloseAt
//   4. Audit log capture reason explicit (T-03-07-03 accepted: reason là
//      admin-authored text)
//
// Dùng shadcn Dialog (form input — AlertDialog không phù hợp).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

import { extendCycle } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';

// =============================================================================
// SCHEMA — mirrors server contract (Plan 03-03 extendInputSchemaInternal)
// =============================================================================

const ExtendFormSchema = z.object({
  reason: z
    .string({ message: 'Vui lòng nhập lý do gia hạn' })
    .trim()
    .min(10, 'Lý do gia hạn tối thiểu 10 ký tự')
    .max(1000, 'Lý do gia hạn tối đa 1000 ký tự'),
  newDeadline: z
    .date({ message: 'Vui lòng chọn ngày hạn mới' })
    .refine((d) => d.getTime() > Date.now(), 'Ngày hạn mới phải sau hôm nay'),
});

type ExtendFormInput = z.infer<typeof ExtendFormSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export type ExtendCycleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: CycleDetail;
};

export function ExtendCycleDialog({
  open,
  onOpenChange,
  cycle,
}: ExtendCycleDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // Default deadline: hôm nay + 14 ngày (gợi ý chuẩn cho gia hạn)
  const defaultNewDeadline = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const form = useForm<ExtendFormInput>({
    resolver: zodResolver(ExtendFormSchema),
    mode: 'onBlur',
    defaultValues: {
      reason: '',
      newDeadline: defaultNewDeadline,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  // Reset form khi dialog đóng — tránh state leak giữa các lần mở
  React.useEffect(() => {
    if (!open) {
      reset({
        reason: '',
        newDeadline: defaultNewDeadline,
      });
    }
  }, [open, reset, defaultNewDeadline]);

  const reasonValue = watch('reason') ?? '';
  const reasonLength = reasonValue.length;

  const onSubmit = async (data: ExtendFormInput) => {
    setSubmitting(true);
    try {
      await extendCycle({
        cycleId: cycle.id,
        reason: data.reason,
        newDeadline: data.newDeadline,
      });
      toast.success(
        `Đã gia hạn chu kỳ. Hạn nộp mới: ${formatDate(data.newDeadline)}`,
      );
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi gia hạn chu kỳ');
    } finally {
      setSubmitting(false);
    }
  };

  // Disable past dates trong calendar — Calendar matcher API
  const disablePastDates = React.useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>Mở lại để gia hạn chu kỳ</SheetTitle>
          <SheetDescription>
            Sau khi gia hạn, đơn vị chủ trì có thể nộp đề án trở lại đến ngày
            hạn mới. Lý do gia hạn sẽ được ghi vào nhật ký truy cập của chu kỳ.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
          noValidate
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Reason textarea */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="extend-reason">
                Lý do gia hạn <span className="text-red-600">*</span>
              </Label>
              <span
                className={cn(
                  'text-xs',
                  reasonLength > 1000 ? 'text-red-600' : 'text-slate-500',
                )}
              >
                {reasonLength}/1000
              </span>
            </div>
            <Textarea
              id="extend-reason"
              rows={4}
              {...register('reason')}
              placeholder="Ví dụ: Theo đề xuất của các hiệp hội ngành hàng, gia hạn thêm 14 ngày để các đơn vị có thời gian chuẩn bị hồ sơ chu đáo hơn."
              disabled={submitting}
            />
            {errors.reason ? (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            ) : null}
          </div>

          {/* New deadline date picker */}
          <div className="space-y-2">
            <Label htmlFor="extend-deadline">
              Hạn nộp mới <span className="text-red-600">*</span>
            </Label>
            <Controller
              control={control}
              name="newDeadline"
              render={({ field }) => (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="extend-deadline"
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      className={cn(
                        'w-full justify-start font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      {field.value
                        ? format(field.value, 'dd/MM/yyyy', { locale: vi })
                        : 'Chọn ngày hạn mới'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(d) => {
                        if (d) {
                          // Set tới cuối ngày để hạn = end of day
                          const endOfDay = new Date(d);
                          endOfDay.setHours(23, 59, 59, 999);
                          field.onChange(endOfDay);
                        }
                        setCalendarOpen(false);
                      }}
                      disabled={disablePastDates}
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.newDeadline ? (
              <p className="text-sm text-red-600">
                {errors.newDeadline.message}
              </p>
            ) : null}
            {cycle.registrationCloseAt ? (
              <p className="text-xs text-slate-500">
                Hạn cũ: {formatDate(cycle.registrationCloseAt)}
              </p>
            ) : null}
          </div>

          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2
                    className="mr-1 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Đang gia hạn...
                </>
              ) : (
                'Xác nhận gia hạn'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default ExtendCycleDialog;
