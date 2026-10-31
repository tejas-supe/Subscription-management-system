import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: Array<{
    month: string;
    mrr: number;
    netRevenue?: number;
  }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-obsidian tracking-tight">MRR Growth Trajectory</h3>
          <p className="text-xs text-slategrey">Historical recurring revenue accumulation (in INR)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            +14.2% MoM
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C5F36A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#C5F36A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEFE7" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737C77' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#737C77' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Monthly MRR']}
              contentStyle={{ backgroundColor: '#171B19', borderColor: '#2E3532', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#263D32"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
