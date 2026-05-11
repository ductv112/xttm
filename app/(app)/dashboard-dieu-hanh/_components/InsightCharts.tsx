'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend as RLegend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1d4ed8', '#059669', '#d97706', '#9333ea', '#0ea5e9', '#dc2626'];

const KIND_DATA = [
  { name: 'Hội chợ triển lãm QT', count: 11, value: 68.4 },
  { name: 'Đoàn giao dịch TM', count: 7, value: 38.7 },
  { name: 'Kết nối cung cầu', count: 4, value: 22.4 },
  { name: 'Khác', count: 2, value: 12.8 },
];

const ROI_BY_PROJECT = [
  { code: 'DA-08', value: 95.2 },
  { code: 'DA-12', value: 62.1 },
  { code: 'DA-19', value: 54.7 },
  { code: 'DA-15', value: 48.3 },
  { code: 'DA-22', value: 41.2 },
  { code: 'DA-03', value: 32.8 },
  { code: 'DA-11', value: 28.4 },
  { code: 'DA-06', value: 24.7 },
];

const SECTOR_VALUE = [
  { sector: 'Nông sản & thực phẩm', contracts: 32, exportUsd: 38.2 },
  { sector: 'Dệt may', contracts: 18, exportUsd: 19.4 },
  { sector: 'Da giày', contracts: 14, exportUsd: 12.7 },
  { sector: 'Thủy sản', contracts: 16, exportUsd: 11.8 },
  { sector: 'Thủ công mỹ nghệ', contracts: 9, exportUsd: 5.3 },
];

const TREND_5Y = [
  { year: '2022', budget: 142, contracts: 38, roi: 22.5 },
  { year: '2023', budget: 168, contracts: 49, roi: 28.1 },
  { year: '2024', budget: 188, contracts: 58, roi: 32.7 },
  { year: '2025', budget: 207, contracts: 67, roi: 36.4 },
  { year: '2026', budget: 245, contracts: 89, roi: 38.5 },
];

export function InsightCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard
        title="Xu hướng 5 năm — Ngân sách · Hợp đồng · ROI"
        subtitle="So sánh dài hạn để đánh giá hiệu quả chương trình XTTM cấp quốc gia"
      >
        <div style={{ height: 280 }} className="mt-2">
          <ResponsiveContainer>
            <LineChart data={TREND_5Y} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `${v}×`}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              <RLegend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="budget"
                name="NSNN giải ngân (tỷ VNĐ)"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="contracts"
                name="Hợp đồng (HĐ)"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roi"
                name="ROI (lần)"
                stroke="#d97706"
                strokeWidth={2.5}
                strokeDasharray="4 3"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Đề án & giá trị HĐ theo loại hình XTTM"
        subtitle="Đếm đề án (donut) · Giá trị HĐ triệu USD (legend)"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 mt-2">
          <div className="md:col-span-2 relative" style={{ height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={KIND_DATA}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={({ percent }) =>
                    percent !== undefined && percent >= 0.05
                      ? `${Math.round(percent * 100)}%`
                      : ''
                  }
                  labelLine={false}
                >
                  {KIND_DATA.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                  formatter={(v, n) => [`${v} đề án`, String(n)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">24</span>
              <span className="text-xs text-slate-500">đề án</span>
            </div>
          </div>
          <ul className="md:col-span-3 space-y-2">
            {KIND_DATA.map((it, i) => (
              <li
                key={it.name}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="block h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-800 truncate">{it.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{it.count}</span>
                  <span className="text-xs text-slate-500 ml-1">đề án</span>
                  <span className="ml-2 text-xs text-emerald-700 font-semibold">
                    {it.value} tr USD
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ChartCard>

      <ChartCard
        title="ROI theo từng đề án (giá trị GD / 1đ NSNN)"
        subtitle="Top 8 đề án có hiệu suất ngân sách cao nhất kỳ này"
      >
        <div style={{ height: 280 }} className="mt-2">
          <ResponsiveContainer>
            <BarChart data={ROI_BY_PROJECT} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="code"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `${v}×`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                formatter={(v) => [`${v}×`, 'ROI']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {ROI_BY_PROJECT.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#059669' : i < 3 ? '#10b981' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-600 mt-2 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-600" />
          DA-08 dẫn đầu với 95,2× — gấp gần 2,5 lần ROI trung bình toàn năm
        </p>
      </ChartCard>

      <ChartCard
        title="Đóng góp theo ngành hàng"
        subtitle="Số hợp đồng (xanh) · Giá trị XK phát sinh triệu USD (cam)"
      >
        <div style={{ height: 280 }} className="mt-2">
          <ResponsiveContainer>
            <BarChart
              data={SECTOR_VALUE}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="sector"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                width={150}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
              <RLegend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="contracts" name="Hợp đồng" fill="#059669" radius={[0, 4, 4, 0]} />
              <Bar dataKey="exportUsd" name="XK phát sinh (tr USD)" fill="#d97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      {children}
    </div>
  );
}
