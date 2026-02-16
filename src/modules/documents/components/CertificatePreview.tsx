/**
 * Aperçu d'un certificat / diplôme
 * Affiche: logo, titre, nom, mention, date, signature
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import type { Certificate, DocumentSettings } from '../types/documents';

interface CertificatePreviewProps {
  certificate: Certificate;
  settings?: DocumentSettings | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Composant pour afficher un aperçu de certificat
 * Format standard: A4
 * 
 * @example
 * <CertificatePreview 
 *   certificate={cert}
 *   settings={settings}
 *   size="large"
 * />
 */
export function CertificatePreview({
  certificate,
  settings,
  size = 'medium',
  className = '',
}: CertificatePreviewProps) {
  const baseClass = 'rounded-lg border-4 border-amber-800 bg-amber-50 overflow-hidden shadow-2xl';

  // Dimensions basées sur la taille
  const sizeMap = {
    small: 'w-64 h-80',
    medium: 'w-96 h-auto aspect-[210/297]',
    large: 'w-full max-w-2xl h-screen aspect-[210/297]',
  };

  const sizeClass = sizeMap[size];

  return (
    <div
      id="certificate-preview"
      className={`${baseClass} ${sizeClass} ${className}`}
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad"%3E%3Cstop offset="0%25" style="stop-color:rgb(217,119,6);stop-opacity:0.05" /%3E%3Cstop offset="100%25" style="stop-color:rgb(120,53,15);stop-opacity:0.05" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grad)" /%3E%3C/svg%3E")',
        backgroundSize: '100px 100px',
      }}
    >
      {/* Contenu */}
      <div className="relative h-full p-8 sm:p-12 flex flex-col justify-between">
        {/* Haut du certificat */}
        <div className="text-center">
          {/* Logo */}
          {settings?.logo_url && (
            <div className="mb-4 sm:mb-6 flex justify-center">
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-16 sm:h-24 w-auto object-contain"
              />
            </div>
          )}

          {/* Nom paroisse */}
          {settings?.parish_name && (
            <p className="text-xs sm:text-sm font-semibold text-amber-900 mb-2 tracking-widest">
              {settings.parish_name.toUpperCase()}
            </p>
          )}

          {/* Titre du certificat */}
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-900 mb-2 sm:mb-4 italic">
            Certificat
          </h1>

          {/* Ligne de séparation */}
          <div className="w-24 h-1 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 mx-auto mb-6 sm:mb-8" />
        </div>

        {/* Corps du certificat */}
        <div className="text-center flex-1">
          {/* Texte d'en-tête */}
          <p className="text-sm text-amber-900 mb-4 sm:mb-6 leading-relaxed">
            Ce certificat est décerné à
          </p>

          {/* Nom du destinataire */}
          <p className="text-2xl sm:text-3xl font-bold text-amber-950 mb-4 sm:mb-6 underline decoration-amber-800 decoration-2">
            {certificate.full_name}
          </p>

          {/* Type et mention */}
          {certificate.certificate_type && (
            <p className="text-base sm:text-lg text-amber-900 mb-2 font-semibold">
              {certificate.certificate_type}
            </p>
          )}

          {certificate.mention && (
            <p className="text-base sm:text-lg text-amber-800 mb-4 italic">
              {certificate.mention}
            </p>
          )}

          {/* Description */}
          {certificate.description && (
            <p className="text-sm text-amber-900 mb-6 leading-relaxed max-w-md mx-auto">
              {certificate.description}
            </p>
          )}
        </div>

        {/* Bas du certificat */}
        <div className="space-y-4 sm:space-y-6">
          {/* Ligne de séparation */}
          <div className="w-full h-px bg-amber-800" />

          {/* Signature et date */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            {/* Signature gauche */}
            <div className="text-center">
              {certificate.signature_url && (
                <div className="mb-2 flex justify-center">
                  <img
                    src={certificate.signature_url}
                    alt="Signature"
                    className="h-12 sm:h-16 w-auto object-contain"
                  />
                </div>
              )}
              <div className="border-t border-amber-800 pt-2">
                <p className="text-xs sm:text-sm font-semibold text-amber-900">
                  {certificate.issued_by || 'Autorité'}
                </p>
                {settings?.authority_title && (
                  <p className="text-xs text-amber-800">
                    {settings.authority_title}
                  </p>
                )}
              </div>
            </div>

            {/* Date droite */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-amber-900 mb-2">
                Délivré le
              </p>
              <p className="text-xs sm:text-sm font-semibold text-amber-900 border-t border-amber-800 pt-2">
                {certificate.issued_at &&
                  new Date(certificate.issued_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Décoration de coins */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Coins */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800" />
      </div>
    </div>
  );
}

export default CertificatePreview;
