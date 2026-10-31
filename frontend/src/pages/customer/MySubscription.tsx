import React, { useState, useEffect } from 'react';
import { Repeat, ArrowUpRight, XCircle, CheckCircle, Clock } from 'lucide-react';
import { portalService } from '../../services/analyticsService';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';

export const MySubscription: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await portalService.getDashboard();
      if (res.data.success) {
        setData(res.data);
        if (res.data.availablePlans?.length > 0 && !selectedPlanId) {
          setSelectedPlanId(res.data.availablePlans[0]._id);
        }
      } else {
        setLoadError(res.data.message || 'Failed to load subscription details.');
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.response?.data?.message || err.message || 'Unable to connect to subscription service. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await portalService.requestPlanChange(selectedPlanId, planNotes);
      setStatusMsg(res.data.message);
      setUpgradeModalOpen(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Plan change request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await portalService.requestCancellation(cancelReason);
      setStatusMsg(res.data.message);
      setCancelModalOpen(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancellation request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader rows={6} />;

  const sub = data?.currentSubscription;

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            onClick={load}
            className="px-3 py-1 bg-white border border-rose-300 rounded-md font-semibold hover:bg-rose-100 text-rose-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="pb-2 border-b border-bordergrey">
        <h2 className="text-xl font-bold text-obsidian tracking-tight">My Subscription Agreement</h2>
        <p className="text-xs text-slategrey mt-0.5">
          Review your active agreement parameters, scheduled renewals, and submit self-service plan adjustments.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {sub ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bordergrey">
              <div>
                <span className="font-mono text-xs font-bold text-forest">{sub.subscriptionNumber}</span>
                <h3 className="text-xl font-bold text-obsidian mt-1">{sub.planId?.name}</h3>
                <p className="text-xs text-slategrey">{sub.productId?.name} • Category: {sub.productId?.category}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => setUpgradeModalOpen(true)}
                  icon={<ArrowUpRight className="h-4 w-4 text-chartreuse" />}
                >
                  Request Plan Upgrade
                </Button>
                {sub.autoRenew && (
                  <Button
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Status</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">{sub.status}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Billing Cadence</span>
                <p className="font-bold text-obsidian text-sm capitalize mt-0.5">{sub.billingInterval}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Recurring Rate</span>
                <p className="font-bold text-obsidian text-sm tabular-nums mt-0.5">
                  {formatINR(sub.unitPriceInPaise * (sub.quantity || 1))}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Next Renewal Date</span>
                <p className="font-bold text-forest text-sm mt-0.5">{formatDate(sub.nextBillingDate)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-bordergrey">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slategrey">Included Plan Entitlements</span>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sub.planId?.features?.map((f: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-obsidian">
                    <CheckCircle className="h-3.5 w-3.5 text-forest shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timeline of events */}
          <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-obsidian">Subscription Account History</h3>
            <div className="space-y-3 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-bordergrey text-xs">
              {sub.timeline?.map((evt: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-forest" />
                  <div className="p-3 rounded-lg border border-bordergrey bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-obsidian">{evt.action}</span>
                      <span className="text-[11px] text-slategrey">{formatDateTime(evt.timestamp)}</span>
                    </div>
                    <p className="text-slategrey mt-0.5">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey">
          No subscription currently active.
        </div>
      )}

      {/* Upgrade / Change Plan Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Request Subscription Plan Change"
        subtitle="Submit a self-service tier modification request to your account manager."
        maxWidth="md"
      >
        <form onSubmit={handleUpgradeSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Target Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none bg-white font-semibold"
            >
              {data?.availablePlans?.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.billingInterval}) — ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Special Requirements / Notes</label>
            <textarea
              rows={3}
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              placeholder="e.g. Need additional seats or custom API rate limits..."
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setUpgradeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Request Subscription Cancellation"
        subtitle="Disable automatic renewal at the end of the current billing cycle."
        maxWidth="sm"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
          <p className="text-slategrey">
            Your service will remain fully operational until the end of your prepaid period ({formatDate(sub?.currentPeriodEnd)}).
          </p>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Feedback / Cancellation Reason</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Help us improve: why are you considering cancellation?"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setCancelModalOpen(false)}>Keep Subscription</Button>
            <Button variant="danger" type="submit" loading={submitting}>Confirm Non-Renewal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
