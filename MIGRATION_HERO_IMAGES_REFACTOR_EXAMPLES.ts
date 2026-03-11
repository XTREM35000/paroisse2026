/**
 * Exemples de refactor pour HeroBanner.tsx
 * 
 * Ces exemples montrent comment utiliser le nouveau helper images.ts
 * tout en restant conservative et en évitant les breaking changes.
 */

// ============================================================================
// EXEMPLE 1: Utiliser getHeroImageUrl pour normaliser l'affichage
// ============================================================================

import { getHeroImageUrl } from '@/lib/images';

// Avant (état actuel - fonctionne mais mélange sources):
// const bg = hero?.image_url || backgroundImage || '/images/fallback.png';

// Après (avec helper - centralisé):
const bg = getHeroImageUrl({
  imageUrl: hero?.image_url || backgroundImage,
  imageStoragePath: hero?.image_storage_path, // Futur (optionnel)
  fallbackLocal: '/images/bapteme.png', // Fallback local page-spécifique
});

// ============================================================================
// EXEMPLE 2: Ajouter preload pour LCP (dans le composant Page, pas HeroBanner)
// ============================================================================

// src/pages/VideosPage.tsx ou tout autre page avec hero

import { useEffect } from 'react';

export default function VideosPage() {
  const { data: hero } = usePageHero(location.pathname);
  
  // Preload l'image LCP si elle existe
  useEffect(() => {
    if (hero?.image_url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = hero.image_url;
      // Optionnel: ajouter fetchpriority
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      
      return () => {
        // Nettoyer au unmount (optionnel)
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [hero?.image_url]);
  
  return (
    <HeroBanner
      title="Vidéos"
      backgroundImage={hero?.image_url}
      onBgSave={saveHero}
    />
  );
}

// ============================================================================
// EXEMPLE 3: HeroBanner.tsx - Refactor complet (conservative)
// ============================================================================

/*
import { motion } from "framer-motion";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroBgEditor from "@/components/HeroBgEditor";
import { useState, useEffect } from "react";
import useRoleCheck from '@/hooks/useRoleCheck';
import usePageHero from '@/hooks/usePageHero';
import { getHeroImageUrl } from '@/lib/images';  // ← NEW

interface HeroBannerProps {
  title: string;
  subtitle: string;
  eventTitle?: string;
  eventDate?: string;
  backgroundImage?: string;
  showBackButton?: boolean;
  description?: string;
  bucket?: string;
  onBgSave?: (url: string) => Promise<void> | void;
}

const HeroBanner = ({
  title,
  subtitle,
  eventTitle,
  eventDate,
  backgroundImage,
  showBackButton = true,
  description,
  bucket,
  onBgSave,
}: HeroBannerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bg, setBg] = useState<string | undefined>(backgroundImage);
  const { isAdmin } = useRoleCheck();
  const { save: saveHero } = usePageHero(location.pathname);

  useEffect(() => {
    if (backgroundImage) {
      setBg(backgroundImage);
    }
  }, [backgroundImage]);

  const handleBgSave = async (url: string) => {
    setBg(url);
    try {
      const ev = new CustomEvent('hero-bg-changed', { detail: { path: location.pathname, url } });
      window.dispatchEvent(ev);
    } catch (e) {
      // noop
    }

    if (onBgSave) {
      await onBgSave(url);
    } else {
      try {
        await saveHero(url);
      } catch (e) {
        // noop
      }
    }
  };

  // ← NEW: Utiliser le helper pour normaliser
  const finalImageUrl = getHeroImageUrl({
    imageUrl: bg,
    fallbackLocal: '/images/default-hero.png',
  });

  return (
    <section className="relative h-[30vh] md:h-[38vh] lg:h-[50vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {finalImageUrl ? (
          <img
            src={finalImageUrl}
            alt="Arrière-plan de la bannière"
            className="w-full h-full object-cover object-center"
            loading="eager"        // ← NEW: LCP optimization
            decoding="sync"         // ← NEW: LCP optimization
            width={1920}            // ← NEW: Avoid layout shift
            height={1080}           // ← NEW: Avoid layout shift
          />
        ) : (
          <div className="w-full h-full gradient-hero" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/40 via-foreground/30 to-foreground/10" />
        <div className="absolute inset-0 cross-pattern opacity-10" />
      </div>

      {/* Editor button for non-index pages (admins only) */}
      {location.pathname !== '/' && isAdmin && (
        <HeroBgEditor current={bg} onSave={handleBgSave} bucket={bucket} />
      )}

      {/* Content ... reste inchangé ... */}
    </section>
  );
};

