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
  LogOut,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isCustomer, isAdmin, isStaff, logout } = useAuth();
  const location = useLocation();

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Dedicated Customer Portal Sidebar
  if (isCustomer || location.pathname.startsWith('/customer')) {
    return (
      <>
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-obsidian/80 backdrop-blur-xs md:hidden"
            onClick={onCloseMobile}
          />
        )}

        <aside
          className={`flex flex-col bg-obsidian text-white transition-all duration-300 z-50 ${
            collapsed ? 'w-20' : 'w-64'
          } min-h-screen border-r border-obsidian-light shrink-0 ${
            mobileOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex'
          }`}
        >
          {/* Header */}
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

            <div className="flex items-center gap-1">
              {/* Mobile Close Button */}
              <button
                onClick={onCloseMobile}
                className="text-slategrey hover:text-white p-1 rounded md:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-slategrey hover:text-white p-1 rounded hidden md:block"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-6 space-y-1.5 dark-scroll overflow-y-auto">
            <SidebarLink to="/customer/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onClick={handleLinkClick} />
            <SidebarLink to="/customer/subscription" icon={Repeat} label="My Subscription" collapsed={collapsed} onClick={handleLinkClick} />
            <SidebarLink to="/customer/invoices" icon={Receipt} label="My Invoices" collapsed={collapsed} onClick={handleLinkClick} />
            <SidebarLink to="/customer/payments" icon={Banknote} label="My Payments" collapsed={collapsed} onClick={handleLinkClick} />
            <SidebarLink to="/customer/profile" icon={UserIcon} label="My Profile" collapsed={collapsed} onClick={handleLinkClick} />
          </div>

          {/* Footer Controls: Distinguish genuine customers vs internal staff previewing */}
          <div className="p-4 border-t border-obsidian-surface space-y-2">
            {!isCustomer && (isAdmin || isStaff) ? (
              // Only internal staff/admin see a return link when previewing the portal
              <NavLink
                to="/admin/dashboard"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-forest text-chartreuse hover:bg-forest-light transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {!collapsed && <span>Return to Console</span>}
              </NavLink>
            ) : (
              // Legitimate customers get a secure sign-out control
              <button
                onClick={() => {
                  logout();
                  handleLinkClick();
                }}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-obsidian-surface text-sage hover:text-white hover:bg-rose-950/60 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            )}
          </div>
        </aside>
      </>
    );
  }

  // Administrative & Staff Workspace Sidebar
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-obsidian/80 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`flex flex-col bg-obsidian text-white transition-all duration-300 z-50 ${
          collapsed ? 'w-20' : 'w-64'
        } min-h-screen border-r border-obsidian-light shrink-0 ${
          mobileOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex'
        }`}
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
                <span className="block text-[9px] font-semibold tracking-wider uppercase text-sage">
                  {isAdmin ? 'Revenue Command' : 'Staff Workspace'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-chartreuse text-obsidian font-bold text-sm">
              BL
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="text-slategrey hover:text-white p-1 rounded md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slategrey hover:text-white p-1 rounded hidden md:block"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
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
              <SidebarLink to="/admin/dashboard" icon={LayoutDashboard} label="Command Center" collapsed={collapsed} onClick={handleLinkClick} />
            </div>
          </div>

          {/* COMMERCE: Customers & Quotations (Staff + Admin), Products & Plans (Admin only) */}
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
                Commerce
              </p>
            )}
            <div className="space-y-1">
              <SidebarLink to="/admin/customers" icon={Users} label="Customers" collapsed={collapsed} onClick={handleLinkClick} />
              {isAdmin && (
                <>
                  <SidebarLink to="/admin/products" icon={Package} label="Products" collapsed={collapsed} onClick={handleLinkClick} />
                  <SidebarLink to="/admin/plans" icon={CreditCard} label="Pricing & Plans" collapsed={collapsed} onClick={handleLinkClick} />
                </>
              )}
              <SidebarLink to="/admin/quotations" icon={FileText} label="Quotations" collapsed={collapsed} onClick={handleLinkClick} />
            </div>
          </div>

          {/* REVENUE: Subscriptions, Invoices, Payments (Staff + Admin), Discounts (Admin only) */}
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
                Revenue
              </p>
            )}
            <div className="space-y-1">
              <SidebarLink to="/admin/subscriptions" icon={Repeat} label="Subscriptions" collapsed={collapsed} onClick={handleLinkClick} />
              <SidebarLink to="/admin/invoices" icon={Receipt} label="Invoices" collapsed={collapsed} onClick={handleLinkClick} />
              <SidebarLink to="/admin/payments" icon={Banknote} label="Payments" collapsed={collapsed} onClick={handleLinkClick} />
              {isAdmin && (
                <SidebarLink to="/admin/discounts" icon={Tag} label="Discounts" collapsed={collapsed} onClick={handleLinkClick} />
              )}
            </div>
          </div>

          {/* INTELLIGENCE: Admin Only */}
          {isAdmin && (
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
                <SidebarLink to="/admin/analytics" icon={BarChart3} label="Revenue Analytics" collapsed={collapsed} onClick={handleLinkClick} />
                <SidebarLink to="/admin/revenue-sentinel" icon={ShieldAlert} label="Revenue Sentinel" collapsed={collapsed} badge="AI Alerts" onClick={handleLinkClick} />
              </div>
            </div>
          )}

          {/* SYSTEM: Team & Audit Logs (Admin only), Settings (Staff + Admin) */}
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slategrey uppercase">
                System
              </p>
            )}
            <div className="space-y-1">
              {isAdmin && (
                <>
                  <SidebarLink to="/admin/team" icon={ShieldCheck} label="Team & Roles" collapsed={collapsed} onClick={handleLinkClick} />
                  <SidebarLink to="/admin/audit-logs" icon={History} label="Audit Logs" collapsed={collapsed} onClick={handleLinkClick} />
                </>
              )}
              <SidebarLink to="/admin/settings" icon={Settings} label="Settings" collapsed={collapsed} onClick={handleLinkClick} />
            </div>
          </div>

          {/* Customer Portal Preview Link for Admin */}
          {isAdmin && (
            <div className="pt-2">
              <NavLink
                to="/customer/dashboard"
                onClick={handleLinkClick}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-forest text-chartreuse hover:bg-forest-light transition-colors"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Customer Portal Preview</span>}
              </NavLink>
            </div>
          )}
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
    </>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  badge?: string;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, collapsed, badge, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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
