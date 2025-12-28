import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

type Props = {
  children: React.ReactNode;
  admin?: boolean;
};

const ProtectedRoute: React.FC<Props> = ({ children, admin = false }) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isAdmin } = useUser();

  if (loading || profileLoading) return <div className="p-6">Vérification...</div>;

  if (!user) return <Navigate to="/auth" replace />;

  if (admin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
