'use client';

// SubmissionGate — 3-state banner cho cổng tiếp nhận đề án (PROJ-01, PROJ-03).
//
// State A: cycle && profile.status==='APPROVED' → green, button "Tạo đề án mới" enabled
// State B: cycle && profile.status!=='APPROVED' → yellow, button disabled, hướng dẫn hoàn tất hồ sơ
// State C: !cycle                                → gray, button disabled, "Hiện chưa có đợt mời nào đang mở"

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  AlertTriangle,
  CalendarOff,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export type SubmissionGateProps = {
  cycle: {
    id: string;
    year: number;
    name: string;
    registrationCloseAt: Date | null;
  } | null;
  profile: {
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;
  };
};

export function SubmissionGate({ cycle, profile }: SubmissionGateProps) {
  // --- State C: no active cycle ---
  if (!cycle) {
    return (
      <div
        className={cn(
          'rounded-lg border border-slate-200 bg-slate-50 px-5 py-4',
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CalendarOff
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Hiện chưa có đợt mời đề xuất nào đang mở
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              Chu kỳ chương trình XTTM tiếp theo sẽ được Ban quản lý thông báo
              qua email và hệ thống. Vui lòng theo dõi mục Thông báo.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          title="Chu kỳ chương trình tiếp theo sẽ được thông báo qua email"
        >
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Tạo đề án mới
        </Button>
      </div>
    );
  }

  // --- State B: cycle open but profile not APPROVED ---
  if (profile.status !== 'APPROVED') {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-200 bg-amber-50 px-5 py-4',
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Hồ sơ đơn vị chưa được phê duyệt
            </p>
            <p className="mt-0.5 text-sm text-amber-800">
              Đợt mời {cycle.name} đang mở
              {cycle.registrationCloseAt
                ? ` — hạn ${formatDate(cycle.registrationCloseAt)}`
                : ''}
              . Để được phép tạo đề án, vui lòng hoàn tất hồ sơ tổ chức và chờ
              Ban quản lý phê duyệt.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="border-amber-300">
          <Link href="/don-vi-cua-toi">
            Hoàn tất hồ sơ
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  // --- State A: cycle open + profile APPROVED ---
  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CalendarCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Đợt mời đề xuất {cycle.year} đang mở
            {cycle.registrationCloseAt
              ? ` — hạn nộp ${formatDate(cycle.registrationCloseAt)}`
              : ''}
          </p>
          <p className="mt-0.5 text-sm text-emerald-800">
            {cycle.name}. Vui lòng khai báo đầy đủ thông tin và nộp đề án trước
            hạn để Ban quản lý kịp thẩm định.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/de-an/new">
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Tạo đề án mới
        </Link>
      </Button>
    </div>
  );
}

export default SubmissionGate;
