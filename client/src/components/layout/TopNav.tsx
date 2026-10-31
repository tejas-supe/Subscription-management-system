import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  UserCheck,
  ChevronDown,
  LogOut,
  ExternalLink,
  Shield,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface TopNavProps {
  onOpenSearch: () => void;
  onOpenQuickCreate: (type: 'customer' | 'quotation' | 'subscription' | 'payment') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSearch, onOpenQuickCreate }) => {
  const { user, switchPersona, logout } = useAuth();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Compute breadcrumb title from path
  const getBreadcrumb = () => {
    const p = location.pathname.split('/').filter(Boolean);
    if (p.length === 0) return 'Command Center';
    const segment = p[0];
    const mapping: Record<string, string> = {
      customers: 'Customers Management',
      products: 'Product Catalog',
      plans: 'Pricing & Subscription Plans',
      quotations: 'Quotations & Contracts',
      subscriptions: 'Subscription Lifecycle',
      invoices: 'Invoices & Billing Engine',
      payments: 'Payment Management & Reconciliation',
      discounts: 'Discounts & Coupons',
      analytics: 'Revenue Analytics',
      'health-monitor': 'Subscription Health Monitor',
      'smart-renewals': 'Smart Renewal Center',
      'leakage-alerts': 'Revenue Leakage Alerts',
      reconciliation: 'Financial Reconciliation',
      team: 'Team & Role Access Control',
      'audit-logs': 'System Audit Logs',
      settings: 'Settings & Tax Configuration',
      portal: 'Customer Self-Service Portal'
    };
    return mapping[segment] || segment;
  };

  const handleRoleSwitch = async (role: UserRole) => {
    await switchPersona(role);
    if (role === 'CUSTOMER') {
      navigate('/portal');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-bordergrey bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slategrey">
          BRIGHTLOOP
        </span>
        <span className="text-bordergrey-dark">/</span>
        <h1 className="text-sm font-semibold text-obsidian tracking-tight">
          {getBreadcrumb()}
        </h1>
      </div>

      {/* Middle: Global Search Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-lg border border-bordergrey bg-ivory/50 px-3 py-1.5 text-xs text-slategrey hover:border-forest/40 hover:bg-white transition-all shadow-subtle"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slategrey" />
            <span>Search customers, subscriptions, invoices, or plans...</span>
          </div>
          <kbd className="rounded border border-bordergrey bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slategrey shadow-xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Hackathon Persona Switcher (CRITICAL FOR LIVE JUDGE DEMONSTRATION) */}
        <div className="hidden sm:flex items-center rounded-lg border border-bordergrey bg-ivory p-0.5 text-xs">
          <span className="px-2 py-1 text-[10px] font-bold text-slategrey uppercase tracking-wider">
            Persona:
          </span>
          <button
            onClick={() => handleRoleSwitch('ADMIN')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-obsidian text-chartreuse shadow-subtle'
                : 'text-slategrey hover:text-obsidian'
            }`}
            title="Switch to Admin Persona"
          >
            <Shield className="h-3 w-3" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => handleRoleSwitch('STAFF')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              user?.role === 'STAFF'
                ? 'bg-obsidian text-chartreuse shadow-subtle'
                : 'text-slategrey hover:text-obsidian'
            }`}
            title="Switch to Staff Persona"
          >
            <Briefcase className="h-3 w-3" />
            <span>Staff</span>
          </button>
          <button
            onClick={() => handleRoleSwitch('CUSTOMER')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              user?.role === 'CUSTOMER'
                ? 'bg-obsidian text-chartreuse shadow-subtle'
                : 'text-slategrey hover:text-obsidian'
            }`}
            title="Switch to Customer Self-Service Persona"
          >
            <UserIcon className="h-3 w-3" />
            <span>Customer</span>
          </button>
        </div>

        {/* Quick Create Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1.5 rounded-lg bg-obsidian px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest transition-colors shadow-subtle"
          >
            <Plus className="h-3.5 w-3.5 text-chartreuse" />
            <span>Create</span>
            <ChevronDown className="h-3 w-3 text-sage" />
          </button>

          {quickCreateOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl border border-bordergrey bg-white p-1.5 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setQuickCreateOpen(false)}
            >
              <button
                onClick={() => { setQuickCreateOpen(false); onOpenQuickCreate('customer'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-obsidian hover:bg-ivory"
              >
                <span>Add Customer</span>
              </button>
              <button
                onClick={() => { setQuickCreateOpen(false); onOpenQuickCreate('quotation'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-obsidian hover:bg-ivory"
              >
                <span>New Quotation</span>
              </button>
              <button
                onClick={() => { setQuickCreateOpen(false); onOpenQuickCreate('subscription'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-obsidian hover:bg-ivory"
              >
                <span>New Subscription</span>
              </button>
              <button
                onClick={() => { setQuickCreateOpen(false); onOpenQuickCreate('payment'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-obsidian hover:bg-ivory"
              >
                <span>Record Payment</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-slategrey hover:bg-ivory hover:text-obsidian transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chartreuse opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
          </button>

          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl border border-bordergrey bg-white p-3 shadow-elevated z-50"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between border-b border-bordergrey pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-obsidian">Revenue Alerts</span>
                <span className="text-[10px] font-semibold text-chartreuse bg-obsidian px-2 py-0.5 rounded">3 Active</span>
              </div>
              <div className="space-y-2 text-xs">
                <div
                  onClick={() => { setNotificationsOpen(false); navigate('/leakage-alerts'); }}
                  className="cursor-pointer p-2 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100/70 transition-colors"
                >
                  <p className="font-semibold text-rose-900">3 Overdue Invoices Detected</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">₹1,76,990 pending collection past payment terms.</p>
                </div>
                <div
                  onClick={() => { setNotificationsOpen(false); navigate('/smart-renewals'); }}
                  className="cursor-pointer p-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/70 transition-colors"
                >
                  <p className="font-semibold text-emerald-900">5 Upcoming Renewals in Next 7 Days</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Automated billing run scheduled.</p>
                </div>
                <div
                  onClick={() => { setNotificationsOpen(false); navigate('/health-monitor'); }}
                  className="cursor-pointer p-2 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-colors"
                >
                  <p className="font-semibold text-amber-900">1 Failed Payment Attempt</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">UPI timeout on Vertex Media invoice.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-ivory transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover border border-bordergrey"
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-bordergrey bg-white p-2 shadow-elevated z-50"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="p-2 border-b border-bordergrey mb-1">
                <p className="text-xs font-semibold text-obsidian">{user?.name}</p>
                <p className="text-[11px] text-slategrey truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-ivory text-forest border border-bordergrey">
                  Role: {user?.role}
                </span>
              </div>
              <button
                onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-obsidian hover:bg-ivory"
              >
                <span>Settings</span>
              </button>
              <button
                onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
