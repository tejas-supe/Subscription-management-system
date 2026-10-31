import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  AlertCircle,
  FileCheck,
  Download,
  Activity,
  ShieldAlert,
  Zap,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { Loader } from '../../components/common/Loader';
import { FinancialKPIs, Invoice, Payment } from '../../types';
import { formatINR } from '../../utils/formatters';

const CHART_COLORS = ['#C5F36A', '#263D32', '#737C77', '#A5B5A4', '#171B19', '#EBE7D8'];

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [mrrTrend, setMrrTrend] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [leakageSummary, setLeakageSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      setLoadError('');
      const [kpiRes, trendRes, planRes, payRes, renRes, healthRes, leakRes] = await Promise.all([
        analyticsService.getKpis(dateRange),
        analyticsService.getMrrTrend(),
        analyticsService.getPlanDistribution(),
        paymentService.list(),
        analyticsService.getRenewals(),
        analyticsService.getHealthMonitor(),
        analyticsService.getRevenueSentinel(),
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data);
      if (trendRes.data.success) setMrrTrend(trendRes.data.trend);
      if (planRes.data.success) setPlanDistribution(planRes.data.distribution);
      if (payRes.data.success) setRecentPayments(payRes.data.payments.slice(0, 5));
      if (renRes.data.success) setUpcomingRenewals(renRes.data.window7Days.slice(0, 4));
      if (healthRes.data.success) setHealthSummary(healthRes.data.summary);
      if (leakRes.data.success) setLeakageSummary(leakRes.data.summary);
    } catch (err: any) {
      console.error('Dashboard load failed:', err);
      setLoadError(err.response?.data?.message || err.message || 'Unable to connect to financial analytics service. Please verify backend is active.');
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
    return <Loader rows={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => { setLoading(true); loadDashboardData(); }}
            className="px-3 py-1 bg-white border border-rose-300 rounded-md font-semibold hover:bg-rose-100 text-rose-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

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

          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg border border-bordergrey bg-white text-slategrey hover:text-obsidian hover:bg-ivory shadow-subtle transition-all ${
              refreshing ? 'animate-spin text-forest' : ''
            }`}
            title="Refresh calculations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <a
            href={analyticsService.exportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-bordergrey bg-white px-3 py-1.5 text-xs font-semibold text-obsidian shadow-subtle hover:bg-ivory transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-forest" />
            <span>Export Snapshot</span>
          </a>
        </div>
      </div>

      {/* Intelligence Sentinel Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => navigate('/admin/revenue-sentinel?tab=health')}
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
          onClick={() => navigate('/admin/revenue-sentinel?tab=leakage')}
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
          onClick={() => navigate('/admin/revenue-sentinel?tab=renewals')}
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
                {upcomingRenewals.length} renewals due in next 7 days
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-sage group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatINR(kpis?.mrrInPaise || 0)}
          trend={kpis?.trends.mrrChange}
          subtext="vs last period"
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={true}
        />

        <StatCard
          title="Annual Recurring Revenue"
          value={formatINR(kpis?.arrInPaise || 0)}
          trend={kpis?.trends.arrChange}
          subtext="Run-rate"
          icon={<CreditCard className="h-4 w-4" />}
        />

        <StatCard
          title="Active Subscriptions"
          value={String(kpis?.activeSubscriptions || 0)}
          trend={kpis?.trends.activeSubsChange}
          subtext="Paying accounts"
          icon={<Repeat className="h-4 w-4" />}
        />

        <StatCard
          title="Total Customers"
          value={String(kpis?.totalCustomers || 0)}
          subtext="Verified business profiles"
          icon={<Users className="h-4 w-4" />}
        />

        <StatCard
          title="Churn Rate"
          value={`${kpis?.churnRate || 0}%`}
          trend={kpis?.trends.churnChange}
          trendPositive={false}
          subtext="Industry benchmark < 3%"
          icon={<AlertCircle className="h-4 w-4" />}
        />

        <StatCard
          title="Outstanding Revenue"
          value={formatINR(kpis?.outstandingInPaise || 0)}
          trend={kpis?.trends.outstandingChange}
          subtext="Due across invoices"
          icon={<FileCheck className="h-4 w-4" />}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={mrrTrend} />
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

      {/* Recent Activity component */}
      <RecentActivity
        payments={recentPayments}
        upcomingRenewals={upcomingRenewals}
        onViewAllPayments={() => navigate('/admin/payments')}
        onViewAllRenewals={() => navigate('/admin/revenue-sentinel?tab=renewals')}
      />
    </div>
  );
};
