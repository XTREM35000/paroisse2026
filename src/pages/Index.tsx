/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, BookOpen, Bell, Heart } from "lucide-react";
import { useState, useEffect } from "react";

// Header/Footer provided by Layout
import HomepageHero from "@/components/HomepageHero";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";
// AuthModal is now controlled globally in Header
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import type { Video } from "@/types/database";
import EventDetailModal from '@/components/EventDetailModal';
import LiveHeroSection from "@/components/LiveHeroSection";
import { useEventModal } from '@/contexts/EventModalContext';
import { useParoisse } from '@/contexts/ParoisseContext';

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
  const { user } = useAuth();
  const { profile, isAdmin } = useUser();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id;
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [homilies, setHomilies] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loadingHomilies, setLoadingHomilies] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  
  // Déterminer le lien des événements selon le rôle
  const eventsLink = isAdmin ? '/admin/events' : '/evenements';

  // Get all dynamic content from the hook
  const {
    hero,
    latestPhotos,
    latestVideos,
    upcomingEvents,
    isLoading,
    sections,
  } = useHomepageContent();

  // Modal integration with route — use global EventModalContext
  const { open: openEventModal, close: closeEventModal, isOpen: isEventModalOpen } = useEventModal();
  const [modalOpenedByRoute, setModalOpenedByRoute] = useState(false);

  useEffect(() => {
    const match = location.pathname.match(/^\/evenements\/(.+)$/);
    if (match) {
      const target = match[1];
      if (!target || (typeof target === 'string' && target.trim() === '')) {
        console.warn('Index: matched /evenements/ route but slug is empty', { pathname: location.pathname });
        return;
      }
      // Open modal directly via context
      openEventModal(target);
      setModalOpenedByRoute(true);
    }
  }, [location.pathname, openEventModal]);

  // If modal was opened by route and then closed, navigate to listing
  useEffect(() => {
    if (!isEventModalOpen && modalOpenedByRoute) {
      navigate('/evenements');
      setModalOpenedByRoute(false);
    }
  }, [isEventModalOpen, modalOpenedByRoute, navigate]);


  
  const queryClient = useQueryClient();

  // Fetch homilies
  useEffect(() => {
    const fetchHomilies = async () => {
      try {
        let query = (supabase.from('homilies') as any)
          .select('id, title, priest_name, description, homily_date, video_url')
          .order('homily_date', { ascending: false })
          .limit(3);
        if (paroisseId) query = query.eq('paroisse_id', paroisseId);

        const { data, error } = await query;
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
  }, [paroisseId]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        let query = (supabase as any).from('announcements')
          .select('id, title, content, created_at, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (paroisseId) query = query.eq('paroisse_id', paroisseId);

        const { data, error } = await query;
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
  }, [paroisseId]);

  // Fetch prayers
  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        let query = (supabase as any).from('prayer_intentions')
          .select('id, title, content, category, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);
        if (paroisseId) query = query.eq('paroisse_id', paroisseId);

        const { data, error } = await query;
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
  }, [paroisseId]);

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

      {/* AuthModal moved à Header; aucun WelcomeModal global */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={closeVideoModal}
      />

      <main>
        {/* Hero Section - Dynamic from Database */}
        <HomepageHero data={hero} isLoading={isLoading} />

        {/* Live / Dernière vidéo mise en avant */}
        <LiveHeroSection
          latestVideos={latestVideos as any}
          onOpenVideo={(video) => handleVideoSelect(video as any)}
        />

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
                      onDeleted={() => { queryClient.invalidateQueries({ queryKey: ['homepage-videos'] }); }}
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
