import React from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import UserProfileDisplay from '@/components/UserProfileDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderCircle } from 'lucide-react';

interface AuthContainerProps {
  initialMode?: 'login' | 'register' | 'forgot-password';
  onAuthSuccess?: () => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ initialMode = 'login', onAuthSuccess }) => {
  const { user, loading } = useAuthContext();
  const [activeTab, setActiveTab] = React.useState<'login' | 'register' | 'forgot-password'>(initialMode);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher son profil
  if (user) {
    return <UserProfileDisplay onLogoutSuccess={onAuthSuccess} />;
  }

  // Sinon, afficher les formulaires d'authentification
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login" className="text-xs">Connexion</TabsTrigger>
          <TabsTrigger value="register" className="text-xs">Inscription</TabsTrigger>
          <TabsTrigger value="forgot-password" className="text-xs">Mot de passe</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-4">
          <LoginForm 
            onSuccess={onAuthSuccess} 
            onForgotPassword={() => setActiveTab('forgot-password')}
          />
        </TabsContent>

        <TabsContent value="register" className="mt-4">
          <RegisterForm 
            onSuccess={onAuthSuccess} 
            onSwitchToLogin={() => setActiveTab('login')}
          />
        </TabsContent>

        <TabsContent value="forgot-password" className="mt-4">
          <ForgotPasswordForm 
            onSuccess={() => setActiveTab('login')} 
            onSwitchToLogin={() => setActiveTab('login')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthContainer;
