import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ImageOff } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import type { HomepageSection } from '@/types/homepage';
import { Link } from 'react-router-dom';

const goldDonateButtonClass =
  'bg-gold hover:bg-gold-light text-secondary-foreground font-semibold shadow-glow';

function GoldDonateButton({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <Button asChild size={size} className={goldDonateButtonClass}>
      <Link to="/donate">Faire un don sécurisé</Link>
    </Button>
  );
}

interface HomepageHeroProps {
  data?: HomepageSection | null;
  isLoading?: boolean;
}

const HomepageHero = ({ data, isLoading }: HomepageHeroProps) => {
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
    // Fallback élégant quand la hero n'est pas configurée
    const { profile } = useUser();
    const isAdmin = !!(profile && profile.role && ['admin', 'super_admin', 'administrateur'].includes(String(profile.role).toLowerCase()));

    return (
      <section className="relative py-20 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="container mx-auto px-4 text-center py-16">
          <ImageOff className="w-24 h-24 mx-auto opacity-30 text-muted-foreground mb-4" />
          <h3 className="mt-4 text-2xl font-medium">Section principale en préparation</h3>
          <p className="text-muted-foreground mt-2">
            Le contenu principal n'a pas encore été configuré. Revenez bientôt ou configurez la page d'accueil.
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[13vh] md:min-h-[16vh] lg:min-h-[20vh] py-6 md:py-8 lg:py-10 bg-gradient-to-b from-primary/10 to-background overflow-hidden"
      style={
        data.image_url
          ? {
              backgroundImage: `url(${data.image_url})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* Overlay si image présente */}
      {data.image_url && (
        <div className="absolute inset-0 bg-black/50" />
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

              const cmsPointsToDonate =
                shouldOverrideToDonate || normalizedLink === '/donate';

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
