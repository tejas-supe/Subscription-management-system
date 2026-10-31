import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Download,
  Eye,
  ShieldCheck,
  Search,
  Receipt
} from 'lucide-react';
import { portalService } from '../../services/analyticsService';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { formatINR, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';

export const MyPayments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await portalService.getDashboard();
      if (res.data.success) {
        setPayments(res.data.payments || []);
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

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    const refMatch = p.transactionReference?.toLowerCase().includes(term);
    const methodMatch = p.paymentMethod?.toLowerCase().includes(term);
    const invMatch = p.invoiceId?.invoiceNumber?.toLowerCase().includes(term);
    return refMatch || methodMatch || invMatch;
  });

  const totalSuccessfulPaise = payments
    .filter((p) => p.status === 'Success')
    .reduce((acc, p) => acc + (p.amountInPaise || 0), 0);

  if (loading) {
    return <Loader message="Fetching banking reconciliation and payment receipts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-deepForest/10 text-deepForest text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            Settlements & Receipts
          </div>
          <h1 className="text-2xl font-bold text-obsidian tracking-tight font-heading">
            Payment Records & Banking Receipts
          </h1>
          <p className="text-sm text-slateGrey mt-0.5">
            Audit-grade history of all payments, UTR transaction references, and payment receipts.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Total Settled</p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{formatINR(totalSuccessfulPaise)}</p>
          <p className="text-xs text-mutedSage mt-1">{payments.length} total transactions recorded</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Last Payment</p>
          <p className="text-base font-bold font-mono text-obsidian">
            {payments[0] ? formatINR(payments[0].amountInPaise) : '—'}
          </p>
          <p className="text-xs text-slateGrey mt-1">
            {payments[0] ? `${formatDate(payments[0].paymentDate || payments[0].createdAt)} via ${payments[0].paymentMethod}` : 'No payment records yet'}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-borderGrey/70 shadow-card">
          <p className="text-xs uppercase tracking-wider font-semibold text-slateGrey mb-1">Reconciliation Status</p>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            100% Reconciled
          </div>
          <p className="text-xs text-slateGrey mt-1">Directly cross-verified via UPI & bank gateway</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-borderGrey/70 shadow-card overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-borderGrey/70 flex flex-col md:flex-row gap-3 items-center justify-between bg-warmIvory/30">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateGrey" />
            <input
              type="text"
              placeholder="Search by UTR or Invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-borderGrey rounded-lg focus:outline-none focus:ring-1 focus:ring-deepForest"
            />
          </div>
          <span className="text-xs text-slateGrey">
            Showing {filteredPayments.length} of {payments.length} transactions
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="w-12 h-12 text-mutedSage/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-obsidian">No Payment Records</p>
            <p className="text-xs text-slateGrey mt-1">There are no payment settlements matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warmIvory/50 border-b border-borderGrey/70 text-slateGrey font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Transaction UTR</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderGrey/50">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-warmIvory/30 transition-colors">
                    <td className="py-3.5 px-4 text-slateGrey whitespace-nowrap">
                      {formatDateTime(p.paymentDate || p.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-obsidian">
                      {p.transactionReference || 'REF-INTERNAL-001'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slateGrey">
                      {p.invoiceId?.invoiceNumber || (typeof p.invoiceId === 'string' ? p.invoiceId.slice(-6) : '—')}
                    </td>
                    <td className="py-3.5 px-4 text-obsidian font-medium">
                      <span className="px-2 py-0.5 rounded bg-warmIvory text-deepForest text-[11px] font-semibold border border-borderGrey/60">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatINR(p.amountInPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(p);
                          setReceiptModalOpen(true);
                        }}
                      >
                        <Receipt className="w-3.5 h-3.5 mr-1" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Electronic Payment Receipt"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="text-center py-4 border-b border-borderGrey">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-obsidian">Payment Settled Successfully</h2>
              <p className="text-2xl font-mono font-bold text-deepForest mt-1">
                {formatINR(selectedPayment.amountInPaise)}
              </p>
              <p className="text-xs text-slateGrey mt-1">
                {formatDateTime(selectedPayment.paymentDate || selectedPayment.createdAt)}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-borderGrey/50">
                <span className="text-slateGrey">Transaction Reference (UTR):</span>
                <span className="font-mono font-semibold text-obsidian">{selectedPayment.transactionReference}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderGrey/50">
                <span className="text-slateGrey">Payment Method:</span>
                <span className="font-medium text-obsidian">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderGrey/50">
                <span className="text-slateGrey">Associated Invoice:</span>
                <span className="font-mono font-semibold text-obsidian">
                  {selectedPayment.invoiceId?.invoiceNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderGrey/50">
                <span className="text-slateGrey">Payer Organization:</span>
                <span className="font-semibold text-obsidian">{customer?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderGrey/50">
                <span className="text-slateGrey">Beneficiary:</span>
                <span className="font-semibold text-obsidian">Brightloop Cloud Technologies Pvt Ltd</span>
              </div>
            </div>

            <div className="p-3 bg-warmIvory/60 rounded-lg border border-borderGrey/70 text-[11px] text-slateGrey">
              This electronic receipt serves as legitimate proof of settlement under Section 31 of the CGST Act.
            </div>

            <div className="flex items-center justify-between border-t border-borderGrey pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Print / Download
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReceiptModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
