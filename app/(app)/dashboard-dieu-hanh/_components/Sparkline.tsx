'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

import { cn } from '@/lib/utils';

type Props = {
  data: number[];
  color?: string;
  className?: string;
};

export function Sparkline({ data, color = '#1d4ed8', className }: Props) {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <div className={cn('h-8 w-24', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
