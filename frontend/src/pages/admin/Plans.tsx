import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Check, X, Layers, Sparkles } from 'lucide-react';
import { productService } from '../../services/productService';
import { Plan, Product } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatINR, getStatusColor } from '../../utils/formatters';

export const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervalFilter, setIntervalFilter] = useState('All');
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    code: '',
    description: '',
    billingInterval: 'monthly',
    intervalCount: 1,
    priceInRupees: 4999,
    trialPeriodDays: 14,
    setupFeeInRupees: 0,
    features: '',
    defaultTaxRate: 18
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [planRes, prodRes] = await Promise.all([
        productService.listPlans({ billingInterval: intervalFilter !== 'All' ? intervalFilter : undefined }),
        productService.list()
      ]);

      if (planRes.data.success) setPlans(planRes.data.plans);
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        if (prodRes.data.products.length > 0 && !formData.productId) {
          setFormData(prev => ({ ...prev, productId: prodRes.data.products[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [intervalFilter]);

  const openComparison = async () => {
    try {
      const res = await productService.comparePlans();
      if (res.data.success) {
        setComparisonData(res.data);
        setComparisonModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const featureList = formData.features.split('\n').map(f => f.trim()).filter(Boolean);
    const priceInPaise = Math.round(formData.priceInRupees * 100);
    const setupFeeInPaise = Math.round(formData.setupFeeInRupees * 100);

    try {
      if (editingPlan) {
        await productService.updatePlan(editingPlan._id, {
          productId: formData.productId,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          billingInterval: formData.billingInterval,
          intervalCount: formData.intervalCount,
          priceInPaise,
          trialPeriodDays: formData.trialPeriodDays,
          setupFeeInPaise,
          features: featureList,
          defaultTaxRate: formData.defaultTaxRate
        });
      } else {
        await productService.createPlan({
          productId: formData.productId,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          billingInterval: formData.billingInterval,
          intervalCount: formData.intervalCount,
          priceInPaise,
          trialPeriodDays: formData.trialPeriodDays,
          setupFeeInPaise,
          features: featureList,
          defaultTaxRate: formData.defaultTaxRate
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditingPlan(null);
    setFormData({
      productId: products[0]?._id || '',
      name: '',
      code: '',
      description: '',
      billingInterval: 'monthly',
      intervalCount: 1,
      priceInRupees: 4999,
      trialPeriodDays: 14,
      setupFeeInRupees: 0,
      features: '',
      defaultTaxRate: 18
    });
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditingPlan(p);
    setFormData({
      productId: typeof p.productId === 'object' ? p.productId._id : p.productId,
      name: p.name,
      code: p.code,
      description: p.description,
      billingInterval: p.billingInterval,
      intervalCount: p.intervalCount || 1,
      priceInRupees: p.priceInPaise / 100,
      trialPeriodDays: p.trialPeriodDays || 0,
      setupFeeInRupees: (p.setupFeeInPaise || 0) / 100,
      features: p.features ? p.features.join('\n') : '',
      defaultTaxRate: p.defaultTaxRate || 18
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Pricing & Subscription Plans</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Configure multi-cadence billing rates, trial periods, setup fees, and feature matrices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={openComparison}
            variant="outline"
            icon={<Layers className="h-4 w-4 text-forest" />}
          >
            Compare Plans Matrix
          </Button>
          <Button
            onClick={openCreate}
            variant="primary"
            icon={<Plus className="h-4 w-4 text-chartreuse" />}
          >
            Create Plan
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs">
          {(['All', 'monthly', 'quarterly', 'yearly'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setIntervalFilter(interval)}
              className={`px-3.5 py-1 font-semibold rounded-lg capitalize transition-all ${
                intervalFilter === interval
                  ? 'bg-obsidian text-chartreuse shadow-xs'
                  : 'text-slategrey hover:text-obsidian'
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader rows={5} />
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No pricing plans found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const colors = getStatusColor(p.status);
            const isAnnual = p.billingInterval === 'yearly';
            const prodName = typeof p.productId === 'object' ? p.productId.name : 'Product';

            return (
              <div
                key={p._id}
                className={`rounded-2xl border bg-white p-6 shadow-subtle flex flex-col justify-between transition-all ${
                  isAnnual ? 'border-chartreuse/60 shadow-glow-chartreuse/10' : 'border-bordergrey'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-ivory text-forest border border-bordergrey">
                        {p.code}
                      </span>
                      <h3 className="text-lg font-bold text-obsidian mt-2">{p.name}</h3>
                      <p className="text-xs text-slategrey font-medium">{prodName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-obsidian tabular-nums">
                      {formatINR(p.priceInPaise)}
                    </span>
                    <span className="text-xs text-slategrey font-semibold uppercase">
                      /{p.billingInterval}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slategrey">
                    {p.trialPeriodDays > 0 && (
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {p.trialPeriodDays}d Free Trial
                      </span>
                    )}
                    {p.setupFeeInPaise > 0 && (
                      <span>+ {formatINR(p.setupFeeInPaise)} setup fee</span>
                    )}
                  </div>

                  <p className="text-xs text-slategrey mt-3 line-clamp-2">
                    {p.description || 'Enterprise plan tier.'}
                  </p>

                  <div className="mt-5 pt-3 border-t border-bordergrey space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey">Included Benefits</p>
                    <ul className="text-xs space-y-1.5">
                      {p.features?.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-obsidian">
                          <Check className="h-3.5 w-3.5 text-forest shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-bordergrey flex items-center justify-between">
                  <span className="text-xs font-semibold text-forest">
                    {p.activeSubscribersCount || 0} active subscribers
                  </span>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1 rounded text-slategrey hover:text-obsidian hover:bg-ivory"
                    title="Edit Plan"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Comparison Matrix Modal */}
      <Modal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        title="Plan Comparison Matrix"
        subtitle="Side-by-side feature comparison across active commercial tiers."
        maxWidth="4xl"
      >
        {comparisonData && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey">
                <tr>
                  <th className="p-3 font-bold text-obsidian">Feature / Capability</th>
                  {comparisonData.plans?.map((p: any) => (
                    <th key={p._id} className="p-3 font-bold text-obsidian text-center">
                      <div>{p.name}</div>
                      <div className="text-forest font-bold">{formatINR(p.priceInPaise)}/{p.billingInterval}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {comparisonData.featureMatrix?.map((feat: string, idx: number) => (
                  <tr key={idx} className="hover:bg-ivory/30">
                    <td className="p-3 font-medium text-obsidian">{feat}</td>
                    {comparisonData.plans?.map((p: any) => {
                      const bullet = p.comparisonBullets?.find((b: any) => b.feature === feat);
                      return (
                        <td key={p._id} className="p-3 text-center">
                          {bullet ? (
                            bullet.included ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <Check className="h-4 w-4" /> {bullet.detail || 'Included'}
                              </span>
                            ) : (
                              <span className="text-slategrey">—</span>
                            )
                          ) : (
                            <span className="text-slategrey">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Pricing Plan'}
        subtitle="Configure pricing interval, trial duration, and tier limits."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Target Product *</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                {products.map(prod => (
                  <option key={prod._id} value={prod._id}>{prod.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Core Growth Annual"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Plan SKU Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CORE-GROWTH-YR"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Billing Interval</label>
              <select
                value={formData.billingInterval}
                onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Price (₹ INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.priceInRupees}
                onChange={(e) => setFormData({ ...formData, priceInRupees: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Trial Days</label>
              <input
                type="number"
                min="0"
                value={formData.trialPeriodDays}
                onChange={(e) => setFormData({ ...formData, trialPeriodDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Setup Fee (₹ INR)</label>
              <input
                type="number"
                min="0"
                value={formData.setupFeeInRupees}
                onChange={(e) => setFormData({ ...formData, setupFeeInRupees: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Features (One per line)</label>
            <textarea
              rows={3}
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Up to 5,000 active subscriptions&#10;Automated recurring billing&#10;GST e-Invoicing&#10;24/7 SLA"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
