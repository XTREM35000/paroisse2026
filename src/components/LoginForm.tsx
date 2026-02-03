import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EmailFieldPro } from '@/components/ui/email-field-pro';
import PasswordField from '@/components/ui/password-field';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { Facebook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const { login, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginWithGoogle = async () => {
    console.log('🔴 Google login button clicked');
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) {
        console.error('Google login error:', error.message);
        toast({ title: '❌ Erreur Google', description: String(error.message), variant: 'destructive' });
        return;
      }

      // In many environments Supabase will redirect the page for OAuth; keep a fallback check
      // After OAuth redirect, ensure profile is created and let AuthProvider handle final redirect
      setTimeout(async () => {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.id) {
            await ensureProfileExists(authUser.user.id);
            // No navigation here: AuthProvider will perform the correct redirect once profile exists
          }
        } catch (err) {
          console.error('Erreur lors de la vérification post-Google OAuth:', err);
        }
      }, 1000);

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Erreur Google Login:', err);
      toast({ title: '❌ Erreur de connexion Google', description: String((err as any)?.message || err), variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: unknown = await login(email, password);
      const data = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
      const loggedUser = data?.user as Record<string, unknown> | undefined;

      if (loggedUser?.id) {
        await ensureProfileExists(loggedUser.id as string);
      }

      if (onSuccess) {
        // Notify parent (closing modal / switching UI) and let AuthProvider perform the actual redirect
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        // Do not navigate here — AuthProvider handles final redirect based on the authoritative profile/roles
      }
    } catch (err: unknown) {
      console.error('Login error', err);
      const errorMsg = (err as Record<string, unknown>)?.message || 'Erreur lors de la connexion';
      toast({
        title: '❌ Erreur de connexion',
        description: String(errorMsg),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestion sécurisée de la connexion Facebook via Supabase OAuth
  // CORRECTION MOBILE: Ajouter un log pour déboguer les problèmes de clic sur mobile
  const handleFacebookLogin = async () => {
    console.log('🔵 Facebook login button clicked');
    
    // Sur mobile, vérifier que le SDK est prêt (sécurisé)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { safeGetLoginStatus } = require('@/lib/facebook');
      safeGetLoginStatus();
    } catch (e) {
      /* ignore: helper may not be available in SSR build */
    }
    
    setFacebookLoading(true);
    try {
      // Supabase gère la vérification du token et la création du profil
      await signInWithProvider('facebook');
      
      // Attendre que l'utilisateur soit authentifié après le redirection OAuth
      setTimeout(async () => {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.id) {
            await ensureProfileExists(authUser.user.id);
            // AuthProvider will handle the final redirect once profile exists
          }
        } catch (err) {
          console.error('Erreur lors de la création du profil Facebook:', err);
          toast({
            title: '⚠️ Profil',
            description: 'Profil créé, mais redirection incomplète. Veuillez recharger.',
            variant: 'default',
          });
        }
      }, 1000);
      
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Erreur Facebook Login:', err);
      const errorMsg = (err as Record<string, unknown>)?.message || 'Erreur lors de la connexion Facebook';
      toast({
        title: '❌ Erreur de connexion Facebook',
        description: String(errorMsg),
        variant: 'destructive',
      });
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full max-w-md text-sm">
      <EmailFieldPro
        value={email}
        onChange={setEmail}
        label="Email"
        required
        onValidationChange={() => {}}
      />

      <div>
        <label className="block text-xs font-medium mb-0.5">Mot de passe</label>
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} required className="h-8 text-xs" />
        <button
          type="button"
          onClick={() => {
            onForgotPassword?.();
          }}
          className="text-xs font-medium text-blue-400 hover:text-blue-700 mt-3"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">{loading ? 'Connexion...' : 'Se connecter'}</Button>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground text-center">Ou continuer avec</p>
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={handleFacebookLogin} 
            onTouchStart={(e) => {
              e.preventDefault();
              handleFacebookLogin();
            }}
            className="flex-1 h-10 min-h-[44px] text-xs flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 cursor-pointer touch-none"
            disabled={facebookLoading || loading}
            style={{
              minWidth: '44px',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <Facebook className="w-4 h-4" />
            {facebookLoading ? 'Connexion...' : 'Facebook'}
          </Button>
          <Button 
            type="button" 
            onClick={loginWithGoogle}
            onTouchStart={(e) => {
              e.preventDefault();
              loginWithGoogle();
            }}
            className="flex-1 h-10 min-h-[44px] text-xs flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600"
            disabled={googleLoading || loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.4 9.2 3.1l6.8-6.8C36.7 2.7 30.9 0 24 0 14.7 0 6.8 5.6 3.1 13.6l7.9 6.1C12.9 15.1 18 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.5 20.3c0 1.4-.1 2.8-.4 4.1H24v-8.9h12.7c-.5 2.9-2.6 5.6-5.2 7.1l.1.7 8.9 6.9C44.9 34.1 46.5 27.7 46.5 20.3z"/>
              <path fill="#FBBC05" d="M10.9 28.8c-1.1-1.4-1.8-3.1-1.8-4.8s.6-3.4 1.8-4.8l-7.9-6.1C.9 14.9 0 17.4 0 20.1s.9 5.2 3 7.7l7.9-6.1z"/>
              <path fill="#4285F4" d="M24 48c6.6 0 12.2-2.2 16.3-6l-8.9-6.9C29.1 34.9 26.7 36 24 36c-6 0-11.1-5.6-12-12.1L3.1 30.3C6.8 38.4 14.7 44 24 44z"/>
            </svg>
            {googleLoading ? 'Connexion...' : 'Google'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;