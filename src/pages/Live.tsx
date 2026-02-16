import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Tv, Radio, PlayCircle, X } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import DraggableModal from '@/components/DraggableModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { fetchActiveLiveStream, type LiveStream } from '@/lib/supabase/mediaQueries';
import useLiveSession from '@/hooks/useLiveSession';
import useLiveStats from '@/hooks/useLiveStats';
import useLiveProviderSources from '@/hooks/useLiveProviderSources';
import LiveChatSidebar from '@/components/live/LiveChatSidebar';
import LiveProviderLinks from '@/components/live/LiveProviderLinks';
import { ProviderManager, type LiveStreamData } from '@/lib/providers';

const Live: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { toast } = useToast();

  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);

  // Refs pour gérer les intervals et éviter les rechargements
  const intervalRef = useRef<number | null>(null);
  const isPageVisibleRef = useRef(true);
  const hasInitialLoadRef = useRef(false);

  // Live session tracking (increments/decrements viewers)
  const liveSession = useLiveSession(liveStream?.id);
  const { stats: liveStats } = useLiveStats(liveStream?.id, 5000);
  const { sources: providerSources } = useLiveProviderSources(liveStream?.id);

  useEffect(() => {
    if (!liveStream?.id) return;

    if (isModalOpen) {
      liveSession.join();
    } else {
      liveSession.leave();
    }

    return () => {
      liveSession.leave();
    };
  }, [isModalOpen, liveStream?.id, liveSession]);

  // Load active live stream on mount ONLY - pas de reload au retour
  useEffect(() => {
    const loadLiveStream = async () => {
      try {
        const stream = await fetchActiveLiveStream();
        console.log('📡 Fetched live stream:', stream ? { id: stream.id, title: stream.title, provider: stream.provider, url: stream.stream_url?.substring(0, 80) } : 'null');
        if (stream) {
          // Normalize stream data with ProviderManager
          const normalized = ProviderManager.normalizeStream(stream as any);
          console.log('✨ Normalized stream:', { provider: normalized.provider, url: normalized.stream_url?.substring(0, 80) });
          setLiveStream(normalized as any);
        } else {
          setLiveStream(null);
        }
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

    // Charger SEULEMENT au premier mount
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      loadLiveStream();
    }

    // Setup polling interval - mais seulement si page visible
    const startPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        if (isPageVisibleRef.current) {
          loadLiveStream();
        }
      }, 30000);
    };

    // Listener pour visibilité page
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      console.log('📺 Page visibility:', isPageVisibleRef.current ? 'visible' : 'hidden');

      if (isPageVisibleRef.current) {
        // Page redevient visible : NE PAS recharger, juste reprendre le polling
        if (intervalRef.current === null) {
          startPolling();
        }
      } else {
        // Page cachée : arrêter le polling
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Démarrer le polling initial
    startPolling();

    // Ajouter le listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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
        title="TV Paroisse Direct"
        subtitle="Suivez nos célébrations et Radio Paroisse FM en temps réel"
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
                  Provider
                </p>
                <p className="font-semibold text-sm capitalize">
                  {liveStream.provider || 'unknown'}
                </p>
              </div>

              {liveStats && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Spectateurs
                  </p>
                  <p className="font-semibold text-sm">
                    {liveStats.viewers_count || 0} en direct
                  </p>
                </div>
              )}
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

      {/* Player Modal (Draggable) */}
      {liveStream && (
        <DraggableModal 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          dragHandleOnly={false} 
          verticalOnly={false} 
          draggableOnMobile={true} 
          initialY={80}
        >
          {/* Header (drag handle) */}
          <div 
            className="flex items-center justify-between px-6 py-4 bg-amber-900 text-white rounded-t-lg cursor-grab select-none" 
            data-drag-handle 
            role="button" 
            aria-label="Poignée de déplacement"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-start mr-2">
                <div className="w-16 h-1.5 bg-white/80 rounded-full shadow-sm mb-1" aria-hidden />
                <div className="text-xs text-white/90">Déplacer</div>
              </div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
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
              </h2>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Fermer le lecteur"
              className="text-white hover:opacity-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left: Player / Audio */}
              <div className="flex-1">
                {/* Multi-provider player using ProviderManager */}
                {ProviderManager.renderPlayer(liveStream as LiveStreamData, {
                  autoplay: true,
                  controls: true,
                })}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="rounded-lg bg-muted/50 p-4 flex-1">
                    <p className="text-sm text-muted-foreground">
                      {liveStream.stream_type === 'tv'
                        ? '✨ Profitez pleinement du direct. Pour une meilleure expérience, nous recommandons une connexion Internet stable.'
                        : '🎙️ Écoutez en direct. Vous pouvez mettre en pause et reprendre quand vous le souhaitez.'}
                    </p>
                  </div>

                  <div className="md:hidden">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowChatMobile((s) => !s)}
                    >
                      {showChatMobile ? 'Cacher le chat' : 'Afficher le chat'}
                    </Button>
                  </div>
                </div>

                {/* Provider Links Section - Afficher les liens fournisseurs */}
                <LiveProviderLinks sources={providerSources} />

                {/* Mobile chat */}
                {showChatMobile && (
                  <div className="mt-4 md:hidden">
                    <LiveChatSidebar liveId={liveStream.id} title={liveStream.title} />
                  </div>
                )}
              </div>

              {/* Right: Chat Sidebar (desktop) */}
              <div className="hidden md:block w-64">
                <LiveChatSidebar liveId={liveStream.id} title={liveStream.title} />
              </div> 
            </div>

            {/* Stats line with viewer count */}
            <div className="mt-4 flex items-center gap-3 text-muted-foreground text-sm">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block w-2 h-2 bg-red-500 rounded-full"
              />
              En direct • {liveStats?.viewers_count || 0} spectateur(s) • {liveStream.provider}
            </div>
          </div>
        </DraggableModal>
      )}
    </div>
  );
};

export default Live;
