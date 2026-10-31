import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  Download,
  Percent,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import { FinancialKPIs } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { formatINR } from '../../utils/formatters';

export const Analytics: React.FC = () => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [mrrTrend, setMrrTrend] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [kRes, tRes, pRes] = await Promise.all([
          analyticsService.getKpis(),
          analyticsService.getMrrTrend(),
          analyticsService.getPlanDistribution()
        ]);
        if (kRes.data.success) setKpis(kRes.data);
        if (tRes.data.success) setMrrTrend(tRes.data.trend);
        if (pRes.data.success) setPlanDistribution(pRes.data.distribution);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader rows={8} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Revenue Analytics & Financial Modeling</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Cohort retention, customer lifetime value (LTV), collection efficiency, and revenue waterfalls.
          </p>
        </div>

        <a
          href={analyticsService.exportCsvUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-bordergrey bg-white px-3 py-1.5 text-xs font-semibold text-obsidian shadow-subtle hover:bg-ivory transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-forest" />
          <span>Export Financial Snapshot (CSV)</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatINR(kpis?.mrrInPaise || 0)}
          trend="+14.2%"
          subtext="Net normalized MRR"
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={true}
        />

        <StatCard
          title="Annualized Run-Rate (ARR)"
          value={formatINR(kpis?.arrInPaise || 0)}
          trend="+18.5%"
          subtext="MRR × 12 months"
          icon={<CreditCard className="h-4 w-4" />}
        />

        <StatCard
          title="Customer Lifetime Value"
          value={formatINR(kpis?.ltvInPaise || 0)}
          subtext="Mean collections per customer"
          icon={<Users className="h-4 w-4" />}
        />

        <StatCard
          title="Collection Rate"
          value={`${kpis?.collectionRate || 100}%`}
          trend="+2.1%"
          subtext="Invoiced to cash conversion"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-obsidian tracking-tight">MRR Waterfall Growth</h3>
          <p className="text-xs text-slategrey mb-4">Net expansion & recurring customer acquisition</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEFE7" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737C77' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737C77' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'MRR']} />
                <Area type="monotone" dataKey="mrr" stroke="#263D32" strokeWidth={2.5} fill="#C5F36A" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-obsidian tracking-tight">Revenue Generation by Plan Tier</h3>
          <p className="text-xs text-slategrey mb-4">Total revenue generated per pricing plan (in INR)</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planDistribution.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEFE7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737C77' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737C77' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Total Revenue']} />
                <Bar dataKey="revenueINR" fill="#263D32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
