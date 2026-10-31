import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle, Clock, ShieldCheck, Percent, IndianRupee } from 'lucide-react';
import { discountService } from '../../services/analyticsService';
import { Discount } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, formatDate, getStatusColor } from '../../utils/formatters';

export const Discounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create form
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(15);
  const [minPurchaseRupees, setMinPurchaseRupees] = useState(10000);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [maxRedemptions, setMaxRedemptions] = useState(100);

  // Test form
  const [testCode, setTestCode] = useState('FESTIVE25');
  const [testAmount, setTestAmount] = useState(50000);
  const [testResult, setTestResult] = useState<any>(null);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = await discountService.list();
      if (res.data.success) {
        setDiscounts(res.data.discounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const actualValue = type === 'fixed' ? value * 100 : value;
      const res = await discountService.create({
        code: code.toUpperCase(),
        description,
        type,
        value: actualValue,
        minPurchaseInPaise: minPurchaseRupees * 100,
        validUntil: new Date(validUntil),
        maxRedemptions
      });
      if (res.data.success) {
        setCreateOpen(false);
        loadDiscounts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Discount creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await discountService.validate({
        code: testCode,
        amountInPaise: testAmount * 100
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ error: err.response?.data?.message || 'Invalid coupon' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Discounts & Coupons</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Configure promotional percentage rebates, fixed credits, and redemption eligibility rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setTestModalOpen(true)}
            variant="outline"
            icon={<ShieldCheck className="h-4 w-4 text-forest" />}
          >
            Test Coupon Eligibility
          </Button>

          <Button
            onClick={() => setCreateOpen(true)}
            variant="primary"
            icon={<Plus className="h-4 w-4 text-chartreuse" />}
          >
            Create Coupon
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader rows={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discounts.map((d) => {
            const colors = getStatusColor(d.status);
            return (
              <div
                key={d._id}
                className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded bg-obsidian text-chartreuse">
                      {d.code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-obsidian">
                      {d.type === 'percentage' ? `${d.value}% OFF` : `₹${(d.value / 100).toLocaleString('en-IN')} OFF`}
                    </span>
                  </div>

                  <p className="text-xs text-slategrey mt-2">
                    {d.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-bordergrey space-y-1 text-xs text-slategrey">
                    <p>Min Purchase: <strong className="text-obsidian">{formatINR(d.minPurchaseInPaise)}</strong></p>
                    <p>Redemptions: <strong className="text-obsidian">{d.currentRedemptions} / {d.maxRedemptions}</strong></p>
                    <p>Valid Until: <strong className="text-obsidian">{formatDate(d.validUntil)}</strong></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Coupon Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Coupon Validation Engine"
        subtitle="Verify discount calculations against a candidate purchase total."
        maxWidth="sm"
      >
        <form onSubmit={handleTestCoupon} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Purchase Amount (₹ INR)</label>
            <input
              type="number"
              required
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <Button variant="primary" type="submit" className="w-full">
            Evaluate Eligibility
          </Button>

          {testResult && (
            <div className={`p-3 rounded-lg border text-xs font-medium ${
              testResult.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.valid ? (
                <div>
                  <p className="font-bold">✓ Coupon Valid!</p>
                  <p>Calculated Discount: {formatINR(testResult.discount.calculatedDiscountPaise)}</p>
                  <p className="text-[11px] text-emerald-700">Net Payable: ₹{(testAmount - (testResult.discount.calculatedDiscountPaise / 100)).toLocaleString('en-IN')}</p>
                </div>
              ) : (
                <p>✗ {testResult.error || testResult.message}</p>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Promotional Coupon"
        subtitle="Configure discount rate, validity window, and usage caps."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DIWALI25"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹ INR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 25% off enterprise annual contracts"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">
                {type === 'percentage' ? 'Percentage Value (%)' : 'Fixed Rebate (₹ INR)'} *
              </label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Min Purchase (₹ INR)</label>
              <input
                type="number"
                value={minPurchaseRupees}
                onChange={(e) => setMinPurchaseRupees(Number(e.target.value))}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Valid Until *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Max Redemptions</label>
              <input
                type="number"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Publish Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
