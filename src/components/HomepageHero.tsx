import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ImageOff } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import usePageHero from '@/hooks/usePageHero';
import type { HomepageSection } from '@/types/homepage';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getHomepageSlideshowImageUrls,
  normalizeDisplayDurationSeconds,
  normalizeTransitionType,
} from '@/lib/pageHeroImages';

const goldDonateButtonClass =
  'bg-gold hover:bg-gold-light text-secondary-foreground font-semibold shadow-glow';

function GoldDonateButton({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <Button asChild size={size} className={goldDonateButtonClass}>
      <Link to="/donate">Faire un don sécurisé</Link>
    </Button>
  );
}

const HOMEPAGE_BANNER_PATH = '/';

interface HomepageHeroProps {
  data?: HomepageSection | null;
  isLoading?: boolean;
}

const HomepageHero = ({ data, isLoading }: HomepageHeroProps) => {
  const { profile } = useUser();
  const isAdmin = !!(
    profile &&
    profile.role &&
    ['admin', 'super_admin', 'administrateur'].includes(String(profile.role).toLowerCase())
  );

  const { data: homeBanner, isLoading: homeBannerLoading } = usePageHero(HOMEPAGE_BANNER_PATH);

  const slides = useMemo(() => {
    if (!data) return [];
    if (homeBannerLoading && homeBanner === undefined) {
      const legacy = data.image_url?.trim();
      return legacy ? [legacy] : [];
    }
    return getHomepageSlideshowImageUrls(homeBanner ?? null, data.image_url);
  }, [homeBanner, homeBannerLoading, data]);

  const transitionStyle = normalizeTransitionType(homeBanner?.transition_type);
  const dwellMs = normalizeDisplayDurationSeconds(homeBanner?.display_duration) * 1000;

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    setSlideIndex(0);
  }, [slides.join('|')]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, dwellMs);
    return () => window.clearInterval(id);
  }, [slides.length, dwellMs]);

  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="container mx-auto px-4 text-center py-16">
          <div className="h-8 bg-muted rounded animate-pulse mb-4 w-3/4 mx-auto" />
          <div className="h-6 bg-muted rounded animate-pulse mb-6 w-2/3 mx-auto" />
          <div className="h-4 bg-muted rounded animate-pulse w-full max-w-2xl mx-auto" />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="relative py-20 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="container mx-auto px-4 text-center py-16">
          <ImageOff className="w-24 h-24 mx-auto opacity-30 text-muted-foreground mb-4" />
          <h3 className="mt-4 text-2xl font-medium">Section principale en préparation</h3>
          <p className="text-muted-foreground mt-2">
            Le contenu principal n'a pas encore été configuré. Revenez bientôt ou configurez la page
            d'accueil.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <GoldDonateButton size="lg" />
          </div>
          {isAdmin && (
            <div className="mt-4">
              <Button asChild>
                <a href="/admin/homepage">Configurer la page d'accueil</a>
              </Button>
            </div>
          )}
        </div>
      </section>
    );
  }

  const showImageLayer = slides.length > 0;
  const isSlideTransition = transitionStyle === 'slide';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[300px] md:min-h-[360px] lg:min-h-[420px] py-6 md:py-8 lg:py-10 bg-gradient-to-b from-primary/10 to-background overflow-hidden"
    >
      {showImageLayer && slides.length === 1 && (
        <>
          <img
            src={slides[0]}
            alt=""
            className="absolute inset-0 block w-full h-full object-fill object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      {showImageLayer && slides.length > 1 && (
        <>
          <div className="absolute inset-0">
            {slides.map((src, idx) => {
              const active = idx === slideIndex;
              return (
                <motion.img
                  key={`${src}-${idx}`}
                  src={src}
                  alt=""
                  className="absolute inset-0 block w-full h-full object-fill object-center"
                  initial={false}
                  animate={{
                    opacity: active ? 1 : 0,
                    scale: 1,
                  }}
                  transition={{ duration: isSlideTransition ? 0.5 : 0.6, ease: 'easeInOut' }}
                />
              );
            })}
          </div>
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center pt-2 md:pt-4 lg:pt-6 pb-8 md:pb-12 lg:pb-16"
        >
          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs md:text-sm lg:text-base font-bold text-black bg-white px-3 py-1 inline-block mb-2 md:mb-4 uppercase tracking-wider"
            >
              {data.subtitle}
            </motion.p>
          )}

          {data.title && (
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6 lg:mb-8 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            >
              {data.title}
            </motion.h1>
          )}

          {data.content && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm md:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto mb-4 md:mb-6 lg:mb-8 leading-relaxed"
            >
              {data.content}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center items-center"
          >
            {(() => {
              const rawText = String(data.button_text ?? '');
              const rawLink = String(data.button_link ?? '');
              const normalizedLink = rawLink.replace(/\/$/, '');
              const shouldOverrideToDonate =
                normalizedLink === '/events' ||
                normalizedLink === '/evenements' ||
                rawText.toLowerCase().includes('voir tous les événements') ||
                rawText.toLowerCase().includes('voir tous les evenements');

              const cmsPointsToDonate = shouldOverrideToDonate || normalizedLink === '/donate';

              const showCmsButton = !!(data.button_text && data.button_link);
              const href = shouldOverrideToDonate ? '/donate' : rawLink;
              const text = shouldOverrideToDonate ? 'Faire un don sécurisé' : rawText;
              const isExternal = /^https?:\/\//i.test(href);
              const isInternal = href.startsWith('/');

              return (
                <>
                  {showCmsButton && !cmsPointsToDonate && (
                    <Button
                      asChild
                      size="sm"
                      className="rounded-lg px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg font-semibold md:size-lg"
                    >
                      {isExternal ? (
                        <a href={href}>{text}</a>
                      ) : isInternal ? (
                        <Link to={href}>{text}</Link>
                      ) : (
                        <a href={href}>{text}</a>
                      )}
                    </Button>
                  )}
                  <GoldDonateButton size="lg" />
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HomepageHero;
