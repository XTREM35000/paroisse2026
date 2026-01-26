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
        setTimeout(() => {
          onSuccess();
          setTimeout(async () => {
            try {
              const uid = loggedUser?.id as string | undefined || (await supabase.auth.getUser()).data?.user?.id;
              let role: string | null = null;
              if (uid) {
                const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
                role = (profileData as Record<string, unknown>)?.role as string | null ?? null;
              }
              const metaRole = (loggedUser?.user_metadata as Record<string, unknown>)?.role as string || '';
              const adminFlag = (role || metaRole || '').toLowerCase().includes('admin');
              if (adminFlag) navigate('/admin');
              else navigate('/');
            } catch (err) {
              navigate('/');
            }
          }, 300);
        }, 500);
      } else {
        navigate('/');
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
  const handleFacebookLogin = async () => {
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
            
            // Vérifier le rôle et naviguer
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authUser.user.id)
              .maybeSingle();
            
            const role = (profileData as Record<string, unknown>)?.role as string | null ?? null;
            if (role?.toLowerCase().includes('admin')) navigate('/admin');
            else navigate('/');
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
            className="flex-1 h-8 text-xs flex items-center justify-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            disabled={facebookLoading || loading}
          >
            <Facebook className="w-4 h-4" />
            {facebookLoading ? 'Connexion...' : 'Facebook'}
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              toast({
                title: 'ℹ️ Information',
                description: 'Provider sera implémenter sous peu...',
                variant: 'default',
              });
            }}
            className="flex-1 h-8 text-xs flex items-center justify-center gap-1 bg-red-500 text-white hover:bg-red-600"
            disabled={loading}
          >
            Google
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;