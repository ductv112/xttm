'use client';

// ProfileTimeline — vertical timeline hiển thị lifecycle events của hồ sơ:
// created → updated → submitted → approved/rejected.
// Use case: cho user thấy lịch sử tương tác với hồ sơ (Phase 4 mock).

import * as React from 'react';
import { CheckCircle2, Circle, FileText, Send, XCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrgProfileStatus } from '@/lib/workflows/orgProfile';

export type ProfileTimelineProps = {
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedByName: string | null;
  status: OrgProfileStatus;
  rejectionReason: string | null;
};

type TimelineEvent = {
  id: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  detail?: string | null;
  timestamp: Date;
};

export function ProfileTimeline({
  createdAt,
  updatedAt,
  submittedAt,
  approvedAt,
  approvedByName,
  status,
  rejectionReason,
}: ProfileTimelineProps) {
  const events: TimelineEvent[] = [];

  events.push({
    id: 'created',
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
    iconClass: 'bg-slate-100 text-slate-700',
    title: 'Hồ sơ được khởi tạo',
    timestamp: createdAt,
  });

  if (
    updatedAt.getTime() - createdAt.getTime() > 5_000 &&
    (!submittedAt || updatedAt.getTime() < submittedAt.getTime())
  ) {
    events.push({
      id: 'updated',
      icon: <Circle className="h-4 w-4" aria-hidden="true" />,
      iconClass: 'bg-blue-50 text-blue-700',
      title: 'Cập nhật nội dung',
      timestamp: updatedAt,
    });
  }

  if (submittedAt) {
    events.push({
      id: 'submitted',
      icon: <Send className="h-4 w-4" aria-hidden="true" />,
      iconClass: 'bg-amber-50 text-amber-700',
      title: 'Đã gửi xác nhận tới Ban quản lý',
      timestamp: submittedAt,
    });
  }

  if (approvedAt && status === 'APPROVED') {
    events.push({
      id: 'approved',
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      iconClass: 'bg-emerald-50 text-emerald-700',
      title: 'Hồ sơ được phê duyệt',
      detail: approvedByName ? `Phê duyệt bởi ${approvedByName}` : null,
      timestamp: approvedAt,
    });
  }

  if (status === 'REJECTED' && rejectionReason) {
    events.push({
      id: 'rejected',
      icon: <XCircle className="h-4 w-4" aria-hidden="true" />,
      iconClass: 'bg-red-50 text-red-700',
      title: 'Yêu cầu bổ sung từ Ban quản lý',
      detail: rejectionReason.length > 100 ? rejectionReason.slice(0, 100) + '...' : rejectionReason,
      timestamp: updatedAt, // best approximation — rejection updates updatedAt
    });
  }

  // Sort newest first
  const sorted = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lịch sử hồ sơ</CardTitle>
        <CardDescription>
          Các mốc thay đổi trạng thái của hồ sơ tổ chức.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-3">
          {sorted.map((event, idx) => (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full',
                    event.iconClass,
                  )}
                >
                  {event.icon}
                </div>
                {idx < sorted.length - 1 ? (
                  <div className="my-1 w-px flex-1 bg-slate-200" aria-hidden="true" />
                ) : null}
              </div>
              <div className="flex-1 pb-3">
                <p className="text-sm font-medium text-slate-900">{event.title}</p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(event.timestamp)}
                </p>
                {event.detail ? (
                  <p className="mt-1 text-xs text-slate-700">{event.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default ProfileTimeline;
