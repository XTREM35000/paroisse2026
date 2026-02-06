import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SupabaseEmailDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    supabaseInitialized: boolean;
    projectId: string;
    supabaseUrl: string;
    testEmail: string;
    status: string;
    issues: string[];
    suggestions: string[];
  }>({
    supabaseInitialized: false,
    projectId: '',
    supabaseUrl: '',
    testEmail: '',
    status: 'checking',
    issues: [],
    suggestions: [],
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const issues: string[] = [];
      const suggestions: string[] = [];

      try {
        // Vérifier Supabase
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        if (!projectId) {
          issues.push('VITE_SUPABASE_PROJECT_ID non défini');
          suggestions.push('Ajouter VITE_SUPABASE_PROJECT_ID dans .env');
        }

        if (!supabaseUrl) {
          issues.push('VITE_SUPABASE_URL non défini');
          suggestions.push('Ajouter VITE_SUPABASE_URL dans .env');
        }

        if (!supabase) {
          issues.push('Supabase client non initialisé');
        }

        // Vérifier la session
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          suggestions.push('Aucune session active - se connecter pour tester l\'envoi d\'email');
        }

        // Vérifier les URLs de redirection
        const currentOrigin = window.location.origin;
        const resetPasswordUrl = `${currentOrigin}/reset-password`;
        
        if (!resetPasswordUrl.startsWith('http')) {
          issues.push('URL de redirection invalide (pas de protocole)');
          suggestions.push(`Ajouter à Supabase: ${resetPasswordUrl}`);
        }

        setDiagnostics({
          supabaseInitialized: !!supabase,
          projectId: projectId || 'non défini',
          supabaseUrl: supabaseUrl || 'non défini',
          testEmail: session?.session?.user?.email || 'aucun utilisateur',
          status: issues.length === 0 ? 'ok' : 'warning',
          issues,
          suggestions,
        });
      } catch (err) {
        console.error('Erreur diagnostic:', err);
        setDiagnostics((prev) => ({
          ...prev,
          status: 'error',
          issues: ['Erreur lors de la vérification des diagnostics'],
        }));
      }
    };

    runDiagnostics();
  }, []);

  const handleTestEmail = async () => {
    try {
      setDiagnostics((prev) => ({ ...prev, status: 'checking' }));
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'test@example.com',
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setDiagnostics((prev) => ({
          ...prev,
          status: 'error',
          issues: [...prev.issues, `Erreur envoi test: ${error.message}`],
        }));
      } else {
        setDiagnostics((prev) => ({
          ...prev,
          status: 'ok',
          suggestions: [...prev.suggestions, '✅ Test d\'envoi réussi!'],
        }));
      }
    } catch (err) {
      console.error('Erreur test:', err);
      setDiagnostics((prev) => ({
        ...prev,
        status: 'error',
        issues: [...prev.issues, 'Erreur lors du test d\'envoi'],
      }));
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Diagnostic - Supabase Email Auth</h3>
      </div>

      {/* Configuration */}
      <div className="space-y-2 text-sm">
        <p className="text-blue-800">
          <strong>Project ID:</strong> {diagnostics.projectId}
        </p>
        <p className="text-blue-800">
          <strong>Supabase URL:</strong> {diagnostics.supabaseUrl}
        </p>
        <p className="text-blue-800">
          <strong>Test Email:</strong> {diagnostics.testEmail}
        </p>
      </div>

      {/* Problèmes */}
      {diagnostics.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3 space-y-1">
          <p className="text-sm font-medium text-red-800">⚠️ Problèmes détectés:</p>
          {diagnostics.issues.map((issue, idx) => (
            <p key={idx} className="text-xs text-red-700">
              • {issue}
            </p>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {diagnostics.suggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-1">
          <p className="text-sm font-medium text-yellow-800">💡 Suggestions:</p>
          {diagnostics.suggestions.map((suggestion, idx) => (
            <p key={idx} className="text-xs text-yellow-700">
              • {suggestion}
            </p>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        {diagnostics.status === 'checking' && (
          <Clock className="h-4 w-4 animate-spin text-blue-600" />
        )}
        {diagnostics.status === 'ok' && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
        {diagnostics.status === 'warning' && (
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        )}
        {diagnostics.status === 'error' && (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <span className="text-xs text-gray-600">
          Status: {diagnostics.status.toUpperCase()}
        </span>
      </div>

      {/* Test Button */}
      <Button
        onClick={handleTestEmail}
        size="sm"
        className="w-full text-xs"
        variant="outline"
      >
        Tester l'envoi d'email
      </Button>

      {/* Instructions */}
      <div className="bg-blue-100 rounded p-2 text-xs text-blue-900 space-y-1">
        <p className="font-medium">📋 Checklist de configuration:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Aller sur: https://app.supabase.com/project/{diagnostics.projectId}</li>
          <li>Aller à: Authentication → Email Provider</li>
          <li>Configurer: SMTP ou SendGrid/Mailgun</li>
          <li>Aller à: Authentication → URL Configuration</li>
          <li>Ajouter Redirect URL: {window.location.origin}/reset-password</li>
          <li>Vérifier: Authentication → Templates → Password reset (activé)</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseEmailDiagnostics;
