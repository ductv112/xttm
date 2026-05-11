'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { FilterBar, type FilterState } from './FilterBar';
import { HeroKpiRow } from './HeroKpiRow';
import { InsightCharts } from './InsightCharts';
import { KpiDrillDownSheet } from './KpiDrillDownSheet';
import { KpiMatrixTable } from './KpiMatrixTable';
import { QualitativeHeatmap } from './QualitativeHeatmap';
import { HERO_KPIS } from '../_data/mock-kpi';

export function DashboardClient() {
  const [filter, setFilter] = useState<FilterState>({
    year: 2026,
    compareYear: 2025,
    kind: 'ALL',
    sector: 'ALL',
    market: 'ALL',
  });
  const [activeKpi, setActiveKpi] = useState<string | null>(null);

  const handleExport = () => {
    toast.success('Đã tạo báo cáo điều hành PDF', {
      description: `Báo cáo chỉ tiêu chu kỳ ${filter.year} đã sẵn sàng tải về`,
    });
  };

  return (
    <>
      <FilterBar value={filter} onChange={setFilter} onExport={handleExport} />

      <section aria-labelledby="hero-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="hero-heading" className="text-base font-semibold text-slate-900">
            Chỉ tiêu cốt lõi
          </h2>
          <p className="text-xs text-slate-500">
            Click một thẻ để xem phân tích chi tiết chỉ tiêu tương ứng
          </p>
        </div>
        <HeroKpiRow items={HERO_KPIS} onSelect={(id) => setActiveKpi(id)} />
      </section>

      <section aria-labelledby="charts-heading" className="space-y-3">
        <h2 id="charts-heading" className="text-base font-semibold text-slate-900">
          Phân tích & xu hướng
        </h2>
        <InsightCharts />
      </section>

      <section aria-labelledby="matrix-heading" className="space-y-3">
        <h2 id="matrix-heading" className="text-base font-semibold text-slate-900">
          Bảng tổng hợp chỉ tiêu
        </h2>
        <KpiMatrixTable onSelectKpi={(id) => setActiveKpi(id)} />
      </section>

      <section aria-labelledby="qual-heading" className="space-y-3">
        <h2 id="qual-heading" className="text-base font-semibold text-slate-900">
          Đánh giá định tính
        </h2>
        <QualitativeHeatmap />
      </section>

      <KpiDrillDownSheet
        kpiId={activeKpi}
        onOpenChange={(open) => {
          if (!open) setActiveKpi(null);
        }}
      />
    </>
  );
}
