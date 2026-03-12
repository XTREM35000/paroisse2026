import { useState, useEffect } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ContentApproval } from '@/types/database';

export const useSubmissionStatus = () => {
  const { user } = useAuthContext();
  const [submissions, setSubmissions] = useState<ContentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('content_approvals')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });

        if (fetchError) throw fetchError;
        setSubmissions(data || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user?.id]);

  return { submissions, loading, error };
};

// Component for displaying submission status
export const SubmissionStatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' }) => {
  switch (status) {
    case 'approved':
      return (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Approuvé</span>
        </div>
      );
    case 'rejected':
      return (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
          <XCircle className="h-4 w-4" />
          <span>Rejeté</span>
        </div>
      );
    case 'pending':
    default:
      return (
        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm">
          <Clock className="h-4 w-4" />
          <span>En attente</span>
        </div>
      );
  }
};

export const SubmissionStatusList = () => {
  const { submissions, loading, error } = useSubmissionStatus();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucune soumission pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <div key={submission.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">
                {submission.title || `${submission.content_type === 'video' ? 'Vidéo' : 'Image'} soumise`}
              </h4>
              {submission.description && (
                <p className="text-sm text-muted-foreground mt-1">{submission.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Soumis le: {new Date(submission.submitted_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <SubmissionStatusBadge status={submission.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default useSubmissionStatus;
