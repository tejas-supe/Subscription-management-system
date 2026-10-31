import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  AlertCircle,
  FileCheck,
  Calendar,
  ArrowRight,
  Download,
  Activity,
  ShieldAlert,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { analyticsApi, intelligenceApi, invoiceApi, subscriptionApi, paymentApi } from '../services/api';
import { FinancialKPIs, Invoice, Payment, Subscription } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { formatINR, formatDate } from '../utils/formatters';

const CHART_COLORS = ['#C5F36A', '#263D32', '#737C77', '#A5B5A4', '#171B19', '#EBE7D8'];

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [mrrTrend, setMrrTrend] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [leakageSummary, setLeakageSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const [kpiRes, trendRes, planRes, invRes, payRes, renRes, healthRes, leakRes] = await Promise.all([
        analyticsApi.getKpis(dateRange),
        analyticsApi.getMrrTrend(),
        analyticsApi.getPlanDistribution(),
        invoiceApi.list(),
        paymentApi.list(),
        intelligenceApi.getRenewals(),
        intelligenceApi.getHealthMonitor(),
        intelligenceApi.getRevenueAlerts(),
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data);
      if (trendRes.data.success) setMrrTrend(trendRes.data.trend);
      if (planRes.data.success) setPlanDistribution(planRes.data.distribution);
      if (invRes.data.success) setRecentInvoices(invRes.data.invoices.slice(0, 5));
      if (payRes.data.success) setRecentPayments(payRes.data.payments.slice(0, 5));
      if (renRes.data.success) setUpcomingRenewals(renRes.data.window7Days.slice(0, 4));
      if (healthRes.data.success) setHealthSummary(healthRes.data.summary);
      if (leakRes.data.success) setLeakageSummary(leakRes.data.summary);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <SkeletonLoader rows={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">
            Revenue Command Center
          </h2>
          <p className="text-xs text-slategrey mt-0.5">
            Real-time subscription metrics, cashflow pipeline & financial intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Date range filter */}
          <div className="flex rounded-lg border border-bordergrey bg-white p-0.5 shadow-subtle text-xs">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-obsidian text-chartreuse shadow-xs'
                    : 'text-slategrey hover:text-obsidian'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg border border-bordergrey bg-white text-slategrey hover:text-obsidian hover:bg-ivory shadow-subtle transition-all ${
              refreshing ? 'animate-spin text-forest' : ''
            }`}
            title="Refresh calculations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Snapshot Export CSV */}
          <a
            href={analyticsApi.exportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-bordergrey bg-white px-3 py-1.5 text-xs font-semibold text-obsidian shadow-subtle hover:bg-ivory transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-forest" />
            <span>Export Snapshot</span>
          </a>
        </div>
      </div>

      {/* Differentiator Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => navigate('/health-monitor')}
          className="cursor-pointer flex items-center justify-between p-3.5 rounded-xl border border-bordergrey bg-white hover:border-forest/40 transition-all shadow-subtle group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-obsidian group-hover:text-forest transition-colors">
                Subscription Health
              </p>
              <p className="text-[11px] text-slategrey">
                {healthSummary?.healthy || 0} Healthy • {healthSummary?.atRisk || 0} At Risk • {healthSummary?.critical || 0} Critical
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-sage group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => navigate('/leakage-alerts')}
          className="cursor-pointer flex items-center justify-between p-3.5 rounded-xl border border-bordergrey bg-white hover:border-forest/40 transition-all shadow-subtle group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-obsidian group-hover:text-forest transition-colors">
                Revenue Leakage Alerts
              </p>
              <p className="text-[11px] text-slategrey">
                {leakageSummary ? formatINR(leakageSummary.totalLeakagePaise) : '₹0'} uncollected
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-sage group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => navigate('/smart-renewals')}
          className="cursor-pointer flex items-center justify-between p-3.5 rounded-xl border border-bordergrey bg-white hover:border-forest/40 transition-all shadow-subtle group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-chartreuse/30 text-obsidian flex items-center justify-center border border-chartreuse/50">
              <Zap className="h-4 w-4 text-forest" />
            </div>
            <div>
              <p className="text-xs font-semibold text-obsidian group-hover:text-forest transition-colors">
                Smart Renewal Center
              </p>
              <p className="text-[11px] text-slategrey">
                {upcomingRenewals.length} renewals arriving in next 7 days
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-sage group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatINR(kpis?.mrrInPaise || 0)}
          trend={kpis?.trends.mrrChange}
          subtext="vs last period"
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={true}
        />

        <MetricCard
          title="Annual Recurring Revenue"
          value={formatINR(kpis?.arrInPaise || 0)}
          trend={kpis?.trends.arrChange}
          subtext="Run-rate"
          icon={<CreditCard className="h-4 w-4" />}
        />

        <MetricCard
          title="Active Subscriptions"
          value={String(kpis?.activeSubscriptions || 0)}
          trend={kpis?.trends.activeSubsChange}
          subtext="Paying accounts"
          icon={<Repeat className="h-4 w-4" />}
        />

        <MetricCard
          title="Total Customers"
          value={String(kpis?.totalCustomers || 0)}
          subtext="Verified business profiles"
          icon={<Users className="h-4 w-4" />}
        />

        <MetricCard
          title="Churn Rate"
          value={`${kpis?.churnRate || 0}%`}
          trend={kpis?.trends.churnChange}
          trendPositive={false}
          subtext="Industry benchmark < 3%"
          icon={<AlertCircle className="h-4 w-4" />}
        />

        <MetricCard
          title="Outstanding Revenue"
          value={formatINR(kpis?.outstandingInPaise || 0)}
          trend={kpis?.trends.outstandingChange}
          subtext="Due across invoices"
          icon={<FileCheck className="h-4 w-4" />}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Growth Over Time Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle">
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
              <AreaChart data={mrrTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#mrrGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution by Plan */}
        <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-obsidian tracking-tight">Revenue by Plan</h3>
            <p className="text-xs text-slategrey">Distribution of subscribers across pricing tiers</p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {planDistribution.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#171B19" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: any, item: any) => [
                      `${val} subscriptions (${formatINR(item.payload.revenueInPaise)})`,
                      item.payload.name
                    ]}
                    contentStyle={{ backgroundColor: '#171B19', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-bordergrey">
            {planDistribution.slice(0, 4).map((p, idx) => (
              <div key={p.planId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate max-w-[160px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="truncate text-obsidian font-medium">{p.name}</span>
                </div>
                <span className="font-semibold text-obsidian tabular-nums">{p.count} subs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Transactions & Overdue/Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-obsidian tracking-tight">Recent Transactions</h3>
              <p className="text-xs text-slategrey">Latest recorded payments and gateway settlements</p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-bordergrey overflow-x-auto">
            {recentPayments.map((p) => (
              <div key={p._id} className="py-3 flex items-center justify-between text-xs hover:bg-ivory/50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-ivory flex items-center justify-center font-bold text-[11px] text-forest border border-bordergrey">
                    {p.method === 'UPI' ? 'UPI' : p.method === 'Card' ? 'CRD' : 'BNK'}
                  </div>
                  <div>
                    <p className="font-semibold text-obsidian">{p.customerId?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slategrey">{p.paymentNumber} • {formatDate(p.paymentDate)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-obsidian tabular-nums">{formatINR(p.amountInPaise)}</p>
                  <StatusBadge status={p.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals Window */}
        <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-obsidian tracking-tight">Upcoming Renewals (Next 7 Days)</h3>
              <p className="text-xs text-slategrey">Subscriptions with billing cycle renewal due</p>
            </div>
            <button
              onClick={() => navigate('/smart-renewals')}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Smart Renewals</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-bordergrey overflow-x-auto">
            {upcomingRenewals.map((sub: Subscription) => (
              <div key={sub._id} className="py-3 flex items-center justify-between text-xs hover:bg-ivory/50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-chartreuse/20 flex items-center justify-center text-forest border border-chartreuse/40">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-obsidian">{sub.customerId?.name}</p>
                    <p className="text-[11px] text-slategrey">{sub.planId?.name} ({sub.billingInterval})</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-obsidian tabular-nums">{formatINR(sub.unitPriceInPaise * (sub.quantity || 1))}</p>
                  <span className="text-[11px] font-medium text-emerald-800">
                    Due {formatDate(sub.nextBillingDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
