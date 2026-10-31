import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  XCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Subscription, Customer, Plan } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';

export const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchParams] = useSearchParams();

  // Selected subscription for detail drawer
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [createData, setCreateData] = useState({
    customerId: '',
    planId: '',
    quantity: 1,
    discountPercent: 0,
    isTrial: false,
    trialDays: 14
  });

  const [loadError, setLoadError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [sRes, cRes, pRes] = await Promise.all([
        subscriptionService.list({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        customerService.list(),
        productService.listPlans()
      ]);

      if (sRes.data.success) setSubscriptions(sRes.data.subscriptions);
      if (cRes.data.success) {
        setCustomers(cRes.data.customers);
        if (cRes.data.customers.length > 0 && !createData.customerId) {
          setCreateData(prev => ({ ...prev, customerId: cRes.data.customers[0]._id }));
        }
      }
      if (pRes.data.success) {
        setPlans(pRes.data.plans);
        if (pRes.data.plans.length > 0 && !createData.planId) {
          setCreateData(prev => ({ ...prev, planId: pRes.data.plans[0]._id }));
          setNewPlanId(pRes.data.plans[0]._id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.response?.data?.message || err.message || 'Unable to retrieve subscriptions. Check connection to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await subscriptionService.create(createData);
      if (res.data.success) {
        setCreateOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await subscriptionService.pause(id);
      loadData();
      if (selectedSub?._id === id) setDetailOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Pause failed');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await subscriptionService.resume(id);
      loadData();
      if (selectedSub?._id === id) setDetailOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Resume failed');
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      await subscriptionService.changePlan(selectedSub._id, newPlanId);
      setChangePlanOpen(false);
      setDetailOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Change plan failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      await subscriptionService.cancel(selectedSub._id, cancelReason);
      setCancelModalOpen(false);
      setDetailOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancel failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualRenew = async (id: string) => {
    try {
      const res = await subscriptionService.renew(id);
      alert(res.data.message);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Renewal failed');
    }
  };

  const handleRunBillingCycle = async () => {
    try {
      const res = await subscriptionService.runBillingCycle();
      alert(res.data.message);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Billing cycle trigger failed');
    }
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-300 rounded-md font-semibold hover:bg-rose-100 text-rose-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Subscription Lifecycle</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Active recurring agreements, interval enforcement, lifecycle upgrades, and automated renewal triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleRunBillingCycle}
            variant="outline"
            icon={<Zap className="h-4 w-4 text-forest" />}
          >
            Run Recurring Billing Engine
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="primary"
            icon={<Plus className="h-4 w-4 text-chartreuse" />}
          >
            New Subscription
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs w-fit">
        {(['All', 'Active', 'Trial', 'Paused', 'Past Due', 'Cancelled'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 font-semibold rounded-lg capitalize transition-all ${
              statusFilter === st
                ? 'bg-obsidian text-chartreuse shadow-xs'
                : 'text-slategrey hover:text-obsidian'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <Loader rows={6} />
      ) : subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No subscriptions found for this status.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Subscription #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Product & Plan</th>
                  <th className="px-5 py-3.5">Billing Cadence</th>
                  <th className="px-5 py-3.5">Amount (INR)</th>
                  <th className="px-5 py-3.5">Next Renewal</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {subscriptions.map((s) => {
                  const colors = getStatusColor(s.status);
                  const isPastDue = s.status === 'Past Due';

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-ivory/50 transition-colors cursor-pointer group"
                      onClick={() => { setSelectedSub(s); setDetailOpen(true); }}
                    >
                      <td className="px-5 py-4 font-bold font-mono text-obsidian group-hover:text-forest">
                        {s.subscriptionNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-obsidian">{s.customerId?.name}</div>
                        <div className="text-[11px] text-slategrey">{s.customerId?.company}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-obsidian">{s.productId?.name}</div>
                        <div className="text-[11px] text-slategrey">{s.planId?.name}</div>
                      </td>
                      <td className="px-5 py-4 uppercase font-semibold text-slategrey">
                        {s.billingInterval}
                      </td>
                      <td className="px-5 py-4 font-bold text-obsidian tabular-nums">
                        {formatINR(s.unitPriceInPaise * (s.quantity || 1))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-medium ${isPastDue ? 'text-rose-700 font-bold' : 'text-obsidian'}`}>
                          {formatDate(s.nextBillingDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {s.status === 'Active' && (
                            <button
                              onClick={() => handlePause(s._id)}
                              className="p-1 rounded text-slategrey hover:text-amber-800 hover:bg-amber-50"
                              title="Pause Subscription"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}

                          {s.status === 'Paused' && (
                            <button
                              onClick={() => handleResume(s._id)}
                              className="p-1 rounded text-slategrey hover:text-emerald-700 hover:bg-emerald-50"
                              title="Resume Subscription"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleManualRenew(s._id)}
                            className="p-1 rounded text-slategrey hover:text-forest hover:bg-ivory"
                            title="Renew / Generate Invoice"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => { setSelectedSub(s); setDetailOpen(true); }}
                            className="p-1 rounded text-slategrey hover:text-obsidian hover:bg-ivory"
                            title="View Lifecycle Timeline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Detail Drawer / Modal */}
      {selectedSub && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`Subscription ${selectedSub.subscriptionNumber}`}
          subtitle={`${selectedSub.customerId?.name} • ${selectedSub.planId?.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-ivory p-3.5 rounded-xl border border-bordergrey">
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Status</span>
                <p className="font-bold text-obsidian mt-0.5">{selectedSub.status}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Recurring Amount</span>
                <p className="font-bold text-obsidian mt-0.5">{formatINR(selectedSub.unitPriceInPaise * (selectedSub.quantity || 1))}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Interval</span>
                <p className="font-bold text-obsidian capitalize mt-0.5">{selectedSub.billingInterval}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Next Billing</span>
                <p className="font-bold text-forest mt-0.5">{formatDate(selectedSub.nextBillingDate)}</p>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-bordergrey">
              {selectedSub.status === 'Active' && (
                <Button variant="outline" size="sm" onClick={() => handlePause(selectedSub._id)}>
                  <Pause className="h-3.5 w-3.5 mr-1 text-amber-600" /> Pause Billing
                </Button>
              )}
              {selectedSub.status === 'Paused' && (
                <Button variant="outline" size="sm" onClick={() => handleResume(selectedSub._id)}>
                  <Play className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resume Billing
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setNewPlanId(selectedSub.planId?._id || ''); setChangePlanOpen(true); }}
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-forest" /> Upgrade / Downgrade Plan
              </Button>
              {selectedSub.status !== 'Cancelled' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel Subscription
                </Button>
              )}
            </div>

            {/* Embedded Subscription Lifecycle Timeline */}
            <div className="space-y-3 pt-3 border-t border-bordergrey">
              <h4 className="font-bold uppercase tracking-wider text-slategrey text-[10px]">
                Subscription Event Timeline
              </h4>

              <div className="space-y-3 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-bordergrey">
                {selectedSub.timeline?.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-forest" />
                    <div className="p-2.5 rounded-lg border border-bordergrey bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-obsidian">{evt.action}</span>
                        <span className="text-[10px] text-slategrey">{formatDateTime(evt.timestamp)}</span>
                      </div>
                      <p className="text-slategrey mt-0.5">{evt.description}</p>
                      {evt.performedBy && (
                        <span className="text-[10px] font-semibold text-forest">By {evt.performedBy}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Plan Modal */}
      <Modal
        isOpen={changePlanOpen}
        onClose={() => setChangePlanOpen(false)}
        title="Upgrade or Downgrade Subscription Plan"
        subtitle="Select a new pricing tier to immediately modify the recurring agreement."
        maxWidth="md"
      >
        <form onSubmit={handleChangePlan} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Select New Plan *</label>
            <select
              required
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
            >
              {plans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.billingInterval}) — ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setChangePlanOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Confirm Plan Change</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
        subtitle="Record reason for cancellation and disable auto-renewal."
        maxWidth="sm"
      >
        <form onSubmit={handleCancel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Cancellation Reason *</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Downsized team, migrated to internal tool, pricing concerns..."
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setCancelModalOpen(false)}>Back</Button>
            <Button variant="danger" type="submit" loading={submitting}>Cancel Subscription</Button>
          </div>
        </form>
      </Modal>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Direct Subscription"
        subtitle="Start recurring billing agreement for an existing customer."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Customer Account *</label>
              <select
                required
                value={createData.customerId}
                onChange={(e) => setCreateData({ ...createData, customerId: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Subscription Plan *</label>
              <select
                required
                value={createData.planId}
                onChange={(e) => setCreateData({ ...createData, planId: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                {plans.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.billingInterval}) — ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={createData.quantity}
                onChange={(e) => setCreateData({ ...createData, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={createData.discountPercent}
                onChange={(e) => setCreateData({ ...createData, discountPercent: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Activate Subscription</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
