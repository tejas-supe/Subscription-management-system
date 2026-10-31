import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Loader } from '../components/common/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmIvory">
        <Loader message="Authenticating Brightloop session..." />
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a Customer tries to access an Admin route, redirect to Customer Dashboard
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    // If an Admin/Staff tries to access a Customer route, redirect to Admin Dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
