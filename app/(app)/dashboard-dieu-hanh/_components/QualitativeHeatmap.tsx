'use client';

import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUALITATIVE_HEATMAP } from '../_data/mock-kpi';

// Map score 1.0 - 5.0 to color tone
function toneFromScore(score: number): { bg: string; text: string; label: string } {
  if (score >= 4.5) return { bg: 'bg-emerald-600', text: 'text-white', label: 'Rất tốt' };
  if (score >= 4.0) return { bg: 'bg-emerald-400', text: 'text-emerald-950', label: 'Tốt' };
  if (score >= 3.5) return { bg: 'bg-amber-300', text: 'text-amber-950', label: 'Khá' };
  if (score >= 3.0) return { bg: 'bg-orange-300', text: 'text-orange-950', label: 'Trung bình' };
  return { bg: 'bg-red-400', text: 'text-white', label: 'Cần cải thiện' };
}

export function QualitativeHeatmap() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Đánh giá định tính — Heatmap thang điểm 1-5
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            16 tiêu chí trên 4 phương diện · so sánh với kỳ trước · điểm TB từ phiếu báo cáo các đề án
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <Swatch className="bg-red-400" label="< 3,0" />
          <Swatch className="bg-orange-300" label="3,0-3,4" />
          <Swatch className="bg-amber-300" label="3,5-3,9" />
          <Swatch className="bg-emerald-400" label="4,0-4,4" />
          <Swatch className="bg-emerald-600" label="≥ 4,5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUALITATIVE_HEATMAP.map((cat) => (
          <div
            key={cat.category}
            className="rounded-md border border-slate-100 bg-slate-50/40 p-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
              {cat.category}
            </h4>
            <ul className="space-y-1.5">
              {cat.rows.map((r) => {
                const tone = toneFromScore(r.score);
                const delta = r.score - r.previousScore;
                const TrendIcon =
                  delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
                const trendColor =
                  delta > 0.05
                    ? 'text-emerald-600'
                    : delta < -0.05
                    ? 'text-red-600'
                    : 'text-slate-400';
                return (
                  <li
                    key={r.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex-1 text-slate-800 truncate" title={r.label}>
                      {r.label}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 text-xs', trendColor)}>
                      <TrendIcon className="h-3 w-3" aria-hidden="true" />
                      {delta > 0 ? '+' : ''}
                      {delta.toFixed(1)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[44px] h-7 px-2 rounded-md text-xs font-bold tabular-nums shadow-sm',
                        tone.bg,
                        tone.text,
                      )}
                      title={tone.label}
                    >
                      {r.score.toFixed(1)} ★
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('block h-2.5 w-4 rounded-sm', className)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
