/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, BookOpen, Bell, Heart } from "lucide-react";
import { useState, useEffect } from "react";

// Capture the pathname at module evaluation (i.e. initial page load)
const __INITIAL_PATHNAME = typeof window !== 'undefined' ? window.location.pathname : '/';
// Header/Footer provided by Layout
import HomepageHero from "@/components/HomepageHero";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";
// AuthModal is now controlled globally in Header
import VideoPlayerModal from "@/components/VideoPlayerModal";
import AdvertisementPopup from "@/components/AdvertisementPopup";
import WelcomeModal from "@/components/WelcomeModal";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import type { Video } from "@/types/database";
import EventDetailModal from '@/components/EventDetailModal';

// Pas de données mockées en dur pour la galerie — utiliser le contenu dynamique

function getYouTubeEmbedUrl(input?: string) {
  if (!input) return '';
  let id: string | null = null;
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
    // not a full URL
  }
  if (!id) {
    const m = input.match(/(?:v=|v\/|embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    if (m) id = m[1];
  }
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (input.includes('youtube.com/embed')) return input;
  return `https://www.youtube.com/embed/${input}`;
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { user } = useAuth();
  const { profile } = useUser();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [homilies, setHomilies] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loadingHomilies, setLoadingHomilies] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  
  // Déterminer le rôle de l'utilisateur
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  
  // Déterminer le lien des événements selon le rôle
  const eventsLink = isAdmin ? '/admin/events' : '/evenements';

  // Get latest advertisement early so effects can use it
  const { latestAd } = useAdvertisements();
  
  // 🔹 WELCOME MODAL LOGIC - Strict: show ONLY on real page load or reload AND if user is NOT logged in
  // Runs once on component mount; detection combines Performance API, referrer,
  // history length and sessionStorage. This reduces false positives on SPA navigation.
  useEffect(() => {
    const SESSION_KEY = 'homepage_popup_shown';

    try {
      const isOnHome = window.location.pathname === '/';
      if (!isOnHome) return;

      // Do not show welcome modal if user is already logged in
      if (user) {
        console.log('[WelcomeModal] User is logged in, skipping welcome modal');
        setShowWelcomeModal(false);
        return;
      }

      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const navEntry = navEntries && navEntries[0];
      const perfNav = (performance as unknown as Record<string, unknown>)?.navigation as Record<string, unknown> | undefined;
      const navType = navEntry?.type ?? (perfNav?.type === 1 ? 'reload' : 'navigate');
      const isReload = navType === 'reload';

      // If React Router reports a PUSH navigation (link click), do not show
      // Also skip POP (browser back/forward) when the app wasn't initially loaded on '/'
      if (navigationType === 'PUSH' || (navigationType === 'POP' && __INITIAL_PATHNAME !== '/')) {
        console.log('[WelcomeModal] Internal navigation (PUSH/POP) — skipping modal. navigationType=', navigationType);
        return;
      }

      const hasSeen = !!sessionStorage.getItem(SESSION_KEY);

      // Consider referrer: if empty or external, more likely a true direct access
      const isExternalReferrer = !document.referrer || !document.referrer.startsWith(window.location.origin);

      // Short history often means a direct tab open
      const isHistoryShort = window.history.length <= 1;

      const shouldShow = (
        // Always show on explicit reload
        isReload ||
        // Otherwise show only if not already seen AND likely a direct access
        (!hasSeen && (isExternalReferrer || isHistoryShort))
      );

      if (shouldShow) {
        console.log(`[WelcomeModal] Showing modal (navType=${navType}, referrer=${document.referrer || 'none'}, history=${window.history.length})`);
        setShowWelcomeModal(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
      } else {
        console.log(`[WelcomeModal] Not showing modal (navType=${navType}, hasSeen=${hasSeen}, referrer=${document.referrer || 'none'}, history=${window.history.length})`);
      }
    } catch (e) {
      console.error('[WelcomeModal] detection error', e);
    }
  }, [navigationType, user]);

  // Advertisement popup: show AFTER welcome modal is closed (not on initial load)
  // Only show if welcome modal has been closed and ad hasn't been seen
  useEffect(() => {
    if (!latestAd) return;

    try {
      const AD_SEEN_KEY = `ad-seen-${latestAd.id}`;
      const hasSeenAd = !!localStorage.getItem(AD_SEEN_KEY);

      // Do not show ad if welcome modal is still visible
      if (showWelcomeModal) {
        console.log('[AdvertisementPopup] Welcome modal is visible, delaying ad display');
        setShowAdPopup(false);
        return;
      }

      if (navigationType === 'PUSH' || (navigationType === 'POP' && __INITIAL_PATHNAME !== '/')) {
        console.log('[AdvertisementPopup] Internal navigation (PUSH/POP) — skipping ad modal. navigationType=', navigationType);
        setShowAdPopup(false);
        return;
      }

      // Show ad only after welcome modal is closed and if not seen
      if (!hasSeenAd && !showWelcomeModal) {
        setShowAdPopup(true);
      } else {
        setShowAdPopup(false);
      }
    } catch (e) {
      console.error('[AdvertisementPopup] detection error', e);
    }
  }, [latestAd, navigationType, showWelcomeModal]);
  
  const handleWelcomeModalClose = () => {
    console.log('[WelcomeModal] Modal closed by user. Advertisement can now be shown.');
    setShowWelcomeModal(false);
    // The advertisement will now show because showWelcomeModal is false
    // and the useEffect for advertisement will be triggered
  };

  const handleWelcomeOpenAuth = (mode: 'login' | 'register') => {
    console.log('[WelcomeModal] Opening auth modal with mode:', mode);
    // Use window.location.hash directly to trigger Header's useEffect
    window.location.hash = '#auth';
  };
  
  // Get all dynamic content from the hook
  const {
    hero,
    latestPhotos,
    latestVideos,
    upcomingEvents,
    isLoading,
    sections,
  } = useHomepageContent();

  // Modal for event detail when route contains /evenements/:slug
  const [modalEventSlug, setModalEventSlug] = useState<string | null>(null);
  const [isEventModalOpen, setEventModalOpen] = useState(false);

  useEffect(() => {
    const match = location.pathname.match(/^\/evenements\/(.+)$/);
    if (match) {
      setModalEventSlug(match[1]);
      setEventModalOpen(true);
    } else {
      setEventModalOpen(false);
      setModalEventSlug(null);
    }
  }, [location.pathname]);

  const closeEventModal = () => {
    // Close modal and navigate explicitly to the events listing page
    navigate('/evenements');
    setEventModalOpen(false);
    setModalEventSlug(null);
  };


  
  // Get latest advertisement (moved earlier)
  const queryClient = useQueryClient();
  // Debug: Log when latestAd changes
  useEffect(() => {
    if (latestAd) {
      console.log('Latest advertisement loaded:', latestAd.title);
    } else {
      console.log('No advertisement available');
    }
  }, [latestAd]);

  // Fetch homilies
  useEffect(() => {
    const fetchHomilies = async () => {
      try {
        const { data, error } = await (supabase.from('homilies') as any)
          .select('id, title, priest_name, description, homily_date, video_url')
          .order('homily_date', { ascending: false })
          .limit(3);
        if (error) {
          console.warn('Erreur homilies:', error);
        }
        console.log('Homilies fetched:', data);
        setHomilies(data || []);
      } catch (e) {
        console.error('Exception homilies:', e);
        setHomilies([]);
      } finally {
        setLoadingHomilies(false);
      }
    };
    fetchHomilies();
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await (supabase as any).from('announcements')
          .select('id, title, content, created_at, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (error) {
          console.warn('Erreur announcements:', error);
        }
        console.log('Announcements fetched:', data);
        setAnnouncements(data || []);
      } catch (e) {
        console.error('Exception announcements:', e);
        setAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // Fetch prayers
  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const { data, error } = await (supabase as any).from('prayer_intentions')
          .select('id, title, content, category, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);
        if (error) {
          console.warn('Erreur prayers:', error);
        }
        console.log('Prayers fetched:', data);
        setPrayers(data || []);
      } catch (e) {
        console.error('Exception prayers:', e);
        setPrayers([]);
      } finally {
        setLoadingPrayers(false);
      }
    };
    fetchPrayers();
  }, []);

  // Auth modal controlled centrally in Header; Index no longer renders AuthModal

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header provided by Layout */}

      {/* AuthModal moved to Header to avoid duplicate modals */}

      {/* Welcome Modal - Shows on initial page load */}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={handleWelcomeModalClose} 
          onOpenAuthModal={handleWelcomeOpenAuth}
        />
      )}

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={closeVideoModal}
      />

      <main>
        {/* Hero Section - Dynamic from Database */}
        <HomepageHero data={hero} isLoading={isLoading} />

        {/* Latest Advertisement Popup */}
        {latestAd && showAdPopup && (
          <AdvertisementPopup 
            ad={latestAd} 
            onClose={() => setShowAdPopup(false)} 
          />
        )}

        {/* Last Live Video Section */}
        {sections && sections.length > 0 && (() => {
          const liveSection = sections.find((s: any) => s.section_key === 'live_sections');

          if (liveSection && liveSection.content) {
            try {
              const parsed = typeof liveSection.content === 'string' ? JSON.parse(liveSection.content as string) : liveSection.content;
              const youtubeSection = Array.isArray(parsed) && parsed.find((s: any) => s.type === 'youtube');
              if (youtubeSection) {
                return (
                  <section className="py-12 lg:py-16">
                    <div className="container mx-auto px-4">
                      <SectionTitle
                        title="Dernière vidéo live"
                        subtitle="Retrouvez notre dernier moment en direct"
                        viewAllLink="/live"
                      />
                      <div className="relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl">
                        <iframe
                          src={getYouTubeEmbedUrl(youtubeSection.content)}
                          title={youtubeSection.title || 'Vidéo live'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    </div>
                  </section>
                );
              }
            } catch (e) {
              console.error('Error parsing live sections:', e);
            }
          }

          return null;
        })()}

        {/* Event detail modal opened from route */}
        {isEventModalOpen && modalEventSlug && (
          <EventDetailModal slugOrId={modalEventSlug} open={isEventModalOpen} onClose={closeEventModal} />
        )}

        {/* Photo Gallery Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Galerie photos"
              subtitle="Les moments forts de notre communauté"
              viewAllLink="/galerie"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(latestPhotos && latestPhotos.length > 0 ? latestPhotos : []).map((image, i) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GalleryCard image={image as any} onDeleted={() => queryClient.invalidateQueries({ queryKey: ['homepage-gallery'] })} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Videos Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Vidéos populaires"
              subtitle="Retrouvez nos dernières célébrations et enseignements"
              viewAllLink="/videos"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading && (!latestVideos || latestVideos.length === 0) ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (latestVideos && latestVideos.length > 0) ? (
                latestVideos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <VideoCard
                      video={video as any}
                      onOpen={() => handleVideoSelect(video as any)}
                      onDeleted={() => { /* Can refetch if needed */ }}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground mb-2 text-lg">Aucune vidéo disponible</div>
                  <p className="text-sm text-muted-foreground">Revenez plus tard pour découvrir nos dernières vidéos</p>
                </div>
              )}
            </div>
          </div>
        </section>

        

        {/* Upcoming Events Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Prochains événements"
              viewAllLink={eventsLink}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any) => {
                  const startDate = new Date(String(event.start_date || ''));
                  return (
                    <EventCard
                      key={String(event.id)}
                      id={String(event.id)}                      slug={String((event as any).slug || '')}                      title={String(event.title || '')}
                      description={String(event.description || '')}
                      date={String(event.start_date || '')}
                      time={startDate && !isNaN(startDate.getTime()) ? startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      location={String(event.location || 'À définir')}
                      attendees={0}
                      imageUrl={String(event.image_url || '')}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground mb-2 text-lg">Aucun événement à venir</div>
                  <p className="text-sm text-muted-foreground">Revenez bientôt pour voir nos prochains événements</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Homilies Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Homélies récentes"
              viewAllLink="/homilies"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingHomilies ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : homilies.length > 0 ? (
                homilies.map((homily, i) => (
                  <motion.div
                    key={homily.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/homilies`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{homily.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {homily.priest_name} • {homily.homily_date ? new Date(homily.homily_date).toLocaleDateString('fr-FR') : 'Date non disponible'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{homily.description}</p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucune homélie disponible</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Announcements Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Annonces"
              viewAllLink="/annonces"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingAnnouncements ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : announcements.length > 0 ? (
                announcements.map((announcement, i) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/annonces`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{announcement.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucune annonce disponible</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Prayers Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Prières"
              viewAllLink="/prayers"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingPrayers ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : prayers.length > 0 ? (
                prayers.map((prayer, i) => (
                  <motion.div
                    key={prayer.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/prayers`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{prayer.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{prayer.category || 'Prière'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{prayer.content}</p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucune prière disponible</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Video Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {/* AuthModal moved to Header */}
    </div>
  );
};

export default Index;
