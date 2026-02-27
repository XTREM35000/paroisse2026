import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DraggableModal from './DraggableModal';

interface WelcomeModalProps {
  onClose: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

/**
 * WelcomeModal Component
 * 
 * Affiche un modal de bienvenue au chargement initial de la page d'accueil.
 * Ce modal s'affiche automatiquement une seule fois par session.
 * 
 * Inspiré par AdvertisementPopup mais adapté pour un message de bienvenue simple.
 */
export default function WelcomeModal({ onClose, onOpenAuthModal }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    console.log('WelcomeModal: Fermeture du modal de bienvenue');
    setIsVisible(false);
    onClose();
  };

  const handleConnect = () => {
    console.log('WelcomeModal: Connexion cliquée');
    setIsVisible(false);
    onClose();
    // Navigate to auth page or open auth modal
    if (onOpenAuthModal) {
      onOpenAuthModal('login');
    } else {
      // Use fragment to open auth modal without causing a full navigation
      window.location.hash = '#auth';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <DraggableModal
      open={isVisible}
      onClose={handleClose}
      draggableOnMobile={true}
      dragHandleOnly={false}
      verticalOnly={false}
      center={true}
      maxWidthClass="max-w-md"
      title="Bienvenue sur votre site média en ligne"
    >
      {/* Content */}
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-3">
            Heureux de vous compter parmi nous ! 🙏
          </h3>
          <p className="text-white/90 mb-4 leading-relaxed">
            Découvrez nos dernières vidéos de messes, homélies, événements et bien plus encore.
          </p>
          <p className="text-sm text-white/80 mb-6">
            Rejoignez notre communauté pour rester connecté à votre paroisse.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-background/5 border-t border-border/20 flex gap-3">
        <button
          onClick={handleConnect}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          S'authentifier
        </button>
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2 border border-border/30 text-white/90 font-semibold rounded-lg transition-colors"
        >
          Continuer
        </button>
      </div>
    </DraggableModal>
  );
}
