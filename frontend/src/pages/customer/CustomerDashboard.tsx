import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  Banknote,
  Repeat,
  Calendar,
  ArrowRight,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { portalService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { formatINR, formatDate, getStatusColor } from '../../utils/formatters';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await portalService.getDashboard();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader rows={6} />;

  const sub = data?.currentSubscription;
  const customer = data?.customer;
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-obsidian text-white p-6 shadow-card border border-obsidian-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-chartreuse">
            Customer Self-Service Hub
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Welcome back, {customer?.name || user?.name}
          </h2>
          <p className="text-xs text-sage mt-0.5">
            {customer?.company || 'Enterprise Account'} • {customer?.customerNumber}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/customer/subscription')}
            icon={<Repeat className="h-4 w-4" />}
          >
            Manage Subscription
          </Button>
        </div>
      </div>

      {/* Subscription Card */}
      {sub ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slategrey">Current Plan</span>
              <h3 className="text-lg font-bold text-obsidian mt-1">{sub.planId?.name}</h3>
              <p className="text-xs text-slategrey">{sub.productId?.name}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              {sub.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-bordergrey">
            <div>
              <span className="text-[10px] font-bold uppercase text-slategrey">Billing Cadence</span>
              <p className="text-sm font-bold text-obsidian capitalize mt-0.5">{sub.billingInterval}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slategrey">Recurring Fee</span>
              <p className="text-sm font-bold text-obsidian tabular-nums mt-0.5">
                {formatINR(sub.unitPriceInPaise * (sub.quantity || 1))} / {sub.billingInterval}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slategrey">Next Renewal Date</span>
              <p className="text-sm font-bold text-forest mt-0.5">{formatDate(sub.nextBillingDate)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-bordergrey bg-white p-8 text-center text-xs text-slategrey">
          No active subscription currently active. Contact your account manager.
        </div>
      )}

      {/* Recent Invoices & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices */}
        <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-obsidian">Recent Invoices</h3>
            <button
              onClick={() => navigate('/customer/invoices')}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-bordergrey">
            {invoices.slice(0, 4).map((inv: any) => {
              const colors = getStatusColor(inv.status);
              return (
                <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-obsidian font-mono">{inv.invoiceNumber}</span>
                    <p className="text-[11px] text-slategrey">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-obsidian tabular-nums">{formatINR(inv.totalAmountInPaise)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payments */}
        <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-obsidian">Payment Records</h3>
            <button
              onClick={() => navigate('/customer/payments')}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-bordergrey">
            {payments.slice(0, 4).map((p: any) => (
              <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-obsidian font-mono">{p.paymentNumber}</span>
                  <p className="text-[11px] text-slategrey">{p.method} • {formatDate(p.paymentDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-obsidian tabular-nums">{formatINR(p.amountInPaise)}</p>
                  <span className="text-[11px] font-semibold text-emerald-800">Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
