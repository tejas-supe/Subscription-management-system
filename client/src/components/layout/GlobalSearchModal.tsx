import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Repeat, Receipt, CreditCard, ArrowRight, X } from 'lucide-react';
import { customerApi, subscriptionApi, invoiceApi, planApi } from '../../services/api';
import { formatINR } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setCustomers([]);
      setSubscriptions([]);
      setInvoices([]);
      setPlans([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [cRes, sRes, iRes, pRes] = await Promise.all([
          customerApi.list({ search: query }),
          subscriptionApi.list(),
          invoiceApi.list({ search: query }),
          planApi.list()
        ]);

        if (cRes.data.success) setCustomers(cRes.data.customers.slice(0, 3));
        if (sRes.data.success) {
          const filtered = sRes.data.subscriptions
            .filter((s: any) =>
              s.subscriptionNumber.toLowerCase().includes(query.toLowerCase()) ||
              s.customerId?.name?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3);
          setSubscriptions(filtered);
        }
        if (iRes.data.success) setInvoices(iRes.data.invoices.slice(0, 3));
        if (pRes.data.success) {
          const filtered = pRes.data.plans
            .filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);
          setPlans(filtered);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-elevated border border-bordergrey overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-3 border-b border-bordergrey px-4 py-3.5 bg-ivory-light">
          <Search className="h-5 w-5 text-forest" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything: 'Vertex', 'SUB-2025', 'INV', 'Core Growth'..."
            className="flex-1 bg-transparent text-sm text-obsidian outline-none placeholder:text-slategrey"
          />
          <button onClick={onClose} className="rounded p-1 text-slategrey hover:text-obsidian">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slategrey">Searching Brightloop database...</div>
          )}

          {!loading && query && customers.length === 0 && subscriptions.length === 0 && invoices.length === 0 && plans.length === 0 && (
            <div className="py-8 text-center text-xs text-slategrey">No matching records found.</div>
          )}

          {/* Customers */}
          {customers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey mb-2 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Customers
              </p>
              <div className="space-y-1">
                {customers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => { onClose(); navigate(`/customers?id=${c._id}`); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ivory cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-obsidian">{c.name}</p>
                      <p className="text-[11px] text-slategrey">{c.company} • {c.customerNumber}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sage" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions */}
          {subscriptions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey mb-2 flex items-center gap-1.5">
                <Repeat className="h-3 w-3" /> Subscriptions
              </p>
              <div className="space-y-1">
                {subscriptions.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => { onClose(); navigate(`/subscriptions`); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ivory cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-obsidian">{s.subscriptionNumber} ({s.status})</p>
                      <p className="text-[11px] text-slategrey">{s.customerId?.name} • {formatINR(s.unitPriceInPaise)}/{s.billingInterval}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sage" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey mb-2 flex items-center gap-1.5">
                <Receipt className="h-3 w-3" /> Invoices
              </p>
              <div className="space-y-1">
                {invoices.map((inv) => (
                  <div
                    key={inv._id}
                    onClick={() => { onClose(); navigate(`/invoices`); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ivory cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-obsidian">{inv.invoiceNumber} ({inv.status})</p>
                      <p className="text-[11px] text-slategrey">{inv.customerId?.name} • Total: {formatINR(inv.totalAmountInPaise)}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sage" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans */}
          {plans.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey mb-2 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> Pricing Plans
              </p>
              <div className="space-y-1">
                {plans.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => { onClose(); navigate(`/plans`); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ivory cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-obsidian">{p.name}</p>
                      <p className="text-[11px] text-slategrey">{formatINR(p.priceInPaise)} / {p.billingInterval}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sage" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-bordergrey px-4 py-2 bg-ivory text-[11px] text-slategrey flex items-center justify-between">
          <span>Navigate with click</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
