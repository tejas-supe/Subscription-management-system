import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  CalendarClock,
  Scale,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Download,
  AlertCircle,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { subscriptionService } from '../../services/subscriptionService';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { formatINR, formatDate, getStatusColor } from '../../utils/formatters';

export const RevenueSentinel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'health';
  const [activeTab, setActiveTab] = useState<'health' | 'leakage' | 'renewals' | 'reconciliation'>(initialTab);

  const [healthData, setHealthData] = useState<any>(null);
  const [leakageData, setLeakageData] = useState<any>(null);
  const [renewalData, setRenewalData] = useState<any>(null);
  const [reconciliationData, setReconciliationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadAllIntelligence = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [hRes, lRes, rRes, recRes] = await Promise.all([
        analyticsService.getHealthMonitor(),
        analyticsService.getRevenueSentinel(),
        analyticsService.getRenewals(),
        analyticsService.getReconciliation(),
      ]);

      if (hRes.data.success) setHealthData(hRes.data);
      if (lRes.data.success) setLeakageData(lRes.data);
      if (rRes.data.success) setRenewalData(rRes.data);
      if (recRes.data.success) setReconciliationData(recRes.data);
    } catch (err: any) {
      console.error('Revenue Sentinel load error:', err);
      setLoadError(err.response?.data?.message || err.message || 'Unable to connect to Revenue Sentinel intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllIntelligence();
  }, []);

  const handleRenewNow = async (id: string) => {
    try {
      const res = await subscriptionService.renew(id);
      alert(res.data.message);
      loadAllIntelligence();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Renewal failed');
    }
  };

  if (loading) return <Loader rows={8} />;

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={loadAllIntelligence}
            className="px-3 py-1 bg-white border border-rose-300 rounded-md font-semibold hover:bg-rose-100 text-rose-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-obsidian tracking-tight">Revenue Sentinel Intelligence</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-chartreuse text-obsidian uppercase tracking-wider">
              Automated Ops
            </span>
          </div>
          <p className="text-xs text-slategrey mt-0.5">
            Differentiator Suite: Automated churn risk detection, revenue leakage prevention, smart renewal windows & ledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadAllIntelligence}
            variant="outline"
            icon={<RefreshCw className="h-4 w-4 text-forest" />}
          >
            Re-evaluate Intelligence Rules
          </Button>
          <a
            href={analyticsService.exportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-bordergrey bg-white px-3 py-1.5 text-xs font-semibold text-obsidian shadow-subtle hover:bg-ivory transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-forest" />
            <span>Business Snapshot CSV</span>
          </a>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs gap-1">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'health'
              ? 'bg-obsidian text-chartreuse shadow-xs'
              : 'text-slategrey hover:text-obsidian'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Subscription Health Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab('leakage')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'leakage'
              ? 'bg-obsidian text-chartreuse shadow-xs'
              : 'text-slategrey hover:text-obsidian'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Revenue Leakage Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('renewals')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'renewals'
              ? 'bg-obsidian text-chartreuse shadow-xs'
              : 'text-slategrey hover:text-obsidian'
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Smart Renewal Center</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-obsidian text-chartreuse shadow-xs'
              : 'text-slategrey hover:text-obsidian'
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Financial Reconciliation</span>
        </button>
      </div>

      {/* Tab 1: Subscription Health Monitor */}
      {activeTab === 'health' && healthData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-bordergrey bg-white p-4 shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Total Monitored</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{healthData.summary?.total || 0}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Healthy</span>
              <p className="text-2xl font-bold text-emerald-900 tabular-nums mt-1">{healthData.summary?.healthy || 0}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-amber-800">At Risk</span>
              <p className="text-2xl font-bold text-amber-900 tabular-nums mt-1">{healthData.summary?.atRisk || 0}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-rose-800">Critical Attention</span>
              <p className="text-2xl font-bold text-rose-900 tabular-nums mt-1">{healthData.summary?.critical || 0}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                  <tr>
                    <th className="px-5 py-3.5">Subscription</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Health Score</th>
                    <th className="px-5 py-3.5">Health Tier</th>
                    <th className="px-5 py-3.5">Detected Factors / Issues</th>
                    <th className="px-5 py-3.5">Next Renewal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bordergrey">
                  {healthData.subscriptions?.map((s: any) => {
                    const isCritical = s.healthTier === 'Critical';
                    const isAtRisk = s.healthTier === 'At Risk';

                    return (
                      <tr key={s._id} className="hover:bg-ivory/50">
                        <td className="px-5 py-4 font-mono font-bold text-obsidian">
                          {s.subscriptionNumber}
                        </td>
                        <td className="px-5 py-4 font-semibold text-obsidian">
                          {s.customer?.name}
                          <span className="block text-[11px] text-slategrey font-normal">{s.customer?.company}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-bordergrey rounded-full overflow-hidden">
                              <div
                                className={`h-full ${s.healthScore > 75 ? 'bg-emerald-500' : s.healthScore > 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${s.healthScore}%` }}
                              />
                            </div>
                            <span className="font-bold tabular-nums text-obsidian">{s.healthScore}/100</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isCritical ? 'bg-rose-100 text-rose-800' : isAtRisk ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.healthTier}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slategrey">
                          {s.issues?.length > 0 ? (
                            <ul className="space-y-0.5">
                              {s.issues.map((iss: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-1.5 text-rose-800 font-medium">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>{iss}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Nominal billing cadence
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slategrey">
                          {formatDate(s.nextBillingDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Revenue Leakage Alerts */}
      {activeTab === 'leakage' && leakageData && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">Total Revenue At Risk Detected</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Overdue invoices and failed gateway collections require recovery action.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Estimated Leakage</span>
              <p className="text-2xl font-black text-rose-950 tabular-nums">
                {formatINR(leakageData.summary?.totalLeakagePaise || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leakageData.insights?.map((ins: any) => (
              <div key={ins.id} className="p-5 rounded-2xl border border-bordergrey bg-white shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-ivory text-forest border border-bordergrey">
                    {ins.category}
                  </span>
                  <span className="text-xs font-bold text-rose-700 tabular-nums">
                    Impact: {formatINR(ins.impactPaise)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-obsidian">{ins.title}</h4>
                <p className="text-xs text-slategrey">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Smart Renewal Center */}
      {activeTab === 'renewals' && renewalData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Due in Next 7 Days</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{renewalData.metrics?.count7d || 0} renewals</p>
              <p className="text-xs font-semibold text-forest mt-0.5">{formatINR(renewalData.metrics?.value7dPaise)}</p>
            </div>
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Due in Next 15 Days</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{renewalData.metrics?.count15d || 0} renewals</p>
              <p className="text-xs font-semibold text-forest mt-0.5">{formatINR(renewalData.metrics?.value15dPaise)}</p>
            </div>
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Due in Next 30 Days</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{renewalData.metrics?.count30d || 0} renewals</p>
              <p className="text-xs font-semibold text-forest mt-0.5">{formatINR(renewalData.metrics?.value30dPaise)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
            <div className="p-4 border-b border-bordergrey bg-ivory flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-obsidian tracking-wider">Prioritized Next 7 Days Renewal Queue</h3>
              <span className="text-[11px] font-semibold text-forest">1-Click Invoice & Renewal Trigger</span>
            </div>
            <div className="divide-y divide-bordergrey">
              {renewalData.window7Days?.map((s: any) => (
                <div key={s._id} className="p-4 flex items-center justify-between text-xs hover:bg-ivory/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-obsidian">{s.subscriptionNumber}</span>
                      <span className="font-medium text-slategrey">• {s.customerId?.name} ({s.customerId?.company})</span>
                    </div>
                    <p className="text-slategrey text-[11px] mt-0.5">{s.productId?.name} — {s.planId?.name} ({s.billingInterval})</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-obsidian tabular-nums">{formatINR(s.unitPriceInPaise * (s.quantity || 1))}</p>
                      <span className="text-[11px] font-semibold text-emerald-800">Due {formatDate(s.nextBillingDate)}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRenewNow(s._id)}
                      icon={<Zap className="h-3 w-3 text-chartreuse" />}
                    >
                      Renew & Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Financial Reconciliation */}
      {activeTab === 'reconciliation' && reconciliationData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Gross Invoiced Total</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{formatINR(reconciliationData.metrics?.totalInvoicedPaise)}</p>
            </div>
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Recorded Collections</span>
              <p className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">{formatINR(reconciliationData.metrics?.totalRecordedPaymentsPaise)}</p>
            </div>
            <div className="p-4 rounded-xl border border-bordergrey bg-white shadow-subtle">
              <span className="text-[10px] font-bold uppercase text-slategrey">Collection Rate</span>
              <p className="text-2xl font-bold text-obsidian tabular-nums mt-1">{reconciliationData.metrics?.collectionRatePercent}%</p>
            </div>
            <div className={`p-4 rounded-xl border shadow-subtle ${
              reconciliationData.metrics?.isBalanced ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className="text-[10px] font-bold uppercase text-slategrey">Ledger Status</span>
              <p className="text-base font-bold text-obsidian mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>{reconciliationData.metrics?.isBalanced ? 'Fully Balanced' : 'Unsettled Variances'}</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-bordergrey bg-white shadow-subtle">
            <h3 className="text-sm font-bold text-obsidian mb-2">Partially Settled Invoices</h3>
            <p className="text-xs text-slategrey mb-4">Invoices with partial payments awaiting full collection closure</p>

            {reconciliationData.partiallyPaidInvoices?.length === 0 ? (
              <p className="text-xs text-slategrey py-4 text-center">No partially settled invoices currently outstanding.</p>
            ) : (
              <div className="divide-y divide-bordergrey">
                {reconciliationData.partiallyPaidInvoices?.map((inv: any) => (
                  <div key={inv._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-obsidian">{inv.invoiceNumber}</span>
                      <span className="text-slategrey ml-2">• {inv.customerId?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600 mr-3">Paid: {formatINR(inv.paidAmountInPaise)}</span>
                      <span className="font-bold text-rose-700">Due: {formatINR(inv.outstandingAmountInPaise)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
