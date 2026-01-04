import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useRoleCheck from '@/hooks/useRoleCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // e.g. 'admin' | 'moderator' | 'member'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, canAccess } = useRoleCheck();
  const location = useLocation();

  if (loading || profileLoading) return <div className="p-6">Vérification...</div>;

  if (!user) {
    return <Navigate to={'/?mode=login#auth'} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && !canAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
