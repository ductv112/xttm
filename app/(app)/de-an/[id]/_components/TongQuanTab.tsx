// TongQuanTab — Tab Tổng quan của /de-an/[id].
// Client component — lucide icons cannot cross RSC boundary; receives serialized data via props.
'use client';

import * as React from 'react';
import {
  Wallet,
  FileText,
  Calendar,
  History,
  Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatVND, formatDate } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type { ProjectDetail } from '../../_actions/get-detail';
import {
  ProjectStatusTimeline,
  type ProjectTimelineEntry,
} from './ProjectStatusTimeline';

export type TongQuanTabProps = {
  project: ProjectDetail;
  /** Catalogs để resolve tên industry/market/country/promotionType */
  catalogs: {
    industrySectors: ReadonlyArray<{ id: string; name: string }>;
    markets: ReadonlyArray<{ id: string; name: string }>;
    countries: ReadonlyArray<{ id: string; name: string }>;
    promotionTypes: ReadonlyArray<{ id: string; name: string }>;
  };
  timeline: ReadonlyArray<ProjectTimelineEntry>;
};

function resolveNames(
  ids: string[] | undefined,
  catalog: ReadonlyArray<{ id: string; name: string }>,
): string[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const map = new Map(catalog.map((c) => [c.id, c.name]));
  return ids.map((id) => map.get(id) ?? id);
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 break-words">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function TongQuanTab({
  project,
  catalogs,
  timeline,
}: TongQuanTabProps) {
  const general = project.generalInfo;
  const objectives = project.objectives;
  const budget = project.budget;

  const kindLabel = PROJECT_KIND_LABELS[project.kind] ?? project.kind;
  const sectorNames = resolveNames(general.industrySectorIds, catalogs.industrySectors);
  const marketNames = resolveNames(general.marketIds, catalogs.markets);
  const countryNames = resolveNames(general.countryIds, catalogs.countries);
  const promotionTypeNames = resolveNames(
    general.promotionTypeIds,
    catalogs.promotionTypes,
  );

  const totalBudget = budget.total ?? 0;
  const documentCount = project.documents.length;
  const versionCount = project.versions.length;
  const supplementCount = project.versions.filter(
    (v) => v.reason && v.reason.toLowerCase().includes('bổ sung'),
  ).length;

  const timeStart = general.timeRange?.start;
  const timeEnd = general.timeRange?.end;
  const quarter = general.timeRange?.quarter;
  let timeRangeLabel = '—';
  if (quarter) {
    timeRangeLabel = quarter;
  } else if (timeStart && timeEnd) {
    timeRangeLabel = `${formatDate(timeStart)} → ${formatDate(timeEnd)}`;
  } else if (timeStart) {
    timeRangeLabel = `Từ ${formatDate(timeStart)}`;
  } else if (timeEnd) {
    timeRangeLabel = `Đến ${formatDate(timeEnd)}`;
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Ngân sách đăng ký"
          value={totalBudget > 0 ? formatVND(totalBudget) : '—'}
          hint={
            budget.totalState && budget.totalSelf
              ? `NN: ${formatVND(budget.totalState)} · ĐƯ: ${formatVND(budget.totalSelf)}`
              : undefined
          }
        />
        <StatCard
          icon={FileText}
          label="Số tài liệu đính kèm"
          value={`${documentCount} tệp`}
        />
        <StatCard
          icon={Calendar}
          label="Ngày nộp"
          value={project.submittedAt ? formatDate(project.submittedAt) : '—'}
          hint={
            project.submittedAt
              ? `Phiên bản hiện tại: v${project.currentVersion}`
              : 'Chưa nộp'
          }
        />
        <StatCard
          icon={History}
          label="Lịch sử bổ sung"
          value={
            supplementCount > 0
              ? `${supplementCount} lần bổ sung`
              : versionCount > 0
                ? `${versionCount} bản lưu`
                : '—'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col: 2/3 width — info + objectives */}
        <div className="space-y-6 lg:col-span-2">
          {/* Thông tin chung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Tên đề án" value={project.name} />
              <InfoRow label="Mã đề án" value={project.code} mono />
              <InfoRow label="Loại đề án" value={kindLabel} />
              <InfoRow label="Đơn vị chủ trì" value={project.organizationName} />
              <InfoRow label="Năm đề án" value={String(project.year)} />
              <InfoRow label="Thời gian thực hiện" value={timeRangeLabel} />
              {sectorNames.length > 0 ? (
                <BadgeRow label="Ngành hàng" items={sectorNames} />
              ) : null}
              {marketNames.length > 0 ? (
                <BadgeRow label="Thị trường" items={marketNames} />
              ) : null}
              {countryNames.length > 0 ? (
                <BadgeRow label="Quốc gia" items={countryNames} />
              ) : null}
              {promotionTypeNames.length > 0 ? (
                <BadgeRow
                  label="Loại hình XTTM"
                  items={promotionTypeNames}
                />
              ) : null}
              {project.pmContactSnapshot ? (
                <InfoRow
                  label="Chủ nhiệm đề án"
                  value={`${project.pmContactSnapshot.name}${
                    project.pmContactSnapshot.title
                      ? ` · ${project.pmContactSnapshot.title}`
                      : ''
                  }`}
                />
              ) : null}
            </CardContent>
          </Card>

          {/* Mục tiêu + nội dung */}
          {objectives.objective || objectives.content ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4" aria-hidden="true" />
                  Mục tiêu &amp; nội dung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {objectives.objective ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Mục tiêu
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      // Tiptap HTML output từ StarterKit (no script nodes)
                      dangerouslySetInnerHTML={{ __html: objectives.objective }}
                    />
                  </div>
                ) : null}
                {objectives.content ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Nội dung chính
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: objectives.content }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right col: 1/3 width — status timeline */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tiến trình xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectStatusTimeline
                entries={timeline}
                currentStatus={project.status}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          mono
            ? 'col-span-2 font-mono text-xs text-slate-700'
            : 'col-span-2 font-medium text-slate-900'
        }
      >
        {value}
      </span>
    </div>
  );
}

function BadgeRow({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="col-span-2 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge
            key={it}
            variant="secondary"
            className="border border-slate-200 bg-slate-50 font-normal text-slate-700"
          >
            {it}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default TongQuanTab;
