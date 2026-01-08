// src\components\HeroBanner.tsx

import { motion } from "framer-motion";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroBgEditor from "@/components/HeroBgEditor";
import { useState, useEffect } from "react";
import useRoleCheck from '@/hooks/useRoleCheck';
import usePageHero from '@/hooks/usePageHero';
import { getHeroImageUrl } from '@/lib/images';

interface HeroBannerProps {
  title: string;
  subtitle: string;
  eventTitle?: string;
  eventDate?: string;
  backgroundImage?: string;
  showBackButton?: boolean;
  description?: string;
  bucket?: string; // Optionnel: bucket pour l'upload d'images
  onBgSave?: (url: string) => Promise<void> | void; // Optionnel: callback pour persister l'image
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
  // Start without a background to avoid showing a local fallback
  // while we are still resolving the DB-backed hero image.
  const [bg, setBg] = useState<string | undefined>(undefined);
  const { isAdmin } = useRoleCheck();
  // provide a fallback save for pages that don't pass `onBgSave`
  const { data: hero, isLoading: heroLoading, save: saveHero } = usePageHero(location.pathname);

  // Determine the background in a "user-first" way:
  // - If the DB has a hero.image_url -> use it immediately
  // - Otherwise, wait for the hero query to finish; only then use the provided fallback
  useEffect(() => {
    if (hero?.image_url) {
      setBg(hero.image_url);
      return;
    }
    if (!heroLoading) {
      // Only set the fallback when we know there is no user image
      setBg(backgroundImage);
    }
    // if hero is still loading, keep bg undefined (shows skeleton/gradient)
  }, [hero?.image_url, heroLoading, backgroundImage]);

  const handleBgSave = async (url: string) => {
    // Mettre à jour localement pour un rendu immédiat
    setBg(url);
    // Émettre un événement global que l'app peut écouter pour persistance
    try {
      const ev = new CustomEvent('hero-bg-changed', { detail: { path: location.pathname, url } });
      window.dispatchEvent(ev);
    } catch (e) {
      // noop
    }

    // Appeler le callback si fourni pour persister la donnée
    if (onBgSave) {
      await onBgSave(url);
    } else {
      // si la page n'a pas fourni de callback, sauvegarder dans la table page_hero_banners
      try {
        await saveHero(url);
      } catch (e) {
        // noop: on ne veut pas casser l'édition si la sauvegarde échoue
        // log pour debug
        // console.warn('Could not persist hero bg for path', location.pathname, e);
      }
    }
  };
  return (
    <section className="relative h-[30vh] md:h-[38vh] lg:h-[50vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {bg ? (
          <img
            src={bg}
            alt="Arrière-plan de la bannière"
            className="w-full h-full object-cover object-center"
            loading="eager"
            decoding="sync"
            width={1920}
            height={1080}
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

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Back Button */}
          {showBackButton && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate(-1)}
              className="mb-4 md:mb-6 inline-flex items-center gap-2 text-xs md:text-sm text-accent-foreground hover:text-accent-foreground transition-colors backdrop-blur-sm bg-accent/80 hover:bg-accent px-2 md:px-3 py-1.5 rounded-full border border-accent/50"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              Retour
            </motion.button>
          )}

          {/* Event Badge */}
          {eventTitle && eventDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 md:mb-6"
            >
              <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/30">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gold" />
                <span className="text-xs md:text-sm text-primary-foreground/90">
                  <strong>{eventTitle}</strong> • {eventDate}
                </span>
              </div>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-2 md:mb-4 drop-shadow-lg"
          >
            {title}
          </motion.h1>

          {/* Subtitle/Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm md:text-lg lg:text-xl text-primary-foreground/80 mb-4 md:mb-8 leading-relaxed max-w-2xl"
          >
            {description || subtitle}
          </motion.p>

          {/* CTA Buttons - Only show on homepage */}
          {subtitle && subtitle.includes("Découvrez") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-light text-secondary-foreground font-semibold shadow-glow"
              >
                <Link to="/videos">
                  Découvrir nos vidéos
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
              >
                <Link to="/evenements">Voir les événements</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"
      />
    </section>
  );
};

export default HeroBanner;
