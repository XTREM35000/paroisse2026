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
  const { isLoading, canAccess } = useRoleCheck();
  const location = useLocation();

  // Afficher un message de vérification pendant le chargement
  if (loading || isLoading) {
    return <div className="p-6">Vérification...</div>;
  }

  // Rediriger vers la connexion si pas d'utilisateur
  if (!user) {
    return <Navigate to={'/?mode=login#auth'} state={{ from: location.pathname }} replace />;
  }

  // Vérifier les permissions
  if (requiredRole && !canAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
