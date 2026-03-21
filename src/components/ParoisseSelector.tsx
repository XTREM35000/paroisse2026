import { Building2, Check, Plus, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useParoisse, type Paroisse } from '@/contexts/ParoisseContext';
import { useAuthContext } from '@/contexts/useAuthContext';
import { useNotification } from '@/components/ui/notification-system';
import { getStoredParoisseId, markParoisseAutoPromptDone } from '@/lib/paroisseStorage';

interface ParoisseSelectorProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal paroisse : rendu via createPortal sur document.body (z-index élevé).
 * Évite les bugs du Dialog Radix contrôlé (fermeture immédiate / overlay sans panneau).
 */
export const ParoisseSelector: React.FC<ParoisseSelectorProps> = ({ open, onClose }) => {
  const { paroissesList, setParoisse, paroisse: currentParoisse } = useParoisse();
  const { role } = useAuthContext();
  const { notifyInfo } = useNotification();

  const isSuperAdmin = role === 'super_admin';

  const handleDismiss = useCallback(() => {
    if (!getStoredParoisseId()) {
      markParoisseAutoPromptDone();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleDismiss]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paroisse-selector-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className="relative z-[30001] w-full max-w-md rounded-lg border border-border bg-card p-6 text-foreground shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isSuperAdmin && (
          <motion.button
            type="button"
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [1, 1.08, 1], opacity: 1 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              notifyInfo('Module en cours de conception ou de développement');
            }}
            className="absolute top-3 right-12 z-[1002] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-purple-600/30"
            aria-label="Ajouter une nouvelle paroisse"
            title="Ajouter une nouvelle paroisse"
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground opacity-80 ring-offset-background transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1.5 pr-8 text-center sm:text-left">
          <h2 id="paroisse-selector-title" className="text-lg font-semibold leading-none tracking-tight">
            Choisissez votre paroisse
          </h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez la paroisse dont vous souhaitez voir le contenu. Vous pourrez la modifier plus tard depuis le menu.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {(paroissesList || []).length === 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Aucune paroisse active disponible pour le moment.
            </div>
          )}

          {(paroissesList || []).map((p: Paroisse) => (
            <Button
              key={p.id}
              variant={currentParoisse?.id === p.id ? 'default' : 'outline'}
              className="w-full justify-between"
              onClick={() => {
                setParoisse(p);
                onClose();
              }}
            >
              <div className="flex items-center gap-2">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.nom} className="h-6 w-6 rounded" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
                <span>{p.nom}</span>
              </div>
              {currentParoisse?.id === p.id && <Check className="h-4 w-4" />}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};
