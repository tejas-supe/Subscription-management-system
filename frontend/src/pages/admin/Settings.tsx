import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Check, Plus, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { TaxRule } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';

export const Settings: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTax, setNewTax] = useState({
    name: '',
    rate: 18,
    description: '',
    isDefault: false
  });

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/taxes');
      if (res.data.success) {
        setTaxes(res.data.taxRules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/taxes', newTax);
      if (res.data.success) {
        setTaxModalOpen(false);
        loadTaxes();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create tax rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">System & Tax Configuration</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Configure India GST brackets, payment terms, and platform operational defaults.
          </p>
        </div>

        <Button
          onClick={() => setTaxModalOpen(true)}
          variant="primary"
          icon={<Plus className="h-4 w-4 text-chartreuse" />}
        >
          Add Tax Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tax Rules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle">
            <h3 className="text-sm font-bold text-obsidian mb-1">India GST Tax Brackets</h3>
            <p className="text-xs text-slategrey mb-4">
              Configurable tax rates applied automatically to quotations, subscriptions, and recurring invoices.
            </p>

            {loading ? (
              <Loader rows={4} />
            ) : (
              <div className="divide-y divide-bordergrey border border-bordergrey rounded-xl overflow-hidden">
                {taxes.map((t) => (
                  <div key={t._id} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-ivory/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-obsidian">{t.name}</span>
                        {t.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-chartreuse/30 text-forest border border-chartreuse">
                            Default SaaS Rate
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slategrey mt-0.5">{t.description || t.jurisdiction}</p>
                    </div>
                    <span className="text-base font-extrabold text-forest tabular-nums">
                      {t.rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Defaults */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle space-y-4 text-xs">
            <h3 className="text-sm font-bold text-obsidian">Platform Financial Standard</h3>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Base Currency</label>
              <div className="p-2.5 rounded-lg border border-bordergrey bg-ivory font-bold flex items-center gap-2 text-obsidian">
                <IndianRupee className="h-4 w-4 text-forest" />
                <span>INR (Indian Rupee — ₹)</span>
              </div>
              <p className="text-[11px] text-slategrey mt-1">Calculations computed in integer paise.</p>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Default Invoicing Term</label>
              <div className="p-2.5 rounded-lg border border-bordergrey bg-ivory font-semibold text-obsidian">
                Net 15 Days
              </div>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Duplicate Prevention Engine</label>
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Idempotency Hash Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rule Modal */}
      <Modal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        title="Add Configurable Tax Rule"
        subtitle="Support custom GST exemptions, reduced rates, or specialized brackets."
        maxWidth="sm"
      >
        <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Tax Rule Name *</label>
            <input
              type="text"
              required
              value={newTax.name}
              onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
              placeholder="e.g. Export 0% GST / SEZ"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Rate Percentage (%) *</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              value={newTax.rate}
              onChange={(e) => setNewTax({ ...newTax, rate: Number(e.target.value) })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Description</label>
            <input
              type="text"
              value={newTax.description}
              onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
              placeholder="Applicable under section 16 of IGST Act"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setTaxModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Tax Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
