'use client';

// TongQuanTab — default tab Tổng quan trên detail page.
// Plan 03-06 hero content: ProgramCycleStateMachineVisual (3-state machine HERO React Flow)
// + 4 StatCard grid + Hoạt động gần đây timeline.
//
// Plan 03-07: client component để wire onTransitionClick từ ProgramCycleStateMachineVisual
// vào TransitionDialog. Click reachable node trong state machine = same UX as click
// action bar button trong header.

import * as React from 'react';
import { Wallet, FileText, Users, Calendar } from 'lucide-react';

import { ProgramCycleStateMachineVisual, StatCard } from '@/components/shared/program-cycle';
import { formatVNDCompact, formatDate } from '@/lib/format';
import { formatRelative } from '@/lib/date';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';
import type { CycleDetail } from '../../_actions/types';
import { TransitionDialog } from './TransitionDialog';

export type TongQuanTabProps = {
  cycle: CycleDetail;
  canEdit: boolean;
  recentAuditEntries: ReadonlyArray<{
    id: string;
    createdAt: Date;
    userFullName: string;
    actionLabel: string;
    summary: string;
  }>;
};

function computeDaysRemaining(closeAt: Date | null): number | null {
  if (!closeAt) return null;
  const diff = closeAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function TongQuanTab({ cycle, canEdit, recentAuditEntries }: TongQuanTabProps) {
  const [transitionTarget, setTransitionTarget] =
    React.useState<ProgramCycleStatus | null>(null);

  const daysRemaining = computeDaysRemaining(cycle.registrationCloseAt);
  const showCountdown = cycle.status === 'OPEN_REGISTRATION';

  const dispatchTotalCount = cycle.dispatchSummary.reduce(
    (sum, d) => sum + d.dispatchCount,
    0
  );

  // Merge recent activity from audit entries + dispatches; pick top 5 by recency
  type ActivityItem = {
    id: string;
    timestamp: Date;
    title: string;
    subtitle: string;
  };

  const dispatchActivity: ActivityItem[] = cycle.dispatchSummary.map((d) => ({
    id: `dispatch:${d.id}`,
    timestamp: d.sentAt ?? d.createdAt,
    title: `Đã gửi thông báo: ${d.subject}`,
    subtitle: `${d.dispatchCount} đơn vị nhận`,
  }));

  const auditActivity: ActivityItem[] = recentAuditEntries.map((a) => ({
    id: `audit:${a.id}`,
    timestamp: a.createdAt,
    title: `${a.userFullName} — ${a.actionLabel}`,
    subtitle: a.summary,
  }));

  const allActivity = [...dispatchActivity, ...auditActivity]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ===== Section 1: State machine visual — Plan 03-07 wired onTransitionClick ===== */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Tiến trình chu kỳ
        </h2>
        <ProgramCycleStateMachineVisual
          currentStatus={cycle.status}
          readOnly={!canEdit}
          onTransitionClick={(target) => {
            // CLOSED → OPEN phải dùng ExtendCycleDialog (gia hạn). State machine
            // visual click trực tiếp không expose extend flow ở đây để giữ UX
            // đơn giản — user click "Mở lại để gia hạn" trong action bar header.
            if (
              cycle.status === 'CLOSED_REGISTRATION' &&
              target === 'OPEN_REGISTRATION'
            ) {
              return;
            }
            setTransitionTarget(target);
          }}
        />
      </section>

      <TransitionDialog
        open={transitionTarget !== null}
        onOpenChange={(v) => !v && setTransitionTarget(null)}
        cycle={cycle}
        target={transitionTarget}
      />

      {/* ===== Section 2: Tổng quan kỳ — 4 StatCards ===== */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Tổng quan kỳ</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng kinh phí dự kiến"
            value={
              cycle.totalBudget != null
                ? formatVNDCompact(cycle.totalBudget)
                : 'Chưa cấu hình'
            }
            icon={Wallet}
            tone="info"
          />
          <StatCard
            label="Đề án đăng ký"
            value={`${cycle.projectCount} đề án`}
            icon={FileText}
            tone="default"
            subtitle="Phase 5 sẽ hiển thị danh sách thực"
          />
          <StatCard
            label="Đơn vị mời"
            value={cycle.invitedOrganizations.length}
            icon={Users}
            tone="default"
            subtitle={
              dispatchTotalCount > 0
                ? `${dispatchTotalCount} đã gửi thông báo`
                : 'Chưa gửi thông báo'
            }
          />
          {showCountdown ? (
            <StatCard
              label="Hạn còn lại"
              value={daysRemaining != null ? `${daysRemaining} ngày` : 'Chưa cấu hình'}
              icon={Calendar}
              tone={daysRemaining != null && daysRemaining <= 7 ? 'warning' : 'default'}
              subtitle={
                cycle.registrationCloseAt
                  ? formatDate(cycle.registrationCloseAt)
                  : undefined
              }
            />
          ) : (
            <StatCard
              label="Trạng thái"
              value={
                cycle.status === 'DRAFT'
                  ? 'Đang chuẩn bị'
                  : cycle.status === 'READY'
                    ? 'Sẵn sàng mở cổng'
                    : cycle.status === 'CLOSED_REGISTRATION'
                      ? 'Đã đóng cổng'
                      : cycle.status === 'EVALUATING'
                        ? 'Đang thẩm định'
                        : cycle.status === 'APPROVED'
                          ? 'Đã phê duyệt'
                          : 'Đã hoàn thành'
              }
              icon={Calendar}
              tone="default"
              subtitle={
                cycle.registrationCloseAt
                  ? `Hạn nộp: ${formatDate(cycle.registrationCloseAt)}`
                  : undefined
              }
            />
          )}
        </div>
      </section>

      {/* ===== Section 3: Recent activity timeline ===== */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Hoạt động gần đây
        </h2>
        {allActivity.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có hoạt động nào trong chu kỳ này
          </div>
        ) : (
          <ol className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            {allActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.subtitle}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {formatRelative(item.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export default TongQuanTab;
