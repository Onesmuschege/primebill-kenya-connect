import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'subadmin' | 'client';
  requiresActiveAccount?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiresActiveAccount = true
}) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check account status for non-admin users
  if (requiresActiveAccount && user.role === 'client') {
    // TODO: Add subscription status check when billing integration is complete
    // For now, allow all authenticated clients
  }

  return <>{children}</>;
};