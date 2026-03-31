import React, { useState } from 'react';
import { AlertCircle, Check, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModerationItem {
  id: string;
  type: 'comment' | 'prayer' | 'report';
  content: string;
  author: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

interface UnifiedModerationPanelProps {
  items?: ModerationItem[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700',
  approved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700',
  rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700',
};

const priorityColors: Record<string, string> = {
  low: 'text-blue-600 dark:text-blue-400',
  medium: 'text-orange-600 dark:text-orange-400',
  high: 'text-red-600 dark:text-red-400',
};

const UnifiedModerationPanel: React.FC<UnifiedModerationPanelProps> = ({
  items = [],
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleApprove = async (id: string, type: string) => {
    setActionInProgress(id);
    try {
      // Placeholder: notifications table update
      toast({ title: 'Succès', description: 'Élément approuvé' });
    } catch (err) {
      console.error('[UnifiedModerationPanel] Approve error:', err);
      toast({ title: 'Erreur', description: 'Impossible d\'approuver', variant: 'destructive' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id: string, type: string) => {
    setActionInProgress(id);
    try {
      // Placeholder: notifications table update
      toast({ title: 'Succès', description: 'Élément rejeté' });
    } catch (err) {
      console.error('[UnifiedModerationPanel] Reject error:', err);
      toast({ title: 'Erreur', description: 'Impossible de rejeter', variant: 'destructive' });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h2 className="text-lg font-semibold">Modération en attente</h2>
        {items.length > 0 && (
          <span className="ml-auto text-sm font-semibold text-orange-600 dark:text-orange-400">
            {items.filter(i => i.status === 'pending').length} en attente
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun élément à modérer ✨</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${statusColors[item.status]} transition-all`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <span className="inline-block text-xs font-semibold px-2 py-1 bg-current/20 rounded mb-1">
                    {item.type === 'comment' ? '💬 Commentaire' : item.type === 'prayer' ? '🙏 Prière' : '🚩 Signalement'}
                  </span>
                  <p className="text-xs font-medium">{item.author}</p>
                </div>
                <span className={`text-xs font-bold ${priorityColors[item.priority]}`}>
                  {item.priority === 'high' ? '⚠️ HIGH' : item.priority === 'medium' ? '⚡ MED' : '✓ LOW'}
                </span>
              </div>

              {/* Content */}
              <p className="text-xs text-current/80 mb-2 line-clamp-2">{item.content}</p>

              {/* Time */}
              <p className="text-xs opacity-60 mb-3">{new Date(item.createdAt).toLocaleString('fr-FR')}</p>

              {/* Actions */}
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionInProgress === item.id}
                    onClick={() => handleApprove(item.id, item.type)}
                    className="text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900 flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" /> Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionInProgress === item.id}
                    onClick={() => handleReject(item.id, item.type)}
                    className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 flex-1"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Rejeter
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UnifiedModerationPanel;
