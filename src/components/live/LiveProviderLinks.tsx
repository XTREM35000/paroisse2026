import React from 'react';
import { ExternalLink, Youtube, Facebook, Instagram, Send, Link as LinkIcon } from 'lucide-react';
import type { LiveProviderSource } from '@/types/database';

interface LiveProviderLinksProps {
  sources: LiveProviderSource[];
}

/**
 * Composant pour afficher les liens fournisseurs sous le lecteur vidéo
 * 
 * Affiche une liste horizontale de boutons liens vers YouTube, Facebook, Instagram, TikTok, etc.
 * Chaque lien s'ouvre dans un nouveau tab
 * 
 * Si sources est vide → return null (aucun affichage)
 * 
 * @param sources - Tableau des sources du fournisseur
 * @returns Composant React ou null
 * 
 * @example
 * <LiveProviderLinks sources={sources} />
 */
export default function LiveProviderLinks({ sources }: LiveProviderLinksProps) {
  // Filtrer les sources sans URL
  const validSources = sources.filter((source) => source.url && source.url.trim());

  // Si aucune source valide → ne rien afficher
  if (validSources.length === 0) {
    return null;
  }

  /**
   * Retourner l'icône appropriée selon le fournisseur
   */
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'tiktok':
        return <Send className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  /**
   * Retourner le label formaté
   */
  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      youtube: 'YouTube',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      custom: 'Regarder',
    };
    return labels[provider.toLowerCase()] || 'Lien';
  };

  /**
   * Retourner la couleur du bouton selon le fournisseur
   */
  const getProviderColor = (provider: string): string => {
    switch (provider.toLowerCase()) {
      case 'youtube':
        return 'hover:border-red-500 hover:text-red-500';
      case 'facebook':
        return 'hover:border-blue-600 hover:text-blue-600';
      case 'instagram':
        return 'hover:border-pink-500 hover:text-pink-500';
      case 'tiktok':
        return 'hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white';
      default:
        return 'hover:border-primary hover:text-primary';
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        Regarder aussi sur :
      </p>

      <div className="flex flex-wrap gap-3">
        {validSources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              border border-border text-foreground
              transition-colors duration-200
              hover:bg-muted/50
              ${getProviderColor(source.provider)}
            `}
            aria-label={`Ouvrir ${getProviderLabel(source.provider)}`}
          >
            {getProviderIcon(source.provider)}
            <span className="text-sm font-medium">
              {getProviderLabel(source.provider)}
            </span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-1" />
          </a>
        ))}
      </div>
    </div>
  );
}
