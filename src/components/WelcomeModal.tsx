import React, { useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

/**
 * WelcomeModal Component
 * 
 * Affiche un modal de bienvenue au chargement initial de la page d'accueil.
 * Ce modal s'affiche automatiquement une seule fois par session.
 * 
 * Inspiré par AdvertisementPopup mais adapté pour un message de bienvenue simple.
 */
export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    console.log('WelcomeModal: Fermeture du modal de bienvenue');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white"> Bienvenue sur votre site média en ligne</h2>
          <button
            onClick={handleClose}
            aria-label="Fermer le modal"
            className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Heureux de vous revoir ! 🙏
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Découvrez nos dernières vidéos de messes, homélies, événements et bien plus encore.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Rejoignez notre communauté pour rester connecté à votre paroisse.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Explorez
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
