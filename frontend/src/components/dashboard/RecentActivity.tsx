import React from 'react';
import { ArrowRight, Calendar, Banknote } from 'lucide-react';
import { Payment } from '../../types';
import { formatINR, formatDate, getStatusColor } from '../../utils/formatters';

interface RecentActivityProps {
  payments: Payment[];
  upcomingRenewals: any[];
  onViewAllPayments?: () => void;
  onViewAllRenewals?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  payments,
  upcomingRenewals,
  onViewAllPayments,
  onViewAllRenewals,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Transactions */}
      <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-obsidian tracking-tight">Recent Transactions</h3>
            <p className="text-xs text-slategrey">Latest recorded payments and gateway settlements</p>
          </div>
          {onViewAllPayments && (
            <button
              onClick={onViewAllPayments}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="divide-y divide-bordergrey overflow-x-auto">
          {payments.map((p) => {
            const colors = getStatusColor(p.status);
            return (
              <div key={p._id} className="py-3 flex items-center justify-between text-xs hover:bg-ivory/50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-ivory flex items-center justify-center font-bold text-[11px] text-forest border border-bordergrey">
                    {p.method === 'UPI' ? 'UPI' : p.method === 'Card' ? 'CRD' : 'BNK'}
                  </div>
                  <div>
                    <p className="font-semibold text-obsidian">{p.customerId?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slategrey">{p.paymentNumber} • {formatDate(p.paymentDate)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-obsidian tabular-nums">{formatINR(p.amountInPaise)}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Renewals Window */}
      <div className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-obsidian tracking-tight">Upcoming Renewals (Next 7 Days)</h3>
            <p className="text-xs text-slategrey">Subscriptions with billing cycle renewal due</p>
          </div>
          {onViewAllRenewals && (
            <button
              onClick={onViewAllRenewals}
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Smart Renewals</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="divide-y divide-bordergrey overflow-x-auto">
          {upcomingRenewals.map((sub: any) => (
            <div key={sub._id} className="py-3 flex items-center justify-between text-xs hover:bg-ivory/50 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-chartreuse/20 flex items-center justify-center text-forest border border-chartreuse/40">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-obsidian">{sub.customerId?.name}</p>
                  <p className="text-[11px] text-slategrey">{sub.planId?.name} ({sub.billingInterval})</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-obsidian tabular-nums">{formatINR(sub.unitPriceInPaise * (sub.quantity || 1))}</p>
                <span className="text-[11px] font-medium text-emerald-800">
                  Due {formatDate(sub.nextBillingDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
