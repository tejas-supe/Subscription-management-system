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
  Activity,
  CalendarClock,
  AlertTriangle,
  Scale,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isCustomer } = useAuth();
  const location = useLocation();

  // If viewing customer self-service portal, show a simplified portal navigation
  if (isCustomer || location.pathname.startsWith('/portal')) {
    return (
      <aside
        className={`flex flex-col bg-obsidian text-white transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        } min-h-screen border-r border-obsidian-light`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-obsidian-surface">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm tracking-tighter">
                BL
              </div>
              <div>
                <span className="font-bold tracking-wider text-sm text-white">BRIGHTLOOP</span>
                <span className="block text-[10px] font-medium tracking-widest uppercase text-chartreuse">Customer Portal</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
              BL
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slategrey hover:text-white p-1 rounded transition-colors hidden md:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-6 space-y-1.5 dark-scroll overflow-y-auto">
          <NavLink
            to="/portal"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-chartreuse text-obsidian font-semibold'
                  : 'text-sage hover:bg-obsidian-surface hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsed && <span>My Dashboard</span>}
          </NavLink>

          <NavLink
            to="/portal/invoices"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-chartreuse text-obsidian font-semibold'
                  : 'text-sage hover:bg-obsidian-surface hover:text-white'
              }`
            }
          >
            <Receipt className="h-5 w-5 shrink-0" />
            {!collapsed && <span>My Invoices</span>}
          </NavLink>

          <NavLink
            to="/portal/plans"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-chartreuse text-obsidian font-semibold'
                  : 'text-sage hover:bg-obsidian-surface hover:text-white'
              }`
            }
          >
            <CreditCard className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Upgrade / Downgrade</span>}
          </NavLink>
        </div>

        {/* Back to Admin Console switch */}
        <div className="p-4 border-t border-obsidian-surface">
          <NavLink
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-forest text-chartreuse hover:bg-forest-light transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {!collapsed && <span>Admin Workspace</span>}
          </NavLink>
        </div>
      </aside>
    );
  }

  // Standard Admin & Staff Navigation
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm tracking-tighter">
              BL
            </div>
            <div>
              <span className="font-bold tracking-widest text-sm text-white">BRIGHTLOOP</span>
              <span className="block text-[9px] font-semibold tracking-wider uppercase text-sage">Revenue Cloud</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
            BL
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slategrey hover:text-white p-1 rounded transition-colors hidden md:block"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-6 dark-scroll overflow-y-auto">
        {/* OVERVIEW */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
              Overview
            </p>
          )}
          <div className="space-y-1">
            <NavItem
              to="/"
              icon={LayoutDashboard}
              label="Command Center"
              collapsed={collapsed}
              end
            />
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
            <NavItem to="/customers" icon={Users} label="Customers" collapsed={collapsed} />
            <NavItem to="/products" icon={Package} label="Products" collapsed={collapsed} />
            <NavItem to="/plans" icon={CreditCard} label="Pricing & Plans" collapsed={collapsed} />
            <NavItem to="/quotations" icon={FileText} label="Quotations" collapsed={collapsed} />
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
            <NavItem to="/subscriptions" icon={Repeat} label="Subscriptions" collapsed={collapsed} />
            <NavItem to="/invoices" icon={Receipt} label="Invoices" collapsed={collapsed} />
            <NavItem to="/payments" icon={Banknote} label="Payments" collapsed={collapsed} />
            <NavItem to="/discounts" icon={Tag} label="Discounts" collapsed={collapsed} />
          </div>
        </div>

        {/* INTELLIGENCE & DIFFERENTIATORS */}
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
            <NavItem to="/analytics" icon={BarChart3} label="Revenue Analytics" collapsed={collapsed} />
            <NavItem to="/health-monitor" icon={Activity} label="Health Monitor" collapsed={collapsed} badge="Live" />
            <NavItem to="/smart-renewals" icon={CalendarClock} label="Smart Renewals" collapsed={collapsed} />
            <NavItem to="/leakage-alerts" icon={AlertTriangle} label="Leakage Alerts" collapsed={collapsed} />
            <NavItem to="/reconciliation" icon={Scale} label="Reconciliation" collapsed={collapsed} />
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
            <NavItem to="/team" icon={ShieldCheck} label="Team & Roles" collapsed={collapsed} />
            <NavItem to="/audit-logs" icon={History} label="Audit Logs" collapsed={collapsed} />
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
          </div>
        </div>

        {/* Customer Portal Link */}
        <div className="pt-2">
          <NavLink
            to="/portal"
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-chartreuse font-medium uppercase tracking-wider">{user?.role || 'ADMIN'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  badge?: string;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, collapsed, badge, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
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
