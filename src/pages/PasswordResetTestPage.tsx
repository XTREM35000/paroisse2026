import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PasswordResetTestPage: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details: string[];
  }>({ status: 'idle', message: '', details: [] });
  const { toast } = useToast();

  const testPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({ status: 'idle', message: '', details: [] });

    const details: string[] = [];

    try {
      if (!testEmail.trim()) {
        throw new Error('Email requis');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
        throw new Error('Format email invalide');
      }

      details.push(`📧 Email test: ${testEmail}`);
      details.push(`🌐 URL de redirection: ${window.location.origin}/reset-password`);
      details.push(`🔑 Supabase Project: ${import.meta.env.VITE_SUPABASE_PROJECT_ID}`);

      details.push('');
      details.push('⏳ Envoi de la demande de réinitialisation...');

      const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        details.push(`❌ Erreur: ${error.message}`);
        details.push(`📌 Code: ${(error as unknown as Record<string, unknown>).code || 'non disponible'}`);
        details.push('');
        details.push('⚠️ CAUSES POSSIBLES:');
        details.push('1. Email non enregistré dans Supabase Auth');
        details.push('2. Supabase Email Auth non configuré (SMTP/SendGrid/Mailgun)');
        details.push('3. URL de redirection non autorisée');
        details.push('4. Limite de taux d\'envoi dépassée');

        setResult({ status: 'error', message: error.message, details });
        toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
      } else {
        details.push('✅ Requête acceptée par Supabase');
        details.push('');
        details.push('📋 PROCHAINES ÉTAPES:');
        details.push('1. Vérifier la boîte email');
        details.push('2. Vérifier le dossier spam');
        details.push('3. Si aucun email: Supabase Email Auth n\'est probablement pas configuré');
        details.push('');
        details.push('🔧 CONFIGURATION REQUISE:');
        details.push(`→ https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/email`);
        details.push('→ Configurer Email Provider (SMTP/SendGrid/Mailgun)');

        setResult({ status: 'success', message: 'Email accepté par Supabase', details });
        toast({ title: '✅ Succès', description: 'Demande de réinitialisation envoyée' });
      }
    } catch (err) {
      const errMsg = (err as Error).message || 'Erreur inconnue';
      details.push(`❌ Exception: ${errMsg}`);
      setResult({ status: 'error', message: errMsg, details });
      toast({ title: '❌ Erreur', description: errMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test - Réinitialisation Mot de Passe</h1>
          <p className="text-gray-600">
            Testez l'envoi d'email de réinitialisation de mot de passe via Supabase
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={testPasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de test
              </label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="votre@email.com"
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utiliser un email enregistré dans Supabase
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !testEmail.trim()}
              className="w-full h-10"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Envoi en cours...' : 'Tester l\'envoi d\'email'}
            </Button>
          </form>
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Configuration Requise
          </h2>

          <div className="space-y-3 text-sm">
            <div className="bg-white rounded p-3">
              <p className="font-medium text-gray-900">1. Supabase Email Provider</p>
              <p className="text-gray-600 text-xs mt-1">
                Aller à{' '}
                <a
                  href={`https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/email`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Authentication → Email Provider
                </a>
                {' '}et configurer SMTP ou un service d'email (SendGrid, Mailgun, etc.)
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-medium text-gray-900">2. URL de Redirection</p>
              <p className="text-gray-600 text-xs mt-1">
                Ajouter à{' '}
                <a
                  href={`https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/url-configuration`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  URL Configuration
                </a>
                :
              </p>
              <code className="text-xs bg-gray-100 rounded p-2 block mt-2 text-gray-900">
                {window.location.origin}/reset-password
              </code>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-medium text-gray-900">3. Template Email</p>
              <p className="text-gray-600 text-xs mt-1">
                Vérifier que le template "Password reset" est activé dans{' '}
                <a
                  href={`https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/templates`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Authentication → Templates
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {result.status !== 'idle' && (
          <div
            className={`rounded-lg p-6 mb-6 ${
              result.status === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {result.status === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <h3
                className={`text-lg font-semibold ${
                  result.status === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.message}
              </h3>
            </div>

            <div
              className={`space-y-1 text-sm ${
                result.status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.details.map((detail, idx) => (
                <p key={idx} className="font-mono text-xs">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Info Environnement</h3>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            <p>
              <span className="text-gray-500">Project ID:</span> {import.meta.env.VITE_SUPABASE_PROJECT_ID}
            </p>
            <p>
              <span className="text-gray-500">Supabase URL:</span> {import.meta.env.VITE_SUPABASE_URL}
            </p>
            <p>
              <span className="text-gray-500">Origin:</span> {window.location.origin}
            </p>
            <p>
              <span className="text-gray-500">Reset Password URL:</span> {window.location.origin}/reset-password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetTestPage;