export default HeroBanner;
*/

// ============================================================================
// EXEMPLE 4: usePageHero hook - Optionnel: Supporter image_storage_path
// ============================================================================

/*
// src/hooks/usePageHero.ts - Extended version (futur)

export interface PageHero {
  id: string;
  path: string;
  image_url?: string | null;
  image_storage_path?: string | null;  // ← NEW (optionnel)
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
}

// ... reste du hook identique ...
// Le save() peut stocker soit dans image_url (old) soit image_storage_path (new)
*/

// ============================================================================
// EXEMPLE 5: HeroBgEditor - Documenter le contrat
// ============================================================================

/*
// Dans HeroBgEditor.tsx - Documentation pour clarifier le flux

/**
 * HeroBgEditor: Éditeur modal pour l'image de fond du Hero.
 * 
 * Contrat:
 * - Entrée: `current` = URL courante (peut être Supabase ou local)
 * - Upload: toujours vers Supabase (bucket spécifié ou 'gallery')
 * - Sortie: `onSave(url)` = URL Supabase publique ou URL externe collée
 * 
 * Important: 
 * - Ne jamais retourner un objectURL (blob://) persistant
 * - Le parent (HeroBanner) doit sauvegarder l'URL via usePageHero.save()
 */

// handleFile(...) {
//   ...
//   const res = bucket 
//     ? await uploadDirectoryImage(file, bucket)
//     : await uploadFile(file);
//   
//   if (res?.publicUrl) {
//     setValue(res.publicUrl);  // ← Toujours Supabase
//   } else {
//     // Fallback: montrer l'erreur, pas garder objectURL
//     setUploadError('...');
//   }
// }
*/

// ============================================================================
// EXEMPLE 6: Intégration with LCP preload (Page-level)
// ============================================================================

/*
// Template pour une page utilisant HeroBanner optimisée

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';

export default function MyPage() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  // Preload LCP image si disponible
  useEffect(() => {
    if (hero?.image_url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = hero.image_url;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [hero?.image_url]);

  return (
    <>
      <HeroBanner
        title="Page Title"
        subtitle="Subtitle"
        backgroundImage={hero?.image_url || '/images/fallback.png'}
        onBgSave={saveHero}
      />
      
      {/* Reste du contenu */}
    </>
  );
}
*/

// ============================================================================
// EXEMPLE 7: Migration de page existante (avant/après)
// ============================================================================

/*
// AVANT: src/pages/Verse.tsx (état actuel)
export default function VersePage() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  return (
    <div>
      <HeroBanner
        title="Verset du jour"
        subtitle="Un verset pour aujourd'hui"
        backgroundImage={hero?.image_url || "/images/bible.png"}  // ← Mix sources
        onBgSave={saveHero}
      />
      ...
    </div>
  );
}

// APRÈS: Même page, après refactor (optionnel, si désiré)
import { useEffect } from 'react';
import { getHeroImageUrl } from '@/lib/images';

export default function VersePage() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  // Preload LCP
  useEffect(() => {
    if (hero?.image_url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = hero.image_url;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [hero?.image_url]);

  // Normaliser l'URL (futur: utilisera image_storage_path si migré)
  const bgUrl = getHeroImageUrl({
    imageUrl: hero?.image_url,
    fallbackLocal: '/images/bible.png',
  });

  return (
    <div>
      <HeroBanner
        title="Verset du jour"
        subtitle="Un verset pour aujourd'hui"
        backgroundImage={bgUrl || undefined}  // ← Plus prévisible
        onBgSave={saveHero}
      />
      ...
    </div>
  );
}
*/

console.log('Exemples de refactor fournis. À adapter selon vos besoins.');
