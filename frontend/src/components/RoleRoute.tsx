import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;

  if (!userRole) {
    // Invalid session data (e.g. old localstorage without role), force relogin
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return <Navigate to="/" replace />;
    } else if (userRole === 'OPERATOR') {
      return <Navigate to="/operator/dashboard" replace />;
    } else if (userRole === 'QC_INSPECTOR' || userRole === 'QC_CHECKER') {
      return <Navigate to="/qc/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};
