'use client';

// LegalInfoForm — Section 1 của hồ sơ tổ chức. Fields:
// - Tên tổ chức (readonly từ Organization)
// - Mã số thuế (Zod regex)
// - Địa chỉ trụ sở
// - Người đại diện theo pháp luật + chức danh
// - Loại hình + lĩnh vực hoạt động
//
// Auto-save: debounce 1s sau khi user dừng gõ → call updateMyProfile({ legalInfo }).
// Disabled hoàn toàn khi status === 'SUBMITTED' (UI freeze parallel với server guard).

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateMyProfile } from '../_actions/update';
import { legalInfoInternal } from '../_actions/types';
import type { OrgProfileLegalInfo } from '@/lib/workflows/orgProfile';

export type LegalInfoFormProps = {
  initial: OrgProfileLegalInfo;
  organizationName: string;
  readOnly: boolean;
};

type LegalFormValues = {
  taxCode: string;
  address: string;
  representativeName: string;
  representativeTitle: string;
  businessType: string;
  businessField: string;
};

const AUTOSAVE_DEBOUNCE_MS = 1000;

export function LegalInfoForm({
  initial,
  organizationName,
  readOnly,
}: LegalInfoFormProps) {
  const form = useForm<LegalFormValues>({
    resolver: zodResolver(legalInfoInternal),
    defaultValues: {
      taxCode: initial.taxCode ?? '',
      address: initial.address ?? '',
      representativeName: initial.representativeName ?? '',
      representativeTitle: initial.representativeTitle ?? '',
      businessType: initial.businessType ?? '',
      businessField: initial.businessField ?? '',
    },
    mode: 'onBlur',
  });

  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = React.useRef<string>(JSON.stringify(form.getValues()));

  const triggerSave = React.useCallback(
    async (values: LegalFormValues) => {
      try {
        setSaveState('saving');
        await updateMyProfile({ legalInfo: values });
        lastSavedRef.current = JSON.stringify(values);
        setSaveState('saved');
        // Auto-revert to idle after 2s for less visual noise
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        setSaveState('error');
        toast.error(
          err instanceof Error
            ? err.message
            : 'Không thể lưu thông tin pháp lý. Vui lòng thử lại.',
        );
      }
    },
    [],
  );

  // Watch all values + debounce save
  React.useEffect(() => {
    if (readOnly) return;
    const subscription = form.watch((values) => {
      const serialized = JSON.stringify(values);
      if (serialized === lastSavedRef.current) return;

      // Validate before saving — invalid entries skip save (user fixes via UI errors)
      const valid = legalInfoInternal.safeParse(values);
      if (!valid.success) {
        setSaveState('idle');
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void triggerSave(valid.data as LegalFormValues);
      }, AUTOSAVE_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, readOnly, triggerSave]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Thông tin pháp lý</CardTitle>
            <CardDescription>
              Thông tin cơ bản của đơn vị theo giấy đăng ký kinh doanh / quyết định thành lập.
            </CardDescription>
          </div>
          <SaveIndicator state={saveState} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-slate-700">Tên đơn vị</Label>
          <Input value={organizationName} readOnly disabled className="bg-slate-50" />
          <p className="text-xs text-slate-500">
            Tên đơn vị được khóa theo dữ liệu hệ thống — vui lòng liên hệ Ban quản lý nếu cần điều chỉnh.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="taxCode" className="text-slate-700">
              Mã số thuế <span className="text-red-600">*</span>
            </Label>
            <Input
              id="taxCode"
              {...form.register('taxCode')}
              placeholder="0100123456"
              disabled={readOnly}
              aria-invalid={!!form.formState.errors.taxCode}
            />
            {form.formState.errors.taxCode ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.taxCode.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="businessType" className="text-slate-700">
              Loại hình tổ chức
            </Label>
            <Input
              id="businessType"
              {...form.register('businessType')}
              placeholder="Hiệp hội ngành nghề / Doanh nghiệp / Tập đoàn"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address" className="text-slate-700">
            Địa chỉ trụ sở <span className="text-red-600">*</span>
          </Label>
          <Input
            id="address"
            {...form.register('address')}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
            disabled={readOnly}
            aria-invalid={!!form.formState.errors.address}
          />
          {form.formState.errors.address ? (
            <p className="text-xs text-red-600">
              {form.formState.errors.address.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="representativeName" className="text-slate-700">
              Người đại diện theo pháp luật <span className="text-red-600">*</span>
            </Label>
            <Input
              id="representativeName"
              {...form.register('representativeName')}
              placeholder="Họ và tên đầy đủ"
              disabled={readOnly}
              aria-invalid={!!form.formState.errors.representativeName}
            />
            {form.formState.errors.representativeName ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.representativeName.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="representativeTitle" className="text-slate-700">
              Chức danh người đại diện
            </Label>
            <Input
              id="representativeTitle"
              {...form.register('representativeTitle')}
              placeholder="Chủ tịch / Tổng Giám đốc / ..."
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="businessField" className="text-slate-700">
            Lĩnh vực hoạt động
          </Label>
          <Input
            id="businessField"
            {...form.register('businessField')}
            placeholder="Ví dụ: Da giày xuất khẩu / Dệt may / Thủy sản"
            disabled={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SaveIndicator({
  state,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
}) {
  if (state === 'idle') return null;
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Đang lưu...
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Đã lưu
      </span>
    );
  }
  return (
    <span className="text-xs text-red-600">Lưu thất bại</span>
  );
}

export default LegalInfoForm;
