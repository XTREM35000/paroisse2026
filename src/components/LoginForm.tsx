import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import PasswordField from '@/components/ui/password-field';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { Facebook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PhoneOTPForm from './PhoneOTPForm'; // Importez votre composant OTP

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showRetryBanner, setShowRetryBanner] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false); // État pour contrôler la modale OTP
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const closeOTPModal = () => {
    setShowOTPModal(false);
  };

  /** Résout un email pour la connexion (identifiant = email ou pseudo). */
  const resolveLoginEmail = async (raw: string): Promise<{ email: string | null; error: 'not_found' | 'rpc' | null }> => {
    const t = raw.trim();
    if (!t) return { email: null, error: null };
    if (t.includes('@')) {
      return { email: t, error: null };
    }

    const { data, error } = await supabase.rpc('resolve_email_for_login', { p_identifier: t });
    if (error) {
      console.warn('[LoginForm] resolve_email_for_login', error);

      // Fallback when RPC function is absent in Supabase schema (PGRST202 -> missing function)
      if (error.code === 'PGRST202' || /Could not find the function/i.test(error.message || '')) {
        const { data: profileData, error: profilesError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', t)
          .maybeSingle();

        if (profilesError) {
          // Pas de ligne trouvée ou résultat vide: pseudo inconnu, pas une erreur bloquante.
          if (profilesError.code === 'PGRST116') {
            return { email: null, error: 'not_found' };
          }
          console.warn('[LoginForm] fallback resolve_email_for_login failed', profilesError);
          return { email: null, error: 'rpc' };
        }

        if (!profileData?.email) {
          return { email: null, error: 'not_found' };
        }

        return { email: String(profileData.email), error: null };
      }

      return { email: null, error: 'rpc' };
    }

    if (data == null || data === '') {
      return { email: null, error: 'not_found' };
    }
    return { email: String(data), error: null };
  };

  const handleOTPSuccess = () => {
    closeOTPModal();
    if (onSuccess) onSuccess();
  };

  const loginWithGoogle = async () => {
    console.log('🔴 Google login button clicked');
    setGoogleLoading(true);
    try {
      // FIX: Nettoyage forcé de la session pour éviter les jetons corrompus
      console.log('🧹 Nettoyage de session Supabase...');
      await supabase.auth.signOut();
      
      // Nettoyer les paramètres d'URL résiduels
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Construire l'URL du callback de manière robuste
      const redirectTo = new URL('/auth/callback', window.location.origin).toString();
      console.log('[Google OAuth] redirectTo:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      });
      if (error) {
        console.error('Google login error:', error.message);
        toast({ title: '❌ Erreur Google', description: String(error.message), variant: 'destructive' });
        return;
      }

      // Dans de nombreux environnements, Supabase redirige la page pour OAuth
      setTimeout(async () => {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.id) {
            await ensureProfileExists(authUser.user.id);
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
    
    if (!identifier.trim()) {
      toast({
        title: 'Identifiant requis',
        description: 'Entrez votre email ou votre pseudo',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: '❌ Mot de passe requis',
        description: 'Veuillez entrer votre mot de passe',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setEmailNotConfirmed(false);
    try {
      const resolved = await resolveLoginEmail(identifier);
      if (resolved.error === 'rpc') {
        toast({
          title: 'Connexion impossible',
          description: 'Réessayez dans un instant.',
          variant: 'destructive',
        });
        return;
      }
      if (resolved.error === 'not_found' || !resolved.email) {
        toast({
          title: 'Pseudo introuvable',
          description: 'Aucun compte avec ce pseudo',
          variant: 'destructive',
        });
        return;
      }

      const emailToUse = resolved.email;
      console.log(
        '[LoginForm] Attempting login with email:',
        emailToUse,
        'origin:',
        typeof window !== 'undefined' ? window.location.origin : 'no-window',
      );

      await login(emailToUse, password);

      // login() ne renvoie pas l’utilisateur : récupération explicite pour ensureProfileExists + avatar pending
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.warn('[LoginForm] getUser après login:', userErr);
      }
      const uid = userData?.user?.id;
      if (uid) {
        await ensureProfileExists(uid);
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err: unknown) {
      console.error('Login error', err);
      const e = err as { message?: string; code?: string };
      const errorMsg = String(e?.message || 'Erreur lors de la connexion');
      const code = e?.code;
      const isUnconfirmed =
        code === 'email_not_confirmed' ||
        errorMsg.toLowerCase().includes('email not confirmed') ||
        errorMsg.toLowerCase().includes('not confirmed');

      if (isUnconfirmed) {
        setEmailNotConfirmed(true);
        toast({
          title: 'Email non confirmé',
          description:
            'Ouvrez le lien reçu par email pour activer votre compte, puis reconnectez-vous. Vous pouvez renvoyer l’email de confirmation ci-dessous.',
          variant: 'destructive',
        });
        return;
      }

      const wrongCreds =
        code === 'invalid_credentials' ||
        errorMsg.toLowerCase().includes('invalid login') ||
        errorMsg.toLowerCase().includes('invalid_credentials');

      toast({
        title: '❌ Erreur de connexion',
        description: wrongCreds
          ? 'Email ou mot de passe incorrect'
          : errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const resolved = await resolveLoginEmail(identifier);
    const em = resolved.email?.trim() ?? '';
    if (!em) {
      toast({
        title: 'Email requis',
        description: resolved.error === 'not_found' ? 'Aucun compte avec ce pseudo' : 'Saisissez votre email ou un pseudo valide.',
        variant: 'destructive',
      });
      return;
    }
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: em });
      if (error) throw error;
      toast({
        title: 'Email de confirmation renvoyé',
        description: 'Vérifiez votre boîte de réception (et les courriers indésirables).',
      });
    } catch (resendErr: unknown) {
      const msg = resendErr instanceof Error ? resendErr.message : String(resendErr);
      toast({ title: 'Impossible de renvoyer l’email', description: msg, variant: 'destructive' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    console.log('🔵 Facebook login button clicked');
    console.log('🔵 URL actuelle:', window.location.origin);
    console.log('🔵 Callback URL sera:', new URL('/auth/callback', window.location.origin).toString());
    
    setFacebookLoading(true);
    try {
      // FIX: Nettoyage forcé de la session pour éviter les jetons corrompus
      console.log('🧹 Nettoyage de session Supabase...');
      await supabase.auth.signOut();
      
      // Attendre 300ms pour que Supabase finisse son nettoyage interne
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🧹 Nettoyage des URL...');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      console.log('✅ Session nettoyée, lancement OAuth Facebook...');
      
      // Utiliser directement supabase.auth.signInWithOAuth pour éviter les erreurs de fonction
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          scopes: 'email,public_profile'
        }
      });

      if (error) {
        console.error('Supabase OAuth initiation error (Facebook):', error);
        toast({ title: '❌ Erreur Facebook', description: String(error.message), variant: 'destructive' });
        return;
      }

      console.log('✅ Redirection vers Facebook initiée');

      // La redirection est automatique, pas besoin d'appeler onSuccess ici
      // Le callback gérera la suite
      
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

  // Retry manuel si le callback a redirigé vers /login?retry=1
  const handleManualRetry = async () => {
    try {
      sessionStorage.setItem('ff_oauth_retry_done', '1');
    } catch (e) { /* ignore */ }
    setShowRetryBanner(false);
    await handleFacebookLogin();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const retry = params.get('retry') === '1';
      const already = sessionStorage.getItem('ff_oauth_retry_done') === '1';
      if (retry && !already) {
        setShowRetryBanner(true);
      }
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <>
      {showRetryBanner && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>Une vérification Facebook a interrompu le flux OAuth. Cliquez sur « Réessayer Facebook » pour relancer manuellement.</div>
            <div>
              <Button type="button" onClick={handleManualRetry} disabled={facebookLoading} className="h-8 text-xs">Réessayer Facebook</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale OTP */}
      {showOTPModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483648 }}>
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          <div className="bg-white rounded-xl max-w-md md:max-w-lg w-full p-6 relative max-h-[calc(100vh-48px)] overflow-auto" style={{ zIndex: 2147483649 }}>
            <button 
              onClick={closeOTPModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <PhoneOTPForm onSuccess={handleOTPSuccess} onCancel={closeOTPModal} />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-2 w-full max-w-md text-sm">
        <div>
          <label className="block text-xs font-medium mb-0.5">Email ou pseudo</label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => {
              const value = e.target.value;
              // Normaliser : si ce n'est pas un email (pas de @), minuscules
              if (!value.includes('@')) {
                setIdentifier(value.toLowerCase().replace(/[^a-z0-9._@]/g, ''));
              } else {
                setIdentifier(value);
              }
            }}
            placeholder="ex. moi@mail.com ou developpeur2026"
            autoComplete="username"
            required
            className="h-8 text-xs"
          />
        </div>

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

        {emailNotConfirmed && (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-950 dark:text-amber-100 space-y-2">
            <p className="font-medium">Compte inactif tant que l’email n’est pas confirmé (réglage Supabase).</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full h-8 text-xs"
              disabled={resendLoading}
              onClick={() => void handleResendConfirmation()}
            >
              {resendLoading ? 'Envoi…' : 'Renvoyer l’email de confirmation'}
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">{loading ? 'Connexion...' : 'Se connecter'}</Button>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">Ou continuer avec</p>
          <div className="flex gap-2">
            {/* Bouton OTP - Placé en premier (à gauche) */}
            <Button 
              type="button" 
              onClick={() => setShowOTPModal(true)}
              className="flex-1 h-10 min-h-[44px] text-xs flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              SMS
            </Button>
            
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
    </>
  );
};

export default LoginForm;