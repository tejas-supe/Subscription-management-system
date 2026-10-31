import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Admin Pages
import { Dashboard } from '../pages/admin/Dashboard';
import { Customers } from '../pages/admin/Customers';
import { Products } from '../pages/admin/Products';
import { Plans } from '../pages/admin/Plans';
import { Quotations } from '../pages/admin/Quotations';
import { Subscriptions } from '../pages/admin/Subscriptions';
import { Invoices } from '../pages/admin/Invoices';
import { Payments } from '../pages/admin/Payments';
import { Discounts } from '../pages/admin/Discounts';
import { Analytics } from '../pages/admin/Analytics';
import { RevenueSentinel } from '../pages/admin/RevenueSentinel';
import { Team } from '../pages/admin/Team';
import { AuditLogs } from '../pages/admin/AuditLogs';
import { Settings } from '../pages/admin/Settings';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { MySubscription } from '../pages/customer/MySubscription';
import { MyInvoices } from '../pages/customer/MyInvoices';
import { MyPayments } from '../pages/customer/MyPayments';
import { MyProfile } from '../pages/customer/MyProfile';

// Root redirect handler based on persona
const RootRedirect: React.FC = () => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Root Path */}
      <Route path="/" element={<RootRedirect />} />

      {/* Administrative Workspace (ADMIN & STAFF) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<ProtectedRoute allowedRoles={['ADMIN']}><Products /></ProtectedRoute>} />
        <Route path="plans" element={<ProtectedRoute allowedRoles={['ADMIN']}><Plans /></ProtectedRoute>} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />
        <Route path="discounts" element={<ProtectedRoute allowedRoles={['ADMIN']}><Discounts /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><Analytics /></ProtectedRoute>} />
        <Route path="revenue-sentinel" element={<ProtectedRoute allowedRoles={['ADMIN']}><RevenueSentinel /></ProtectedRoute>} />
        <Route path="team" element={<ProtectedRoute allowedRoles={['ADMIN']}><Team /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogs /></ProtectedRoute>} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Customer Self-Service Portal (CUSTOMER, with ADMIN & STAFF override preview) */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'STAFF']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="subscription" element={<MySubscription />} />
        <Route path="invoices" element={<MyInvoices />} />
        <Route path="payments" element={<MyPayments />} />
        <Route path="profile" element={<MyProfile />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
