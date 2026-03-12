import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/hooks/useAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // e.g. 'admin' | 'moderator' | 'member'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, role, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to={'/?mode=login#auth'} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
