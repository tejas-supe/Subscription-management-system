import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  RefreshCw,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { invoiceService } from '../../services/invoiceService';
import { Payment, Invoice } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('All');

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [recordForm, setRecordForm] = useState({
    invoiceId: '',
    amountInRupees: 0,
    method: 'UPI',
    referenceNumber: ''
  });

  const [sandboxForm, setSandboxForm] = useState({
    invoiceId: '',
    method: 'UPI',
    simulateSuccess: true,
    notes: 'Triggered via Brightloop Sandbox Gateway Simulator'
  });

  const [loadError, setLoadError] = useState('');
  const [refundReason, setRefundReason] = useState('Customer billing adjustment');

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [payRes, invRes] = await Promise.all([
        paymentService.list({ method: methodFilter !== 'All' ? methodFilter : undefined }),
        invoiceService.list({ status: 'Unpaid' })
      ]);

      if (payRes.data.success) setPayments(payRes.data.payments);
      if (invRes.data.success) {
        setInvoices(invRes.data.invoices);
        if (invRes.data.invoices.length > 0 && !recordForm.invoiceId) {
          setRecordForm(prev => ({
            ...prev,
            invoiceId: invRes.data.invoices[0]._id,
            amountInRupees: invRes.data.invoices[0].outstandingAmountInPaise / 100,
            referenceNumber: `UTR-HDFC-${Math.floor(1000000 + Math.random() * 9000000)}`
          }));
          setSandboxForm(prev => ({
            ...prev,
            invoiceId: invRes.data.invoices[0]._id
          }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.response?.data?.message || err.message || 'Unable to load payment records. Verify connection to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [methodFilter]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await paymentService.record({
        invoiceId: recordForm.invoiceId,
        amountInPaise: Math.round(recordForm.amountInRupees * 100),
        method: recordForm.method,
        referenceNumber: recordForm.referenceNumber
      });
      if (res.data.success) {
        setRecordModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSandboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await paymentService.simulateGateway(sandboxForm);
      alert(res.data.message);
      setSandboxModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Sandbox error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const res = await paymentService.refund(selectedPayment._id, refundReason);
      if (res.data.success) {
        setRefundModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Refund processing failed');
    } finally {
      setSubmitting(false);
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
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Payments & Settlement</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Multi-rail payment recording, automated invoice reconciliation, and simulated gateway testing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setSandboxModalOpen(true)}
            variant="outline"
            icon={<Zap className="h-4 w-4 text-forest" />}
          >
            Launch Gateway Sandbox
          </Button>

          <Button
            onClick={() => setRecordModalOpen(true)}
            variant="primary"
            icon={<Plus className="h-4 w-4 text-chartreuse" />}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs w-fit">
        {(['All', 'UPI', 'Card', 'Bank Transfer'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`px-3 py-1 font-semibold rounded-lg capitalize transition-all ${
              methodFilter === m
                ? 'bg-obsidian text-chartreuse shadow-xs'
                : 'text-slategrey hover:text-obsidian'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading ? (
        <Loader rows={6} />
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No payment records found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Payment #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Amount (INR)</th>
                  <th className="px-5 py-3.5">Rail / Method</th>
                  <th className="px-5 py-3.5">Reference / UTR</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {payments.map((p) => {
                  const colors = getStatusColor(p.status);
                  const isRefunded = p.status === 'Refunded';

                  return (
                    <tr key={p._id} className="hover:bg-ivory/50 transition-colors">
                      <td className="px-5 py-4 font-bold font-mono text-obsidian">
                        {p.paymentNumber}
                        {p.isSimulated && (
                          <span className="ml-1 text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Sandbox
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-obsidian">{p.customerId?.name}</div>
                        <div className="text-[11px] text-slategrey">{p.customerId?.company}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-forest">
                        {p.invoiceId ? (typeof p.invoiceId === 'object' ? p.invoiceId.invoiceNumber : p.invoiceId) : '—'}
                      </td>
                      <td className="px-5 py-4 font-bold text-obsidian tabular-nums">
                        {formatINR(p.amountInPaise)}
                      </td>
                      <td className="px-5 py-4 font-medium text-obsidian">
                        <span className="px-2 py-0.5 rounded bg-ivory border border-bordergrey font-mono text-[11px]">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slategrey truncate max-w-[140px]">
                        {p.referenceNumber}
                      </td>
                      <td className="px-5 py-4 text-slategrey">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {p.status === 'Success' && !isRefunded && (
                          <button
                            onClick={() => { setSelectedPayment(p); setRefundModalOpen(true); }}
                            className="px-2 py-1 rounded text-slategrey hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                            title="Process Demo Refund"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Payment Receipt"
        subtitle="Match offline or wire payment against an outstanding invoice."
        maxWidth="md"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Target Invoice *</label>
            <select
              required
              value={recordForm.invoiceId}
              onChange={(e) => {
                const inv = invoices.find(i => i._id === e.target.value);
                setRecordForm({
                  ...recordForm,
                  invoiceId: e.target.value,
                  amountInRupees: inv ? inv.outstandingAmountInPaise / 100 : 0
                });
              }}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
            >
              {invoices.map(inv => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} — {inv.customerId?.name} (Due: ₹{(inv.outstandingAmountInPaise / 100).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Amount (₹ INR) *</label>
              <input
                type="number"
                required
                value={recordForm.amountInRupees}
                onChange={(e) => setRecordForm({ ...recordForm, amountInRupees: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Payment Method</label>
              <select
                value={recordForm.method}
                onChange={(e) => setRecordForm({ ...recordForm, method: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Reference / UTR Number *</label>
            <input
              type="text"
              required
              value={recordForm.referenceNumber}
              onChange={(e) => setRecordForm({ ...recordForm, referenceNumber: e.target.value })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setRecordModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Reconcile & Apply Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Gateway Sandbox Simulator Modal */}
      <Modal
        isOpen={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        title="Gateway Sandbox Simulator"
        subtitle="Simulate real-time payment success or decline to test dunning & dunning alerts."
        maxWidth="md"
      >
        <form onSubmit={handleSandboxSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
            ⚠️ <strong>Simulated Gateway Environment:</strong> This interface allows evaluators to simulate payment gateway outcomes. No real banking credentials or charges are processed.
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Target Invoice *</label>
            <select
              required
              value={sandboxForm.invoiceId}
              onChange={(e) => setSandboxForm({ ...sandboxForm, invoiceId: e.target.value })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
            >
              {invoices.map(inv => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} — {inv.customerId?.name} (₹{(inv.outstandingAmountInPaise / 100).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Simulated Rail</label>
              <select
                value={sandboxForm.method}
                onChange={(e) => setSandboxForm({ ...sandboxForm, method: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                <option value="UPI">UPI Autopay</option>
                <option value="Card">Visa / Mastercard</option>
                <option value="Bank Transfer">NetBanking e-Mandate</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Outcome Trigger</label>
              <select
                value={sandboxForm.simulateSuccess ? 'success' : 'failure'}
                onChange={(e) => setSandboxForm({ ...sandboxForm, simulateSuccess: e.target.value === 'success' })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white font-bold"
              >
                <option value="success">Simulate SUCCESS (Clear invoice)</option>
                <option value="failure">Simulate FAILURE (Trigger leakage alert)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setSandboxModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Dispatch Simulation</Button>
          </div>
        </form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Issue Payment Refund"
        subtitle={`Process credit reversal for Payment ${selectedPayment?.paymentNumber}`}
        maxWidth="sm"
      >
        <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
          <p className="text-obsidian">
            Amount to reverse: <strong>{selectedPayment ? formatINR(selectedPayment.amountInPaise) : '₹0'}</strong>.
            This will restore the outstanding balance onto the corresponding invoice.
          </p>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Refund Reason *</label>
            <input
              type="text"
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setRefundModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" loading={submitting}>Confirm Refund</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
