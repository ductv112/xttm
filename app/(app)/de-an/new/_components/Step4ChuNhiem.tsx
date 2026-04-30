'use client';

// Step 4 — Chủ nhiệm đề án (PROJ-08).
// Choose pmContactId từ orgProfile.contactsJson (passed via props).
// Hiển thị danh sách contacts dạng radio cards với info chi tiết. Empty state CTA
// hướng đến /don-vi-cua-toi để bổ sung đầu mối nếu chưa có.

import * as React from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { ORG_PROFILE_CONTACT_ROLE_LABELS } from '@/lib/workflows/orgProfile';

import {
  useProjectWizardStore,
  getDefaultStep4,
} from '../_lib/wizardStore';
import { Step4Schema } from '../_lib/schemas';
import type { ContactOption } from '../_lib/types';
import type { StepHandle } from './ProjectWizardShell';

export type Step4Props = {
  contacts: ContactOption[];
};

function getRoleLabel(role: string): string {
  return (
    (ORG_PROFILE_CONTACT_ROLE_LABELS as Record<string, string>)[role] ?? role
  );
}

export const Step4ChuNhiem = React.forwardRef<StepHandle, Step4Props>(
  function Step4ChuNhiem({ contacts }, ref) {
    const stored = useProjectWizardStore((s) => s.formData.step4);
    const setStepData = useProjectWizardStore((s) => s.setStepData);

    const [pmContactId, setPmContactId] = React.useState<string | null>(
      stored?.pmContactId ?? null,
    );
    const [showError, setShowError] = React.useState(false);

    // Auto-select if there's only one contact and the user has not picked yet
    React.useEffect(() => {
      if (
        !pmContactId &&
        contacts.length === 1 &&
        !stored?.pmContactId
      ) {
        const onlyId = contacts[0]!.id;
        setPmContactId(onlyId);
        setStepData('step4', { pmContactId: onlyId });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelect = (id: string) => {
      setPmContactId(id);
      setStepData('step4', { pmContactId: id });
      setShowError(false);
    };

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          const data = pmContactId
            ? { pmContactId }
            : (stored ?? getDefaultStep4());
          if (!data.pmContactId) {
            setShowError(true);
            return false;
          }
          const parsed = Step4Schema.safeParse({
            pmContactId: data.pmContactId,
          });
          if (!parsed.success) {
            setShowError(true);
            return false;
          }
          setStepData('step4', { pmContactId: data.pmContactId });
          return true;
        },
      }),
      [pmContactId, stored, setStepData],
    );

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 4: Chủ nhiệm đề án
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn người chịu trách nhiệm chính trong việc triển khai đề án. Đây
            là đầu mối liên hệ chính giữa đơn vị và Ban quản lý.
          </p>
        </div>

        {contacts.length === 0 ? (
          <EmptyState
            icon="users"
            heading="Đơn vị chưa có đầu mối liên hệ"
            description="Vui lòng bổ sung tối thiểu 1 đầu mối liên hệ trong hồ sơ đơn vị trước khi tiếp tục."
            action={{
              label: 'Bổ sung đầu mối',
              href: '/don-vi-cua-toi',
            }}
          />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {contacts.map((c) => {
                const isSelected = pmContactId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'relative flex flex-col gap-2 rounded-lg border-2 px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {isSelected ? (
                      <CheckCircle2
                        className="absolute right-3 top-3 h-5 w-5 text-blue-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <User
                          className="h-5 w-5 text-slate-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">
                          {c.title ? `${c.title} ` : ''}
                          {c.name}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {getRoleLabel(c.role)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="truncate">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{c.phone}</span>
                      </div>
                      {c.title ? (
                        <div className="flex items-center gap-1.5">
                          <Briefcase
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span className="truncate">{c.title}</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {showError && !pmContactId ? (
              <p className="text-sm text-red-600">
                Vui lòng chọn chủ nhiệm đề án từ danh sách đầu mối
              </p>
            ) : null}

            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-600">
                Cần thêm đầu mối mới? Quản lý đầu mối tại trang Hồ sơ đơn vị.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/don-vi-cua-toi" target="_blank">
                  Mở hồ sơ đơn vị
                  <ExternalLink
                    className="ml-1.5 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    );
  },
);

export default Step4ChuNhiem;
