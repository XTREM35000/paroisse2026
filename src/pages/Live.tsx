import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tv, Radio, PlayCircle, X } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { fetchActiveLiveStream, type LiveStream } from '@/lib/supabase/mediaQueries';

/**
 * Extract YouTube ID from various URL formats
 */
function getYouTubeId(input: string): string {
  if (!input) return '';

  let id: string | null = null;

  // Try URL parsing first
  try {
    const url = new URL(input);
    const host = url.hostname.replace('www.', '');

    if (host.includes('youtube.com')) {
      if (url.pathname.includes('/embed/')) {
        id = url.pathname.split('/embed/')[1].split('/')[0];
      } else {
        id = url.searchParams.get('v');
      }
    } else if (host === 'youtu.be') {
      id = url.pathname.replace('/', '');
    }
  } catch (e) {
    // Not a full URL, try regex
  }

  // Try regex if no ID yet
  if (!id) {
    const match = input.match(/(?:v=|v\/|embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    if (match) id = match[1];
  }

  // If still no ID and input looks like an ID, use it directly
  if (!id && /^[A-Za-z0-9_-]{11}$/.test(input)) {
    id = input;
  }

  return id || '';
}

const Live: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { toast } = useToast();

  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load active live stream on mount
  useEffect(() => {
    const loadLiveStream = async () => {
      try {
        const stream = await fetchActiveLiveStream();
        setLiveStream(stream);
      } catch (error) {
        console.error('Error loading live stream:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le direct',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadLiveStream();

    // Refresh every 30 seconds to check for stream changes
    const interval = setInterval(loadLiveStream, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleWatchLive = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour accéder au direct',
        variant: 'destructive',
      });
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Diffusion En Direct"
        subtitle="Suivez nos célébrations et podcasts en temps réel"
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          // Loading State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement du direct...</p>
            </div>
          </motion.div>
        ) : liveStream ? (
          // Active Live Stream
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Live Banner */}
            <div className="relative overflow-hidden rounded-lg border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* Animated live indicator */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-4 h-4 bg-red-500 rounded-full"
                />
                <span className="text-sm font-bold text-red-500 uppercase tracking-wider">
                  ● En Direct Maintenant
                </span>
              </div>

              <h2 className="text-3xl font-bold text-foreground mb-2">{liveStream.title}</h2>
              <p className="text-muted-foreground mb-6">
                {liveStream.stream_type === 'tv'
                  ? '📺 Regardez notre célébration en direct'
                  : '🎙️ Écoutez notre podcast en direct'}
              </p>

              <Button
                onClick={handleWatchLive}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                {liveStream.stream_type === 'tv'
                  ? 'Regarder le Direct'
                  : 'Écouter le Direct'}
              </Button>

              {!user && (
                <p className="text-sm text-muted-foreground mt-4">
                  💡 Vous devez être connecté pour accéder au direct
                </p>
              )}
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {liveStream.stream_type === 'tv' ? (
                    <Tv className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Radio className="w-5 h-5 text-green-500" />
                  )}
                  <span className="text-sm font-semibold text-muted-foreground uppercase">
                    Type
                  </span>
                </div>
                <p className="font-semibold">
                  {liveStream.stream_type === 'tv' ? 'TV - Célébration' : 'Radio - Podcast'}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Démarré le
                </p>
                <p className="font-semibold text-sm">
                  {new Date(liveStream.created_at).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Information section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">À propos de ce direct</h3>
              <div className="space-y-2 text-muted-foreground">
                {liveStream.stream_type === 'tv' ? (
                  <>
                    <p>✨ Participez à notre célébration en direct depuis le confort de votre domicile</p>
                    <p>🙏 Un moment de recueillement et de prière en communauté</p>
                    <p>📱 Accessible sur tous vos appareils (téléphone, tablette, ordinateur)</p>
                  </>
                ) : (
                  <>
                    <p>🎙️ Écoutez notre podcast en direct</p>
                    <p>💬 Recevez les dernières nouvelles et enseignements de notre paroisse</p>
                    <p>📱 Disponible sur tous vos appareils</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          // No Active Live Stream
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mx-auto mb-6"
            >
              <Tv className="w-16 h-16 text-muted-foreground opacity-50 mx-auto" />
            </motion.div>

            <h2 className="text-3xl font-bold text-foreground mb-3">
              Aucun direct en ce moment
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Les directs sont programmés selon notre calendrier paroissial.
              Revenez bientôt pour suivre nos prochaines célébrations !
            </p>

            {/* Schedule preview */}
            <div className="rounded-lg border border-border bg-card p-6 max-w-md mx-auto">
              <h3 className="font-semibold mb-4 text-foreground">Nos prochains directs</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3 pb-3 border-b border-border">
                  <Tv className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Dimanche 1er février</p>
                    <p className="text-sm text-muted-foreground">10:00 - Messe Solennelle</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Radio className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Mardi 3 février</p>
                    <p className="text-sm text-muted-foreground">18:00 - Podcast Hebdomadaire</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Abonnez-vous à nos notifications pour ne rien manquer 🔔
            </p>
          </motion.div>
        )}
      </div>

      {/* Player Modal */}
      {liveStream && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-full max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {liveStream.stream_type === 'tv' ? (
                  <>
                    <Tv className="w-5 h-5 text-blue-500" />
                    Regarder en direct
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 text-green-500" />
                    Écouter en direct
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="w-full space-y-4">
              {liveStream.stream_type === 'tv' ? (
                // YouTube Player for TV
                <div className="w-full bg-black rounded-lg overflow-hidden">
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeId(liveStream.stream_url)}?autoplay=1&rel=0&modestbranding=1`}
                      title={liveStream.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                </div>
              ) : (
                // Audio Player for Radio
                <div className="w-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-8 flex flex-col items-center justify-center">
                  <Radio className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {liveStream.title}
                  </h3>
                  <audio
                    controls
                    autoPlay
                    className="w-full mt-4"
                    style={{
                      filter:
                        'sepia(20%) hue-rotate(10deg) saturate(1.2) brightness(1.1)',
                    }}
                  >
                    <source src={liveStream.stream_url} type="audio/mpeg" />
                    Votre navigateur ne supporte pas le lecteur audio.
                  </audio>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    En direct maintenant • {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {liveStream.stream_type === 'tv'
                    ? '✨ Profitez pleinement du direct. Pour une meilleure expérience, nous recommandons une connexion Internet stable.'
                    : '🎙️ Écoutez en direct. Vous pouvez mettre en pause et reprendre quand vous le souhaitez.'}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Live;
