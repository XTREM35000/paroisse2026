import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, CheckCircle, AlertCircle } from 'lucide-react';
import DraggableModal from './DraggableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailFieldPro } from '@/components/ui/email-field-pro';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Réinitialiser le formulaire quand le modal se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setSubmitted(false);
      setError('');
    }
  }, [isOpen]);

  // Empêcher le scroll de la page quand le modal est ouvert
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation de base
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Adresse email invalide');
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      
      console.group('🔍 DIAGNOSTIC - MOT DE PASSE OUBLIÉ');
      console.log('📧 Email saisi:', trimmedEmail);
      console.log('🌐 URL de redirection:', `${window.location.origin}/reset-password`);
      console.log('🔑 Supabase Project ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
      console.log('🌍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

      // Vérifier que Supabase est bien initialisé
      if (!supabase) {
        throw new Error('Supabase client non initialisé');
      }

      console.log('📤 Envoi de la demande de réinitialisation...');
      console.log('⚠️ NOTE: Vérifiez que Supabase Email Auth est configuré avec SMTP/SendGrid/Mailgun');

      // Appel API corrigé avec URL ABSOLUE
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('🔗 Redirect URL complète:', redirectUrl);
      
      // Vérifier que l'URL contient le protocole
      if (!redirectUrl.startsWith('http')) {
        throw new Error('URL de redirection invalide - doit contenir le protocole (http/https)');
      }

      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: redirectUrl,
        }
      );

      console.log('✉️ Réponse Supabase:', { data, resetError });

      if (resetError) {
        console.error('❌ Erreur Supabase détaillée:', {
          message: resetError.message,
          code: (resetError as unknown as Record<string, unknown>).code,
          status: (resetError as unknown as Record<string, unknown>).status,
          fullError: resetError,
          cause: '⚠️ Causes possibles: Supabase Email non configuré, URL non autorisée, compte introuvable',
        });
        throw resetError;
      }

      // Si pas d'erreur Supabase, l'email a été accepté par Supabase
      // (Mais attention: Supabase peut accepter la requête même si les emails ne sont pas configurés!)
      console.log('✅ Email accepté par Supabase (en attente d\'envoi)');
      console.log('💡 ASTUCE: Si l\'email n\'arrive pas, Supabase Email Auth n\'est probablement pas configuré');
      console.log('📋 Configuration requise: Dashboard Supabase → Authentication → Email Provider → Configurer SMTP');
      console.groupEnd();

      // Afficher le message de succès
      setSubmitted(true);
      toast({
        title: '✅ Demande envoyée',
        description: 'Vérifiez votre boîte email (et le dossier spam) pour le lien de réinitialisation.',
        variant: 'default',
      });
    } catch (err: unknown) {
      console.error('💥 Erreur complète:', err);
      console.groupEnd();

      // Extraction du message d'erreur
      let errorMessage = 'Une erreur est survenue lors de la réinitialisation';
      let statusCode = '';
      
      if ((err as unknown as Record<string, unknown>)?.message) {
        errorMessage = (err as unknown as Record<string, unknown>).message as string;
      } else if ((err as unknown as Record<string, unknown>)?.error_description) {
        errorMessage = (err as unknown as Record<string, unknown>).error_description as string;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Améliorer le message d'erreur avec des conseils
      if (errorMessage.includes('User not found')) {
        errorMessage = 'Cet email n\'est pas enregistré dans notre système';
        statusCode = ' (User not found)';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer';
        statusCode = ' (Rate limited)';
      } else if (errorMessage.includes('Email provider')) {
        errorMessage = 'Service d\'email temporairement indisponible. Réessayez plus tard';
        statusCode = ' (Email provider error)';
      }

      console.error('📌 Message d\'erreur final:', errorMessage + statusCode);

      setError(errorMessage);
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmail('');
    setSubmitted(false);
    setError('');
    onBackToLogin?.();
  };

  if (!isOpen) return null;

  return (
    <DraggableModal open={isOpen} onClose={loading ? () => {} : onClose} verticalOnly={true}>
      <div className="bg-background text-foreground rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-blue-300 opacity-70 cursor-grab" />
            <h2 className="text-lg font-bold text-white">Réinitialiser le mot de passe</h2>
          </div>
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-blue-500 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-white" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          <AnimatePresence mode="wait">
            {!submitted ? (
              // Formulaire
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <EmailFieldPro
                      value={email}
                      onChange={(v) => setEmail(v)}
                      label="Adresse email"
                      required
                      onValidationChange={() => {}}
                      className="h-9"
                    />
                  </div>

                  {/* Erreur */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  {/* Boutons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToLogin}
                      disabled={loading}
                      className="h-9 text-sm"
                    >
                      Retour
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              // Message de succès
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center py-2"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Email envoyé ✓</h3>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez votre boîte email pour le lien de réinitialisation du mot de passe.
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Le lien expire dans 1 heure.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left text-sm">
                  <p className="text-blue-700 font-medium mb-1">💡 Conseil</p>
                  <p className="text-blue-600">
                    Si vous ne recevez pas d'email, vérifiez votre dossier spam ou attendez quelques minutes.
                  </p>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full h-9 text-sm bg-green-600 hover:bg-green-700"
                >
                  Fermer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DraggableModal>
  );
};

export default ForgotPasswordModal;
