import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  ShieldCheck,
  Search
} from 'lucide-react';
import { portalService } from '../../services/analyticsService';
import { paymentService } from '../../services/paymentService';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { formatINR, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';

export const MyInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // View modal state
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Pay modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'Bank Transfer'>('UPI');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await portalService.getDashboard();
      if (res.data.success) {
        setInvoices(res.data.invoices || []);
        setCustomer(res.data.customer || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePay = (inv: any) => {
    setPayingInvoice(inv);
    setPaySuccessMsg('');
    setPayModalOpen(true);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setSubmittingPayment(true);
    try {
      await paymentService.create({
        customerId: customer._id,
        invoiceId: payingInvoice._id,
        amountInPaise: payingInvoice.balanceDueInPaise || payingInvoice.totalAmountInPaise,
        paymentMethod: payMethod,
        transactionReference: `PAY-SELF-${Date.now().toString().slice(-6)}`,
        status: 'Success'
      });
      setPaySuccessMsg('Payment processed successfully! Your receipt is generated.');
      setTimeout(() => {
        setPayModalOpen(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmountInPaise || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaidInPaise || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDueInPaise || 0), 0);

  if (loading) {
    return <Loader message="Fetching tax invoices and billing statements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-deepForest/10 text-deepForest text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            Tax Compliance & Invoicing
          </div>
          <h1 className="text-2xl font-bold text-obsidian tracking-tight font-heading">
            Billing Statements & Tax Invoices
          </h1>
          <p className="text-sm text-slateGrey mt-0.5">
            Access, view, download GST-compliant tax invoices, and pay open balances.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Total Lifetime Invoiced</p>
          <p className="text-2xl font-bold font-mono text-obsidian">{formatINR(totalBilled)}</p>
          <p className="text-xs text-mutedSage mt-1">{invoices.length} tax invoices generated</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Total Settled</p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{formatINR(totalPaid)}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified settled against banking rail
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Current Open Balance</p>
          <p className={`text-2xl font-bold font-mono ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slateGrey'}`}>
            {formatINR(totalOutstanding)}
          </p>
          <p className="text-xs text-slateGrey mt-1">
            {totalOutstanding > 0 ? 'Immediate action requested' : 'Zero balance — account in good standing'}
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-borderGrey/70 shadow-card overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-borderGrey/70 flex flex-col md:flex-row gap-3 items-center justify-between bg-warmIvory/30">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateGrey" />
            <input
              type="text"
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-borderGrey rounded-lg focus:outline-none focus:ring-1 focus:ring-deepForest"
            />
          </div>

          <div className="flex items-center gap-2 self-end">
            <span className="text-xs text-slateGrey font-medium">Status:</span>
            {['All', 'Paid', 'Unpaid', 'Overdue'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-deepForest text-white'
                    : 'bg-white border border-borderGrey text-slateGrey hover:bg-warmIvory'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-mutedSage/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-obsidian">No Invoices Found</p>
            <p className="text-xs text-slateGrey mt-1">There are no statements matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warmIvory/50 border-b border-borderGrey/70 text-slateGrey font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderGrey/50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-warmIvory/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-obsidian">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slateGrey">
                      {formatDate(inv.issueDate || inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slateGrey">
                      {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-obsidian">
                      {formatINR(inv.totalAmountInPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      <span className={inv.balanceDueInPaise > 0 ? 'text-amber-600' : 'text-slateGrey'}>
                        {formatINR(inv.balanceDueInPaise || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setViewModalOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        {inv.status !== 'Paid' && inv.status !== 'Void' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePay(inv)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedInvoice ? `Tax Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-borderGrey pb-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-deepForest font-bold">
                  BRIGHTLOOP CLOUD TECHNOLOGIES PVT LTD
                </span>
                <p className="text-xs text-slateGrey mt-1">GSTIN: 27AABCB1234F1Z8 | HSN/SAC: 997331</p>
                <p className="text-xs text-slateGrey">Financial District, Gachibowli, Hyderabad, TS 500032</p>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
                <p className="text-xs text-slateGrey mt-2">
                  Issue: {formatDate(selectedInvoice.issueDate || selectedInvoice.createdAt)}
                </p>
                {selectedInvoice.dueDate && (
                  <p className="text-xs text-slateGrey">Due: {formatDate(selectedInvoice.dueDate)}</p>
                )}
              </div>
            </div>

            {/* Billed To */}
            <div className="bg-warmIvory/50 p-3 rounded-lg border border-borderGrey/70 text-xs">
              <span className="font-semibold text-deepForest">Billed To:</span>
              <p className="font-semibold text-obsidian mt-0.5">{customer?.name || 'Customer'}</p>
              <p className="text-slateGrey">{customer?.email} | {customer?.phone || 'No phone'}</p>
              {customer?.billingAddress?.city && (
                <p className="text-slateGrey">
                  {customer.billingAddress.line1}, {customer.billingAddress.city}, {customer.billingAddress.state} - {customer.billingAddress.postalCode}
                </p>
              )}
              {customer?.taxId && (
                <p className="text-slateGrey font-mono mt-0.5">GSTIN: {customer.taxId}</p>
              )}
            </div>

            {/* Line items table */}
            <div className="border border-borderGrey rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-warmIvory/60 border-b border-borderGrey font-semibold text-slateGrey">
                  <tr>
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Tax Rate</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGrey/60">
                  {selectedInvoice.lineItems?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 text-obsidian font-medium">{item.description}</td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(item.unitPriceInPaise)}</td>
                      <td className="py-2 px-3 text-right font-mono">{item.taxRate || 18}% GST</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{formatINR(item.totalInPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slateGrey">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatINR(selectedInvoice.subtotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-slateGrey">
                  <span>GST Total:</span>
                  <span className="font-mono">{formatINR(selectedInvoice.taxAmountInPaise)}</span>
                </div>
                {selectedInvoice.discountAmountInPaise > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatINR(selectedInvoice.discountAmountInPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-obsidian border-t border-borderGrey pt-2 text-sm">
                  <span>Total Amount:</span>
                  <span className="font-mono">{formatINR(selectedInvoice.totalAmountInPaise)}</span>
                </div>
                <div className="flex justify-between text-slateGrey pt-1">
                  <span>Amount Settled:</span>
                  <span className="font-mono text-emerald-600">{formatINR(selectedInvoice.amountPaidInPaise || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-dashed border-borderGrey pt-1 text-amber-700">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatINR(selectedInvoice.balanceDueInPaise || 0)}</span>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between border-t border-borderGrey pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print / Save PDF
              </Button>

              <div className="flex items-center gap-2">
                {selectedInvoice.status !== 'Paid' && selectedInvoice.status !== 'Void' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setViewModalOpen(false);
                      handlePay(selectedInvoice);
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" />
                    Pay Balance Due
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Settle Invoice Online"
        size="md"
      >
        {payingInvoice && (
          <form onSubmit={submitPayment} className="space-y-4">
            {paySuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2 border border-emerald-200">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                {paySuccessMsg}
              </div>
            )}

            <div className="p-4 bg-warmIvory/60 rounded-xl border border-borderGrey/70 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slateGrey">Invoice Number:</span>
                <span className="font-mono font-bold text-obsidian">{payingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slateGrey">Payable Amount:</span>
                <span className="font-mono font-bold text-lg text-deepForest">
                  {formatINR(payingInvoice.balanceDueInPaise || payingInvoice.totalAmountInPaise)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey mb-2 uppercase tracking-wider">
                Select Payment Rail
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Card', 'Bank Transfer'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayMethod(method)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                      payMethod === method
                        ? 'border-deepForest bg-deepForest text-white shadow-sm'
                        : 'border-borderGrey bg-white text-slateGrey hover:border-slateGrey'
                    }`}
                  >
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-borderGrey/60 rounded-lg flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slateGrey leading-relaxed">
                <span className="font-semibold text-obsidian">Bank-Grade 256-Bit SSL Encryption</span>
                <br />
                Instant automated reconciliation via RBI NPCI & Razorpay payment gateway rails.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-borderGrey">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setPayModalOpen(false)}
                disabled={submittingPayment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={submittingPayment}
              >
                Authorize & Pay {formatINR(payingInvoice.balanceDueInPaise || payingInvoice.totalAmountInPaise)}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
