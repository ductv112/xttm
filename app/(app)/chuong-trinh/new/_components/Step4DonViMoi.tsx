'use client';

// Step 4 — Đơn vị mời (CYCLE-04)
// 2 MultiSelect: invitedOrganizationIds (required) + emailTemplateIds (optional)
// Quick action: "Chọn tất cả đơn vị" prefill từ organizations prop

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/shared/MultiSelect';

import { useWizardStore } from '../_lib/wizardStore';
import { Step4Schema, type Step4Input } from '../_lib/schemas';
import type { OrganizationOption, EmailTemplateOption } from '../_lib/types';
import type { StepHandle } from './CycleWizardShell';

export type Step4Props = {
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};

const ORG_TYPE_LABELS: Record<string, string> = {
  ASSOCIATION: 'Hiệp hội',
  ENTERPRISE: 'Doanh nghiệp',
  RESEARCH_INSTITUTE: 'Viện / Trường',
  GOVERNMENT: 'Cơ quan nhà nước',
  OTHER: 'Khác',
};

function buildOrgLabel(o: OrganizationOption): string {
  const typeLabel = ORG_TYPE_LABELS[o.type] ?? o.type;
  return `${o.name} · ${typeLabel}`;
}

export const Step4DonViMoi = React.forwardRef<StepHandle, Step4Props>(
  function Step4DonViMoi({ organizations, emailTemplates }, ref) {
    const stored = useWizardStore((s) => s.formData.step4);
    const setStepData = useWizardStore((s) => s.setStepData);

    const form = useForm<Step4Input>({
      resolver: zodResolver(Step4Schema),
      mode: 'onSubmit',
      defaultValues: {
        invitedOrganizationIds: stored?.invitedOrganizationIds ?? [],
        emailTemplateIds: stored?.emailTemplateIds ?? [],
      },
    });

    const {
      control,
      handleSubmit,
      formState: { errors },
      setValue,
      getValues,
    } = form;

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          let valid = false;
          await handleSubmit(
            (data) => {
              setStepData('step4', {
                invitedOrganizationIds: data.invitedOrganizationIds,
                emailTemplateIds: data.emailTemplateIds ?? [],
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

    const orgOptions = React.useMemo(
      () =>
        organizations.map((o) => ({
          value: o.id,
          label: buildOrgLabel(o),
        })),
      [organizations],
    );

    const templateOptions = React.useMemo(
      () =>
        emailTemplates.map((t) => ({
          value: t.id,
          label: t.name,
        })),
      [emailTemplates],
    );

    const handleSelectAllOrgs = () => {
      const allIds = organizations.map((o) => o.id);
      setValue('invitedOrganizationIds', allIds, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    const selectedOrgCount = (getValues('invitedOrganizationIds') ?? []).length;

    return (
      <form className="space-y-6" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 4: Đơn vị mời
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn đơn vị được mời tham gia chu kỳ và (tùy chọn) mẫu công văn / email mời
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="step4-orgs">
              Đơn vị mời tham gia <span className="text-red-600">*</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllOrgs}
            >
              Chọn tất cả ({organizations.length})
            </Button>
          </div>
          <Controller
            control={control}
            name="invitedOrganizationIds"
            render={({ field }) => (
              <MultiSelect
                id="step4-orgs"
                options={orgOptions}
                values={field.value}
                onChange={field.onChange}
                placeholder="Chọn đơn vị mời"
                searchPlaceholder="Tìm theo tên đơn vị..."
                maxBadgesShown={6}
              />
            )}
          />
          {errors.invitedOrganizationIds ? (
            <p className="text-sm text-red-600">
              {errors.invitedOrganizationIds.message?.toString()}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Đã chọn {selectedOrgCount} đơn vị — chọn các hiệp hội ngành hàng /
              doanh nghiệp / viện được mời nộp đề án
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="step4-templates">Mẫu công văn / email mời</Label>
          <Controller
            control={control}
            name="emailTemplateIds"
            render={({ field }) => (
              <MultiSelect
                id="step4-templates"
                options={templateOptions}
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="Chọn mẫu (có thể bỏ trống)"
                searchPlaceholder="Tìm mẫu..."
                maxBadgesShown={3}
              />
            )}
          />
          {errors.emailTemplateIds ? (
            <p className="text-sm text-red-600">
              {errors.emailTemplateIds.message?.toString()}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Có thể bỏ trống — soạn nội dung trực tiếp khi gửi thông báo từ tab
              Đơn vị mời + thông báo
            </p>
          )}
        </div>
      </form>
    );
  },
);
