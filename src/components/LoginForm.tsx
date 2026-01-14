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

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const { login, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: unknown = await login(email, password);
      const loggedUser = (res as Record<string, unknown>)?.data?.user as Record<string, unknown> | undefined;

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
      try {
        const errorMsg = (err as Record<string, unknown>).message || 'Erreur lors de la connexion';
        alert(errorMsg);
      } catch {}
    } finally {
      setLoading(false);
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
          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
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
            variant="outline" 
            type="button" 
            onClick={() => signInWithProvider('facebook')} 
            className="flex-1 h-8 text-xs flex items-center justify-center gap-1"
            disabled={loading}
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => signInWithProvider('google')} 
            className="flex-1 h-8 text-xs"
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