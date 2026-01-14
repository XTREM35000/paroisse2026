# Exemples d'utilisation - Authentification

## 1. Utiliser la page Auth complète

### Dans votre router (App.tsx)
```typescript
import Auth from '@/pages/Auth';

// Route dans App.tsx
<Route path="/auth" element={<Layout><Auth initialMode="login" /></Layout>} />
```

### Utilisation simple
```typescript
<Auth />
// Par défaut initialMode="login"
```

### Avec mode initial personnalisé
```typescript
<Auth initialMode="register" />
<Auth initialMode="forgot-password" />
```

---

## 2. Utiliser AuthContainer (composant réutilisable)

### Exemple basique
```typescript
import AuthContainer from '@/components/AuthContainer';

export function MyAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthContainer initialMode="login" />
    </div>
  );
}
```

### Avec callback de succès
```typescript
import { useNavigate } from 'react-router-dom';
import AuthContainer from '@/components/AuthContainer';

export function MyAuthPage() {
  const navigate = useNavigate();

  return (
    <AuthContainer 
      initialMode="login"
      onAuthSuccess={() => {
        console.log('Authentification réussie!');
        navigate('/dashboard');
      }}
    />
  );
}
```

---

## 3. Utiliser directement les hooks

### Hook useAuth complet
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, login, register, signInWithProvider, signOut, resetPassword } = useAuth();

  // Connexion email/password
  const handleLogin = async () => {
    try {
      const result = await login('user@example.com', 'password123');
      console.log('Connecté:', result);
    } catch (error) {
      console.error('Erreur connexion:', error);
    }
  };

  // Inscription
  const handleRegister = async () => {
    try {
      const result = await register('user@example.com', 'password123', {
        full_name: 'Jean Dupont',
        phone: '+33612345678',
      });
      console.log('Inscrit:', result);
    } catch (error) {
      console.error('Erreur inscription:', error);
    }
  };

  // Connexion OAuth
  const handleFacebookLogin = async () => {
    try {
      await signInWithProvider('facebook');
      // Redirection gérée par Supabase automatiquement
    } catch (error) {
      console.error('Erreur Facebook:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithProvider('google');
    } catch (error) {
      console.error('Erreur Google:', error);
    }
  };

  // Réinitialisation de mot de passe
  const handleResetPassword = async () => {
    try {
      await resetPassword('user@example.com');
      console.log('Email de réinitialisation envoyé');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // État de connexion
  if (loading) {
    return <div>Chargement...</div>;
  }

  if (user) {
    return (
      <div>
        <p>Connecté en tant que: {user.email}</p>
        <button onClick={signOut}>Se déconnecter</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleLogin}>Se connecter</button>
      <button onClick={handleRegister}>S'inscrire</button>
      <button onClick={handleFacebookLogin}>Facebook</button>
      <button onClick={handleGoogleLogin}>Google</button>
      <button onClick={handleResetPassword}>Mot de passe oublié</button>
    </div>
  );
}
```

---

## 4. Hook useEnsureOAuthProfile (automatique)

### Utilisé automatiquement dans Layout
```typescript
// Dans Layout.tsx (déjà implémenté)
import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile';

const Layout = ({ children }) => {
  useEnsureOAuthProfile(); // Appelé automatiquement
  // ...
};
```

### Utilisation manuelle si nécessaire
```typescript
import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile';

function MyComponent() {
  useEnsureOAuthProfile(); // Créera le profil automatiquement
  // ...
}
```

---

## 5. Composant UserProfileDisplay

### Afficher le profil de l'utilisateur connecté
```typescript
import UserProfileDisplay from '@/components/UserProfileDisplay';

function ProfilePage() {
  return (
    <div className="p-8">
      <h1>Mon Profil</h1>
      <UserProfileDisplay 
        onLogoutSuccess={() => {
          console.log('Utilisateur déconnecté');
        }}
      />
    </div>
  );
}
```

---

## 6. Formulaires individuels

### Utiliser LoginForm seul
```typescript
import LoginForm from '@/components/LoginForm';

function MyLoginPage() {
  return (
    <div>
      <h1>Connexion</h1>
      <LoginForm 
        onSuccess={() => console.log('Connecté')}
        onForgotPassword={() => console.log('Ouvrir formulaire password')}
      />
    </div>
  );
}
```

### Utiliser RegisterForm seul
```typescript
import RegisterForm from '@/components/RegisterForm';

function MyRegisterPage() {
  return (
    <div>
      <h1>Inscription</h1>
      <RegisterForm 
        onSuccess={() => console.log('Inscrit')}
        onSwitchToLogin={() => console.log('Aller à connexion')}
      />
    </div>
  );
}
```

### Utiliser ForgotPasswordForm seul
```typescript
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

function MyPasswordResetPage() {
  return (
    <div>
      <h1>Réinitialiser le mot de passe</h1>
      <ForgotPasswordForm 
        onSuccess={() => console.log('Email envoyé')}
        onSwitchToLogin={() => console.log('Retour connexion')}
      />
    </div>
  );
}
```

---

## 7. Patterns courants

### Redirection après connexion selon le rôle
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function AuthWithRoleRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const checkRole = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      };

      checkRole();
    }
  }, [user, navigate]);

  return <div>Redirection en cours...</div>;
}
```

### Protéger une route
```typescript
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

function ProtectedComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/auth?mode=login" />;

  return <div>Contenu protégé</div>;
}
```

### Afficher différents contenus selon l'état
```typescript
import { useAuth } from '@/hooks/useAuth';

function ConditionalComponent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? (
    <UserDashboard user={user} />
  ) : (
    <AuthContainer initialMode="login" />
  );
}
```

---

## 8. Gestion des erreurs

### Avec try-catch
```typescript
async function handleLogin(email: string, password: string) {
  try {
    const { login } = useAuth();
    await login(email, password);
    console.log('Succès');
  } catch (error: unknown) {
    const message = (error as any)?.message || 'Erreur inconnue';
    console.error('Erreur:', message);
    showErrorToast(message);
  }
}
```

### Avec gestion d'erreur Supabase
```typescript
async function handleRegister(data: RegistrationData) {
  try {
    const { register } = useAuth();
    const response = await register(data.email, data.password, {
      full_name: data.fullName,
    });

    if (response.error) {
      if (response.error.message.includes('already registered')) {
        showError('Cet email est déjà utilisé');
      } else {
        showError(response.error.message);
      }
      return;
    }

    showSuccess('Inscription réussie');
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

---

## 9. Intégration avec des modaux

### Auth dans une modal
```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AuthContainer from '@/components/AuthContainer';

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <AuthContainer 
          initialMode="login"
          onAuthSuccess={() => {
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. Intégration avec des formulaires

### Ajouter l'authentification à un grand formulaire
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthContainer from '@/components/AuthContainer';
import MyFormComponent from './MyFormComponent';

function CombinedForm() {
  const { user } = useAuth();

  return (
    <Tabs defaultValue={user ? 'form' : 'auth'}>
      <TabsList>
        <TabsTrigger value="auth">Authentification</TabsTrigger>
        <TabsTrigger value="form" disabled={!user}>Formulaire</TabsTrigger>
      </TabsList>

      <TabsContent value="auth">
        <AuthContainer initialMode="login" />
      </TabsContent>

      <TabsContent value="form">
        {user ? <MyFormComponent /> : <div>Veuillez vous connecter</div>}
      </TabsContent>
    </Tabs>
  );
}
```

---

## Troubleshooting courant

### "Cannot read property 'signInWithProvider' of undefined"
**Cause** : Hook utilisé en dehors d'AuthProvider
**Solution** : S'assurer que le composant est enveloppé par `<AuthProvider>`

### "OAuth redirect loop"
**Cause** : Redirect URL incorrecte ou non configurée
**Solution** : Vérifier les URLs dans Supabase et Facebook

### "Profile not created after OAuth"
**Cause** : Hook `useEnsureOAuthProfile` non utilisé
**Solution** : Vérifier que Layout.tsx l'utilise

### "Toast component not found"
**Cause** : ToastProvider non configuré
**Solution** : S'assurer que `<ToastProvider>` enveloppe l'application

---

**Version** : 1.0
**Dernière mise à jour** : 14 janvier 2026
