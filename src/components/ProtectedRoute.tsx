import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/useAuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { isAdmin as rpIsAdmin, isSuperAdminLevel } from '@/utils/rolePermissions';

type ProtectedRole = 'admin' | 'super_admin' | 'both';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: ProtectedRole;
  pageKey?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, pageKey }) => {
  const { user, role, loading } = useAuthContext();
  const location = useLocation();
  const { canAccess } = useRoleAccess();

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to={'/?mode=login#auth'} state={{ from: location.pathname }} replace />;
  }

  const resolvedPageKey = pageKey ?? location.pathname;
  if (!canAccess(resolvedPageKey)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole) {
    const isAdminFamily = rpIsAdmin(role ?? undefined);
    const isSuper = isSuperAdminLevel(role ?? undefined);

    const hasAccess =
      (requiredRole === 'admin' && isAdminFamily) ||
      (requiredRole === 'super_admin' && isSuper) ||
      (requiredRole === 'both' && isAdminFamily);

    if (!hasAccess) {
      const r = String(role ?? '').toLowerCase();
      if (r === 'guest') {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
