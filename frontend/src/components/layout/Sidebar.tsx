import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  FileText,
  Repeat,
  Receipt,
  Banknote,
  Tag,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isCustomer } = useAuth();
  const location = useLocation();

  // If customer role or inside /customer path, show dedicated customer portal sidebar
  if (isCustomer || location.pathname.startsWith('/customer')) {
    return (
      <aside
        className={`flex flex-col bg-obsidian text-white transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        } min-h-screen border-r border-obsidian-light shrink-0`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-obsidian-surface">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
                BL
              </div>
              <div>
                <span className="font-bold tracking-widest text-sm text-white">BRIGHTLOOP</span>
                <span className="block text-[9px] font-semibold tracking-wider uppercase text-chartreuse">Customer Portal</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
              BL
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slategrey hover:text-white p-1 rounded hidden md:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 px-3 py-6 space-y-1.5 dark-scroll overflow-y-auto">
          <SidebarLink to="/customer/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
          <SidebarLink to="/customer/subscription" icon={Repeat} label="My Subscription" collapsed={collapsed} />
          <SidebarLink to="/customer/invoices" icon={Receipt} label="My Invoices" collapsed={collapsed} />
          <SidebarLink to="/customer/payments" icon={Banknote} label="My Payments" collapsed={collapsed} />
          <SidebarLink to="/customer/profile" icon={UserIcon} label="My Profile" collapsed={collapsed} />
        </div>

        {/* Workspace switch link */}
        <div className="p-4 border-t border-obsidian-surface">
          <NavLink
            to="/admin/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-forest text-chartreuse hover:bg-forest-light transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {!collapsed && <span>Switch to Admin View</span>}
          </NavLink>
        </div>
      </aside>
    );
  }

  // Administrative Workspace Sidebar
  return (
    <aside
      className={`flex flex-col bg-obsidian text-white transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen border-r border-obsidian-light shrink-0`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-obsidian-surface">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
              BL
            </div>
            <div>
              <span className="font-bold tracking-widest text-sm text-white">BRIGHTLOOP</span>
              <span className="block text-[9px] font-semibold tracking-wider uppercase text-sage">Revenue Command</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
            BL
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slategrey hover:text-white p-1 rounded hidden md:block"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6 dark-scroll overflow-y-auto">
        {/* OVERVIEW */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
              Overview
            </p>
          )}
          <div className="space-y-1">
            <SidebarLink to="/admin/dashboard" icon={LayoutDashboard} label="Command Center" collapsed={collapsed} />
          </div>
        </div>

        {/* COMMERCE */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
              Commerce
            </p>
          )}
          <div className="space-y-1">
            <SidebarLink to="/admin/customers" icon={Users} label="Customers" collapsed={collapsed} />
            <SidebarLink to="/admin/products" icon={Package} label="Products" collapsed={collapsed} />
            <SidebarLink to="/admin/plans" icon={CreditCard} label="Pricing & Plans" collapsed={collapsed} />
            <SidebarLink to="/admin/quotations" icon={FileText} label="Quotations" collapsed={collapsed} />
          </div>
        </div>

        {/* REVENUE */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
              Revenue
            </p>
          )}
          <div className="space-y-1">
            <SidebarLink to="/admin/subscriptions" icon={Repeat} label="Subscriptions" collapsed={collapsed} />
            <SidebarLink to="/admin/invoices" icon={Receipt} label="Invoices" collapsed={collapsed} />
            <SidebarLink to="/admin/payments" icon={Banknote} label="Payments" collapsed={collapsed} />
            <SidebarLink to="/admin/discounts" icon={Tag} label="Discounts" collapsed={collapsed} />
          </div>
        </div>

        {/* INTELLIGENCE */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-wider text-chartreuse uppercase">
                Intelligence
              </p>
              <Sparkles className="h-3 w-3 text-chartreuse" />
            </div>
          )}
          <div className="space-y-1">
            <SidebarLink to="/admin/analytics" icon={BarChart3} label="Revenue Analytics" collapsed={collapsed} />
            <SidebarLink to="/admin/revenue-sentinel" icon={ShieldAlert} label="Revenue Sentinel" collapsed={collapsed} badge="AI Alerts" />
          </div>
        </div>

        {/* SYSTEM */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
              System
            </p>
          )}
          <div className="space-y-1">
            <SidebarLink to="/admin/team" icon={ShieldCheck} label="Team & Roles" collapsed={collapsed} />
            <SidebarLink to="/admin/audit-logs" icon={History} label="Audit Logs" collapsed={collapsed} />
            <SidebarLink to="/admin/settings" icon={Settings} label="Settings" collapsed={collapsed} />
          </div>
        </div>

        {/* Customer Self-Service Portal Preview */}
        <div className="pt-2">
          <NavLink
            to="/customer/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-forest text-chartreuse hover:bg-forest-light transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Customer Portal Preview</span>}
          </NavLink>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-obsidian-surface">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-obsidian-surface">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover border border-chartreuse/40"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <span className="text-[10px] text-chartreuse font-medium uppercase tracking-wider">{user?.role || 'ADMIN'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  badge?: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, collapsed, badge }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-chartreuse text-obsidian font-semibold shadow-glow-chartreuse/20'
            : 'text-sage hover:bg-obsidian-surface hover:text-white'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && badge && (
        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-chartreuse/20 text-chartreuse uppercase">
          {badge}
        </span>
      )}
    </NavLink>
  );
};
