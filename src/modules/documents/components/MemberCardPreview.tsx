/**
 * Aperçu d'une carte de membre (format 85mm x 55mm)
 * Affiche: logo, photo, nom, rôle, numéro, signature
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import type { MemberCard, DocumentSettings } from '../types/documents';

interface MemberCardPreviewProps {
  card: MemberCard;
  settings?: DocumentSettings | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Composant pour afficher une aperçu de carte de membre
 * Format standard: 85mm x 55mm (dimensiosn de carte bancaire)
 * 
 * @example
 * <MemberCardPreview 
 *   card={card}
 *   settings={settings}
 *   size="large"
 * />
 */
export function MemberCardPreview({
  card,
  settings,
  size = 'medium',
  className = '',
}: MemberCardPreviewProps) {
  const baseClass = 'rounded-lg border-2 border-gray-300 bg-white overflow-hidden shadow-lg';

  // Dimensions basées sur la taille
  const sizeMap = {
    small: 'w-48 h-32',
    medium: 'w-80 h-52',
    large: 'w-96 h-60',
  };

  const sizeClass = sizeMap[size];

  return (
    <div id="member-card-preview" className={`${baseClass} ${sizeClass} ${className}`}>
      {/* Arrière-plan avec motif */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500 to-purple-500" />

      {/* Contenu */}
      <div className="relative h-full p-4 sm:p-6 flex flex-col">
        {/* En-tête avec logo */}
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt="Logo"
              className="h-8 sm:h-12 w-auto object-contain"
            />
          )}
          <div className="text-right">
            <p className="text-xs sm:text-sm font-bold text-gray-900">
              {settings?.parish_name || 'Paroisse'}
            </p>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-b border-gray-300 mb-2 sm:mb-3" />

        {/* Section photo et infos */}
        <div className="flex gap-2 sm:gap-3 flex-1 mb-2 sm:mb-3">
          {/* Photo */}
          {card.photo_url && (
            <div className="w-12 sm:w-16 h-16 sm:h-20 rounded border border-gray-300 overflow-hidden flex-shrink-0">
              <img
                src={card.photo_url}
                alt={card.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
              {card.full_name}
            </p>
            {card.role && (
              <p className="text-xs text-gray-700 truncate">{card.role}</p>
            )}
            {card.member_number && (
              <p className="text-xs text-gray-600 mt-1">
                {card.member_number}
              </p>
            )}
            {card.status && (
              <div className="mt-1">
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    card.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : card.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : card.status === 'expired'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {card.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Signature et date */}
        <div className="flex justify-between items-end border-t border-gray-300 pt-2">
          {card.signature_url && (
            <img
              src={card.signature_url}
              alt="Signature"
              className="h-4 sm:h-6 w-auto object-contain"
            />
          )}
          <p className="text-xs text-gray-600">
            {card.issued_at && new Date(card.issued_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Repères d'impression */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Coin haut gauche */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gray-400" />
        {/* Coin haut droit */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-gray-400" />
        {/* Coin bas gauche */}
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-gray-400" />
        {/* Coin bas droit */}
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gray-400" />
      </div>
    </div>
  );
}

export default MemberCardPreview;
