import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EmailFieldPro } from '@/components/ui/email-field-pro';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: '⚠️ Champ requis',
        description: 'Veuillez entrer votre adresse email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
      toast({
        title: '✅ Email envoyé',
        description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
        variant: 'default',
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err: unknown) {
      console.error('Reset password error', err);
      const errorMsg = (err as Record<string, unknown>)?.message || 'Erreur lors de la demande de réinitialisation';
      toast({
        title: '❌ Erreur',
        description: String(errorMsg),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 w-full max-w-md text-sm text-center">
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-800 font-medium">Email de réinitialisation envoyé</p>
          <p className="text-green-700 text-xs mt-2">
            Vérifiez votre boîte mail (et le dossier spam) pour le lien de réinitialisation.
          </p>
        </div>
        <Button variant="outline" onClick={onSwitchToLogin} className="h-8 text-xs">
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 w-full max-w-md text-sm">
      <p className="text-xs text-muted-foreground">
        Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
      </p>

      <EmailFieldPro
        value={email}
        onChange={setEmail}
        label="Email"
        required
        onValidationChange={() => {}}
      />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </Button>
        <Button variant="outline" type="button" onClick={onSwitchToLogin} className="h-8 text-xs">
          Annuler
        </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
