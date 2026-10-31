import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Download,
  CreditCard,
  Ban,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { customerService } from '../../services/customerService';
import { Invoice, Customer, Payment } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();

  // Invoice view / payment modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment recording form
  const [payAmountRupees, setPayAmountRupees] = useState(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'Bank Transfer' | 'Cash' | 'Other'>('UPI');
  const [payRef, setPayRef] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes] = await Promise.all([
        invoiceService.list({ status: statusFilter !== 'All' ? statusFilter : undefined, search }),
        customerService.list()
      ]);

      if (invRes.data.success) setInvoices(invRes.data.invoices);
      if (custRes.data.success) setCustomers(custRes.data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleOpenInvoice = async (id: string) => {
    try {
      const res = await invoiceService.get(id);
      if (res.data.success) {
        setSelectedInvoice(res.data.invoice);
        setInvoicePayments(res.data.payments || []);
        setViewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openRecordPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmountRupees(inv.outstandingAmountInPaise / 100);
    setPayRef(`UTR-HDFC-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      const res = await paymentService.record({
        invoiceId: selectedInvoice._id,
        amountInPaise: Math.round(payAmountRupees * 100),
        method: payMethod,
        referenceNumber: payRef
      });
      if (res.data.success) {
        setPayModalOpen(false);
        setViewModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this invoice? This cannot be undone.')) return;
    try {
      const res = await invoiceService.void(id);
      if (res.data.success) {
        setViewModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Void failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Invoices & Billing</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Audit-ready recurring tax invoices, configurable GST breakdowns, and payment collection tracking.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs w-fit">
        {(['All', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Void'] as const).map((st) => (
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

      {/* Invoices Table */}
      {loading ? (
        <Loader rows={6} />
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer & Entity</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Outstanding Due</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {invoices.map((inv) => {
                  const colors = getStatusColor(inv.status);
                  const isOverdue = inv.status === 'Overdue';

                  return (
                    <tr
                      key={inv._id}
                      className="hover:bg-ivory/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenInvoice(inv._id)}
                    >
                      <td className="px-5 py-4 font-bold font-mono text-obsidian group-hover:text-forest">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-obsidian">{inv.customerId?.name}</div>
                        <div className="text-[11px] text-slategrey">{inv.customerId?.company}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-obsidian tabular-nums">
                        {formatINR(inv.totalAmountInPaise)}
                      </td>
                      <td className="px-5 py-4 text-emerald-800 tabular-nums font-semibold">
                        {formatINR(inv.paidAmountInPaise)}
                      </td>
                      <td className="px-5 py-4 font-bold text-rose-700 tabular-nums">
                        {formatINR(inv.outstandingAmountInPaise)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-medium ${isOverdue ? 'text-rose-700 font-bold' : 'text-obsidian'}`}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.outstandingAmountInPaise > 0 && inv.status !== 'Void' && (
                            <button
                              onClick={() => openRecordPayment(inv)}
                              className="px-2 py-1 rounded bg-obsidian text-chartreuse font-bold text-[11px] flex items-center gap-1 shadow-subtle hover:bg-forest"
                              title="Record Payment"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Record Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenInvoice(inv._id)}
                            className="p-1 rounded text-slategrey hover:text-obsidian hover:bg-ivory"
                            title="View Invoice PDF"
                          >
                            <Eye className="h-4 w-4" />
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

      {/* Invoice Detail & Print Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          subtitle={`Issued to ${selectedInvoice.customerId?.name} (${selectedInvoice.customerId?.company})`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs p-2">
            <div className="flex justify-between items-start border-b border-bordergrey pb-4">
              <div>
                <span className="font-extrabold tracking-widest text-base text-obsidian">BRIGHTLOOP</span>
                <p className="text-slategrey text-[11px] mt-1">Tax Invoice • GST Registered</p>
                <p className="text-slategrey text-[11px]">29AABCB1234F1Z0 • Bengaluru, India</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-obsidian">{selectedInvoice.invoiceNumber}</span>
                <p className="text-slategrey text-[11px] mt-1">Issue Date: {formatDate(selectedInvoice.issueDate)}</p>
                <p className="text-rose-700 font-semibold text-[11px]">Due Date: {formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-ivory p-3.5 rounded-xl border border-bordergrey">
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Billed To:</span>
                <p className="font-bold text-obsidian mt-0.5">{selectedInvoice.customerId?.name}</p>
                <p className="text-slategrey">{selectedInvoice.customerId?.company}</p>
                <p className="text-slategrey font-mono text-[11px]">GSTIN: {selectedInvoice.customerId?.gstNumber || 'Consumer'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slategrey">Payment Status:</span>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-obsidian text-chartreuse">
                    {selectedInvoice.status}
                  </span>
                </div>
                <p className="text-slategrey text-[11px] mt-2">Outstanding: <strong className="text-rose-700">{formatINR(selectedInvoice.outstandingAmountInPaise)}</strong></p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="border-b border-bordergrey bg-ivory text-[10px] uppercase font-bold text-slategrey">
                <tr>
                  <th className="p-2">Line Description</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">GST Rate</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {selectedInvoice.lineItems?.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="p-2 font-medium text-obsidian">{item.description}</td>
                    <td className="p-2 text-center tabular-nums">{item.quantity}</td>
                    <td className="p-2 text-right tabular-nums">{formatINR(item.unitPriceInPaise)}</td>
                    <td className="p-2 text-right tabular-nums">{item.taxRate}%</td>
                    <td className="p-2 text-right font-bold tabular-nums">{formatINR(item.totalAmountInPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-3 border-t border-bordergrey">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-slategrey">
                  <span>Subtotal:</span>
                  <span className="font-bold text-obsidian">{formatINR(selectedInvoice.subtotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-slategrey">
                  <span>GST Tax Total:</span>
                  <span className="font-bold text-obsidian">{formatINR(selectedInvoice.taxTotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-obsidian pt-2 border-t border-bordergrey">
                  <span>Total Amount:</span>
                  <span className="tabular-nums text-forest">{formatINR(selectedInvoice.totalAmountInPaise)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold text-xs">
                  <span>Paid to Date:</span>
                  <span className="tabular-nums">{formatINR(selectedInvoice.paidAmountInPaise)}</span>
                </div>
              </div>
            </div>

            {/* Payment history on this invoice */}
            {invoicePayments.length > 0 && (
              <div className="pt-3 border-t border-bordergrey space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slategrey text-[10px]">Recorded Payments</h4>
                <div className="divide-y divide-bordergrey rounded-lg border border-bordergrey overflow-hidden">
                  {invoicePayments.map(p => (
                    <div key={p._id} className="p-2 flex items-center justify-between text-xs bg-white">
                      <span>{p.paymentNumber} via {p.method} ({p.referenceNumber})</span>
                      <span className="font-bold text-obsidian">{formatINR(p.amountInPaise)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-bordergrey">
              {selectedInvoice.status !== 'Void' && selectedInvoice.paidAmountInPaise === 0 && (
                <button
                  onClick={() => handleVoid(selectedInvoice._id)}
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Ban className="h-3.5 w-3.5" /> Void Invoice
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {selectedInvoice.outstandingAmountInPaise > 0 && selectedInvoice.status !== 'Void' && (
                  <Button
                    variant="primary"
                    onClick={() => openRecordPayment(selectedInvoice)}
                    icon={<CreditCard className="h-3.5 w-3.5 text-chartreuse" />}
                  >
                    Record Payment
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  Print PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Manual Payment"
        subtitle={`Apply payment to Invoice ${selectedInvoice?.invoiceNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Payment Amount (₹ INR) *</label>
            <input
              type="number"
              required
              step="any"
              max={selectedInvoice ? selectedInvoice.outstandingAmountInPaise / 100 : undefined}
              value={payAmountRupees}
              onChange={(e) => setPayAmountRupees(Number(e.target.value))}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-bold text-sm"
            />
            <p className="text-[11px] text-slategrey mt-1">
              Outstanding balance: {selectedInvoice ? formatINR(selectedInvoice.outstandingAmountInPaise) : '₹0'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Reference / UTR # *</label>
              <input
                type="text"
                required
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setPayModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Confirm & Reconcile Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
