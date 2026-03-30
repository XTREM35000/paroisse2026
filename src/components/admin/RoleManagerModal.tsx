import { useState } from 'react';
import DraggableModal from '@/components/DraggableModal';
import { RoleManager } from '@/components/admin/RoleManager';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoleManagerModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function RoleManagerModal({ open, onClose, onComplete }: RoleManagerModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const markCompleted = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ has_seen_role_manager: true } as never)
      .eq('id', profile?.id);
    if (error) throw error;
    await refreshProfile();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await markCompleted();
      toast.success('Configuration des roles terminee');
      onComplete?.();
      onClose();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await markCompleted();
    } catch {
      // no-op
    } finally {
      onClose();
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={() => void handleSkip()}
      title="Bienvenue Super Admin"
      maxWidthClass="max-w-6xl"
      className="h-[90vh] max-h-[90vh]"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="p-6 space-y-6 h-full flex flex-col">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h2 className="text-xl font-bold text-primary">Configurez vos roles et permissions</h2>
          <p className="text-muted-foreground mt-2">
            Definissez quels roles ont acces a quelles pages de l&apos;application.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RoleManager compact />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => void handleSkip()} disabled={isLoading}>
            Configurer plus tard
          </Button>
          <Button onClick={() => void handleComplete()} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Terminer
          </Button>
        </div>
      </div>
    </DraggableModal>
  );
}
