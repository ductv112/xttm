// DashboardStatsRow — 4 stat cards: số đề án, kinh phí, đơn vị tham gia, tiến độ.
// Client component — lucide icons (ForwardRef components) cannot cross RSC boundary.
'use client';

import {
  FileText,
  Wallet,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

import { StatCard } from '@/components/shared/program-cycle/StatCard';
import { formatVNDCompact, formatNumber } from '@/lib/format';
import type { DashboardStats } from '@/lib/dashboard-aggregations';

type Props = {
  stats: DashboardStats;
  year: number;
};

export function DashboardStatsRow({ stats, year }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link
        href={`/de-an?year=${year}`}
        aria-label="Xem danh sách đề án"
        className="block transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-lg"
      >
        <StatCard
          label="Số đề án năm"
          value={formatNumber(stats.projectCount)}
          icon={FileText}
          tone="info"
          subtitle={`${stats.registeredProjectCount} đăng ký · ${stats.approvedProjectCount} duyệt · ${stats.inProgressProjectCount} triển khai`}
        />
      </Link>

      <Link
        href={`/tai-chinh?year=${year}`}
        aria-label="Xem chi tiết tài chính"
        className="block transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-lg"
      >
        <StatCard
          label="Tổng kinh phí năm"
          value={formatVNDCompact(stats.registeredBudget)}
          icon={Wallet}
          tone="success"
          subtitle={`Duyệt: ${formatVNDCompact(stats.approvedBudget)} · Giải ngân: ${formatVNDCompact(stats.disbursedBudget)}`}
        />
      </Link>

      <Link
        href="/don-vi-chu-tri"
        aria-label="Xem danh sách đơn vị chủ trì"
        className="block transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-lg"
      >
        <StatCard
          label="Đơn vị tham gia"
          value={formatNumber(stats.orgCount)}
          icon={Building2}
          tone="default"
          subtitle={`${stats.orgApprovedCount} đơn vị có hồ sơ duyệt`}
        />
      </Link>

      <StatCard
        label="Tiến độ chung"
        value={`${stats.completionPercent}%`}
        icon={CheckCircle2}
        tone={
          stats.completionPercent >= 60
            ? 'success'
            : stats.completionPercent >= 30
              ? 'warning'
              : 'default'
        }
        subtitle={`${stats.completedProjects} đề án đã nghiệm thu / ${stats.registeredProjectCount} đăng ký`}
      />
    </div>
  );
}
