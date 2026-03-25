import { Building2, Check, Plus, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useParoisse, type Paroisse } from '@/contexts/ParoisseContext';
import { useAuthContext } from '@/contexts/useAuthContext';

interface ParoisseSelectorProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal paroisse : createPortal sur document.body (z-index élevé), sans conteneur retiré à la main.
 * Évite les bugs du Dialog Radix contrôlé (fermeture immédiate / overlay sans panneau).
 */
export const ParoisseSelector: React.FC<ParoisseSelectorProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { paroissesList, setParoisse, paroisse: currentParoisse } = useParoisse();
  const { role } = useAuthContext();

  const isSuperAdmin = role === 'super_admin';

  const handleDismiss = useCallback(() => {
    // Ne plus persister de flag « prompt vu » : au prochain rechargement, sans paroisse en localStorage,
    // le sélecteur se rouvrira (comportement attendu après connexion / F5).
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    try {
      document.body.style.overflow = 'hidden';
    } catch {
      // ignore
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      try {
        document.body.style.overflow = prev;
      } catch {
        // ignore
      }
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
        className="relative z-[30001] w-full max-w-md rounded-xl border-2 border-primary/30 bg-card p-6 text-foreground shadow-2xl"
        style={{ boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--border))' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground opacity-80 ring-offset-background transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1.5 pr-8 text-center sm:text-left">
          <h2 id="paroisse-selector-title" className="text-lg font-semibold leading-none tracking-tight text-primary">
            Choisissez votre paroisse
          </h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez la paroisse dont vous souhaitez voir le contenu. Vous pourrez la modifier plus tard depuis le menu.
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            type="button"
            variant="default"
            className="mt-4 w-full gap-2 paroisse-btn-3d bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
            onClick={() => {
              onClose();
              navigate('/admin/paroisses');
            }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nouvelle paroisse
          </Button>
        )}

        <div className="mt-4 space-y-2">
          {(paroissesList || []).length === 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Aucune paroisse active disponible pour le moment.
            </div>
          )}

          {(paroissesList || [])
            .filter((p: Paroisse) => p.slug !== 'system')
            .map((p: Paroisse) => (
            <button
              key={p.id}
              type="button"
              className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition-all ${
                currentParoisse?.id === p.id
                  ? 'paroisse-btn-3d bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'paroisse-btn-3d-outline bg-muted/50 hover:bg-muted border border-border'
              }`}
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
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};
