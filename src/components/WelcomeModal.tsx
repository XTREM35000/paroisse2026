import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import DraggableModal from './DraggableModal';

interface WelcomeModalProps {
  onClose: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export default function WelcomeModal({ onClose, onOpenAuthModal }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleConnect = () => {
    setIsVisible(false);
    onClose();

    if (onOpenAuthModal) {
      onOpenAuthModal('login');
    } else {
      window.location.hash = '#auth';
    }
  };

  if (!isVisible) return null;

  return (
    <DraggableModal
      open={isVisible}
      onClose={handleClose}
      draggableOnMobile
      center
      maxWidthClass="max-w-md"
      title="Bienvenue"
    >
      <div className="px-6 pt-6 pb-2 text-center">

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <img src="/logo.png" alt="Logo" className="h-16 w-16" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Heureux de vous accueillir 🙏
        </h3>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-4">
          Retrouvez les dernières vidéos de messes, homélies et événements
          de votre paroisse.
        </p>

        <p className="text-sm text-muted-foreground mb-6">
          Connectez-vous pour commenter, sauvegarder vos vidéos
          et rester informé des nouvelles publications.
        </p>

      </div>

      {/* Actions */}
      <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">

        <button
          onClick={handleConnect}
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          Se connecter
        </button>

        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition"
        >
          Continuer
        </button>

      </div>

    </DraggableModal>
  );
}