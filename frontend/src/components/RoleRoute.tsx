import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (allowedRoles && allowedRoles.length === 0) {
    console.debug('No specific roles required');
  }

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

  // Allow multi-portal access so users can work across all 3 portals at the same time
  return <>{children}</>;
};
