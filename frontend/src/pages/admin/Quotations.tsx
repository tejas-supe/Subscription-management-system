import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Repeat,
  Download,
  Trash2,
  ExternalLink,
  Receipt,
  Calendar,
} from 'lucide-react';
import { quotationService } from '../../services/analyticsService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Quotation, Customer, Product, Plan } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, formatDate, getStatusColor } from '../../utils/formatters';

export const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchParams] = useSearchParams();

  // Preview & Convert Modals
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Builder Form State
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<Array<{
    productId: string;
    planId: string;
    description: string;
    quantity: number;
    unitPriceInRupees: number;
    discountPercent: number;
    taxRate: number;
  }>>([]);
  const [notes, setNotes] = useState('Custom proposal prepared for enterprise deployment.');

  const loadData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes, pRes, plRes] = await Promise.all([
        quotationService.list({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        customerService.list(),
        productService.list(),
        productService.listPlans()
      ]);

      if (qRes.data.success) setQuotations(qRes.data.quotations);
      if (cRes.data.success) {
        setCustomers(cRes.data.customers);
        if (cRes.data.customers.length > 0 && !customerId) {
          setCustomerId(cRes.data.customers[0]._id);
        }
      }
      if (pRes.data.success) setProducts(pRes.data.products);
      if (plRes.data.success) {
        setPlans(plRes.data.plans);
        if (lineItems.length === 0 && plRes.data.plans.length > 0) {
          const firstPlan = plRes.data.plans[0];
          const prodId = typeof firstPlan.productId === 'object' ? firstPlan.productId._id : firstPlan.productId;
          setLineItems([{
            productId: prodId,
            planId: firstPlan._id,
            description: `${firstPlan.name} Subscription`,
            quantity: 1,
            unitPriceInRupees: firstPlan.priceInPaise / 100,
            discountPercent: 0,
            taxRate: 18
          }]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Unable to load quotations. Check backend service.');
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

  const addLineItem = () => {
    if (plans.length === 0) return;
    const plan = plans[0];
    const prodId = typeof plan.productId === 'object' ? plan.productId._id : plan.productId;
    setLineItems([...lineItems, {
      productId: prodId,
      planId: plan._id,
      description: `${plan.name} License`,
      quantity: 1,
      unitPriceInRupees: plan.priceInPaise / 100,
      discountPercent: 0,
      taxRate: 18
    }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handlePlanChange = (index: number, planId: string) => {
    const plan = plans.find(p => p._id === planId);
    if (!plan) return;
    const prodId = typeof plan.productId === 'object' ? plan.productId._id : plan.productId;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      planId: plan._id,
      productId: prodId,
      description: `${plan.name} Subscription`,
      unitPriceInRupees: plan.priceInPaise / 100,
      taxRate: plan.defaultTaxRate || 18
    };
    setLineItems(updated);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    lineItems.forEach(item => {
      const lineSub = (item.quantity || 1) * (item.unitPriceInRupees || 0);
      const lineDisc = Math.round((lineSub * (item.discountPercent || 0)) / 100);
      const taxable = lineSub - lineDisc;
      const lineTax = Math.round((taxable * (item.taxRate || 18)) / 100);

      subtotal += lineSub;
      discountTotal += lineDisc;
      taxTotal += lineTax;
    });

    const grandTotal = subtotal - discountTotal + taxTotal;
    return { subtotal, discountTotal, taxTotal, grandTotal };
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const processedItems = lineItems.map(item => ({
        productId: item.productId,
        planId: item.planId,
        description: item.description,
        quantity: item.quantity,
        unitPriceInPaise: Math.round(item.unitPriceInRupees * 100),
        discountPercent: item.discountPercent,
        taxRate: item.taxRate
      }));

      const res = await quotationService.create({
        customerId,
        lineItems: processedItems,
        notes
      });

      if (res.data.success) {
        setCreateOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const res = await quotationService.send(id);
      if (res.data.success) {
        setMessage(res.data.message);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await quotationService.accept(id);
      if (res.data.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await quotationService.convert(id);
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Conversion failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Quotations & CPQ</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Create enterprise contract proposals, dispatch safe demo emails, and convert accepted quotes to subscriptions.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          variant="primary"
          icon={<Plus className="h-4 w-4 text-chartreuse" />}
        >
          Create Quotation
        </Button>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(''); loadData(); }} className="text-rose-900 font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs w-fit">
        {(['All', 'Draft', 'Sent', 'Accepted', 'Converted', 'Rejected'] as const).map((st) => (
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

      {/* Quotations Table */}
      {loading ? (
        <Loader rows={5} />
      ) : quotations.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No quotations found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Quotation #</th>
                  <th className="px-5 py-3.5">Customer & Entity</th>
                  <th className="px-5 py-3.5">Subtotal</th>
                  <th className="px-5 py-3.5">Tax (GST)</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {quotations.map((q) => {
                  const colors = getStatusColor(q.status);
                  return (
                    <tr key={q._id} className="hover:bg-ivory/50 transition-colors">
                      <td className="px-5 py-4 font-bold font-mono text-obsidian">
                        {q.quotationNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-obsidian">{q.customerId?.name}</div>
                        <div className="text-[11px] text-slategrey">{q.customerId?.company}</div>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slategrey">
                        {formatINR(q.subtotalInPaise)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slategrey">
                        {formatINR(q.taxTotalInPaise)}
                      </td>
                      <td className="px-5 py-4 font-bold text-obsidian tabular-nums">
                        {formatINR(q.grandTotalInPaise)}
                      </td>
                      <td className="px-5 py-4 text-slategrey">
                        {formatDate(q.expiryDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === 'Draft' && (
                            <button
                              onClick={() => handleSend(q._id)}
                              className="px-2 py-1 rounded border border-bordergrey hover:bg-ivory text-[11px] font-semibold flex items-center gap-1 text-forest"
                              title="Send to customer"
                            >
                              <Send className="h-3 w-3" />
                              <span>Send</span>
                            </button>
                          )}

                          {q.status === 'Sent' && (
                            <button
                              onClick={() => handleAccept(q._id)}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                              title="Accept quote"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Accept</span>
                            </button>
                          )}

                          {q.status === 'Accepted' && (
                            <button
                              onClick={() => handleConvert(q._id)}
                              className="px-2.5 py-1 rounded bg-chartreuse text-obsidian font-bold text-[11px] flex items-center gap-1 shadow-subtle hover:bg-chartreuse-hover"
                              title="Convert to Subscription"
                            >
                              <Repeat className="h-3 w-3" />
                              <span>Convert to Sub</span>
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedQuotation(q); setPreviewOpen(true); }}
                            className="p-1.5 rounded hover:bg-ivory text-slategrey hover:text-obsidian"
                            title="Preview PDF"
                          >
                            <FileText className="h-4 w-4" />
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

      {/* Quotation Preview Modal */}
      {selectedQuotation && (
        <Modal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`Quotation ${selectedQuotation.quotationNumber}`}
          subtitle="Commercial proposal summary & printable PDF layout."
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs p-2">
            <div className="flex justify-between items-start border-b border-bordergrey pb-4">
              <div>
                <span className="font-extrabold tracking-widest text-base text-obsidian">BRIGHTLOOP</span>
                <p className="text-slategrey text-[11px] mt-1">Enterprise Subscription & Billing Ops</p>
                <p className="text-slategrey text-[11px]">Bengaluru, Karnataka, India</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-obsidian">{selectedQuotation.quotationNumber}</span>
                <p className="text-slategrey text-[11px] mt-1">Date: {formatDate(selectedQuotation.createdAt)}</p>
                <p className="text-slategrey text-[11px]">Valid Until: {formatDate(selectedQuotation.expiryDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-ivory p-3 rounded-xl border border-bordergrey">
              <div>
                <span className="text-[10px] font-bold uppercase text-slategrey">Prepared For:</span>
                <p className="font-bold text-obsidian mt-0.5">{selectedQuotation.customerId?.name}</p>
                <p className="text-slategrey">{selectedQuotation.customerId?.company}</p>
                <p className="text-slategrey font-mono text-[11px]">GSTIN: {selectedQuotation.customerId?.gstNumber || 'Unregistered'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slategrey">Status:</span>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-obsidian text-chartreuse">
                    {selectedQuotation.status}
                  </span>
                </div>
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="border-b border-bordergrey bg-ivory text-[10px] uppercase font-bold text-slategrey">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">GST</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {selectedQuotation.lineItems?.map((item: any, i: number) => (
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
                  <span className="font-bold text-obsidian">{formatINR(selectedQuotation.subtotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-slategrey">
                  <span>GST Tax Total:</span>
                  <span className="font-bold text-obsidian">{formatINR(selectedQuotation.taxTotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-obsidian pt-2 border-t border-bordergrey">
                  <span>Grand Total:</span>
                  <span className="tabular-nums text-forest">{formatINR(selectedQuotation.grandTotalInPaise)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-bordergrey">
              <Button
                variant="outline"
                onClick={() => window.print()}
                icon={<Download className="h-4 w-4" />}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Quotation Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Commercial Quotation"
        subtitle="Configure client items, discounts, and GST rates for 1-click subscription conversion."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-obsidian mb-1">Select Client Account *</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
            >
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slategrey text-[10px]">
                Contract Line Items
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            {lineItems.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-bordergrey bg-ivory/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-obsidian text-[11px] mb-1">Select Plan</label>
                    <select
                      value={item.planId}
                      onChange={(e) => handlePlanChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-bordergrey p-1.5 outline-none focus:border-forest bg-white"
                    >
                      {plans.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.billingInterval}) — ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-obsidian text-[11px] mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].quantity = Number(e.target.value);
                        setLineItems(updated);
                      }}
                      className="w-full rounded-lg border border-bordergrey p-1.5 outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-obsidian text-[11px] mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      value={item.unitPriceInRupees}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].unitPriceInRupees = Number(e.target.value);
                        setLineItems(updated);
                      }}
                      className="w-full rounded-lg border border-bordergrey p-1.5 outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-obsidian text-[11px] mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].discountPercent = Number(e.target.value);
                        setLineItems(updated);
                      }}
                      className="w-full rounded-lg border border-bordergrey p-1.5 outline-none focus:border-forest"
                    />
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex-1">
                      <label className="block font-semibold text-obsidian text-[11px] mb-1">GST Tax (%)</label>
                      <select
                        value={item.taxRate}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx].taxRate = Number(e.target.value);
                          setLineItems(updated);
                        }}
                        className="w-full rounded-lg border border-bordergrey p-1.5 outline-none focus:border-forest bg-white"
                      >
                        <option value={0}>0% GST</option>
                        <option value={5}>5% GST</option>
                        <option value={12}>12% GST</option>
                        <option value={18}>18% GST (Standard)</option>
                        <option value={28}>28% GST</option>
                      </select>
                    </div>

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="ml-2 p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-ivory rounded-xl border border-bordergrey text-right space-y-1">
            <p className="text-slategrey">Subtotal: <span className="font-bold text-obsidian">₹{totals.subtotal.toLocaleString('en-IN')}</span></p>
            <p className="text-slategrey">Tax (GST): <span className="font-bold text-obsidian">₹{totals.taxTotal.toLocaleString('en-IN')}</span></p>
            <p className="text-sm font-bold text-forest">Grand Total: ₹{totals.grandTotal.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Generate Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
