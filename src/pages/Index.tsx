import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
// Header/Footer provided by Layout
import HeroBanner from "@/components/HeroBanner";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";
import AuthModal from "@/components/AuthModal";
import { useVideos } from "@/hooks/useVideos";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { useAuth } from "@/hooks/useAuth";

// Fallback images au cas où la galerie serait vide
const fallbackImages = [
  { id: "1", image_url: "/images/gallery/gallery-1.png", imageUrl: "/images/gallery/gallery-1.png", title: "Procession de la Toussaint", description: "Moment solennel", likes: 45, comments: 12 },
  { id: "2", image_url: "/images/gallery/gallery-2.png", imageUrl: "/images/gallery/gallery-2.png", title: "Baptême communautaire", description: "Nouvelle vie en Christ", likes: 78, comments: 8 },
  { id: "3", image_url: "/images/gallery/gallery-3.png", imageUrl: "/images/gallery/gallery-3.png", title: "Kermesse paroissiale", description: "Communion fraternelle", likes: 56, comments: 15 },
  { id: "4", image_url: "/images/gallery/gallery-4.png", imageUrl: "/images/gallery/gallery-4.png", title: "Veillée de prière", description: "Moment de recueillement", likes: 34, comments: 5 },
];

// Données mockées pour les vidéos
const mockVideosDefault = [
  { 
    id: "1", 
    title: "Sermon du Dimanche - La Miséricorde Divine", 
    description: "Message inspirant sur le pardon et la grâce divine",
    thumbnail_url: "/images/videos/messe.png", 
    duration: 1800, 
    views: 1245, 
    category: "Sermon",
    created_at: "2024-01-15" 
  },
  { 
    id: "2", 
    title: "Chants liturgiques de Noël", 
    description: "Célébration musicale de la Nativité",
    thumbnail_url: "/images/videos/noel.png", 
    duration: 2400, 
    views: 876, 
    category: "Musique",
    created_at: "2024-01-14" 
  },
  { 
    id: "3", 
    title: "Messe solennelle de Pâques", 
    description: "Cérémonie traditionnelle de résurrection",
    thumbnail_url: "/images/videos/celebration.png", 
    duration: 3600, 
    views: 2103, 
    category: "Célébration",
    created_at: "2024-01-13" 
  },
  { 
    id: "4", 
    title: "Conférence spirituelle", 
    description: "Enseignements pour une vie meilleure",
    thumbnail_url: "/images/videos/prieres.png", 
    duration: 1500, 
    views: 654, 
    category: "Enseignement",
    created_at: "2024-01-12" 
  },
];

const mockEventsDefault = [
  { 
    id: "1", 
    title: "Messe de noël", 
    description: "Célébration solennelle de la Nativité du Seigneur avec la chorale Espoir d'Afrique.", 
    date: "2024-12-25", 
    time: "22h00", 
    location: "Paroisse", 
    attendees: 350, 
    imageUrl: "/images/events/messe.png" 
  },
  { 
    id: "2", 
    title: "Retraite spirituelle de l'Avent", 
    description: "Week-end de recueillement et de préparation spirituelle au Centre Jean-Paul II.", 
    date: "2024-12-21", 
    time: "9h00 - 17h00", 
    location: "Paroisse", 
    attendees: 75,
    imageUrl: "/images/events/bapteme.png"
  },
];

const Index = () => {
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { videos, loading: videosLoading } = useVideos(4);
  const { content: pageContent } = useHomepageContent();
  const { images: galleryImages, loading: galleryLoading } = useGalleryImages(4);
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(2);
  const [events, setEvents] = useState(mockEventsDefault);
  type VideoItem = {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string | null;
    duration?: number | null;
    views?: number;
    category?: string;
    created_at?: string;
  };

  const [displayVideos, setDisplayVideos] = useState<VideoItem[]>([]);
  
  // Initialiser avec des vidéos mockées si aucune API
  useEffect(() => {
    if (videos && videos.length > 0) {
      setDisplayVideos(videos);
    } else {
      setDisplayVideos(mockVideosDefault as unknown as VideoItem[]);
    }
  }, [videos]);

  // Déterminer si le modal doit être ouvert basé sur le hash
  const isAuthModalOpen = location.hash === "#auth";
  const authMode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";

  const closeAuthModal = () => {
    navigate(location.pathname, { replace: true });
  };

  const openAuthModal = (mode: "login" | "register") => {
    if (mode === "register") {
      navigate("/?mode=register#auth", { replace: true });
    } else {
      navigate("#auth", { replace: true });
    }
  };

  

  // Utiliser les événements du hook ou le fallback
  useEffect(() => {
    if (upcomingEvents && upcomingEvents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvents(upcomingEvents as any);
    }
  }, [upcomingEvents]);

  const heroSection = pageContent?.hero || {
    title: "Bienvenue à Notre Dame de la Compassion",
    subtitle: "Une communauté vivante au cœur d'Abidjan, au service de la foi, de l'espérance et de la charité. Rejoignez-nous pour célébrer ensemble la Parole de Dieu.",
    button_text: "Voir les horaires",
    button_link: "/evenements",
    image_url: "/images/messe.png"
  };

  // Utiliser les images de la galerie ou le fallback
  const displayImages = galleryImages && galleryImages.length > 0 ? galleryImages : fallbackImages;

  return (
    <div className="min-h-screen bg-background">
      {/* Header provided by Layout */}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultMode={authMode}
      />

      <main>
        {/* Hero Banner */}
        <HeroBanner
          title={heroSection.title || "Bienvenue à Notre Dame de la Compassion"}
          subtitle={heroSection.subtitle || "Une communauté vivante..."}
          eventTitle="Réveillon de la paroisse"
          eventDate="31 décembre à partir de 22h"
          backgroundImage={heroSection.image_url || "/images/bapteme.png"} />

        {/* Galerie photos (remplacé à la place de "Événement à venir") */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Galerie photos"
              subtitle="Les moments forts de notre communauté"
              viewAllLink="/galerie"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayImages.map((image, i) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GalleryCard
                    id={image.id}
                    imageUrl={image.imageUrl}
                    image_url={image.image_url}
                    title={image.title}
                    description={image.description}
                    likes={image.likes}
                    comments={image.comments}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Videos */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent?.videos_title?.title || "Vidéos populaires"}
              subtitle={pageContent?.videos_title?.subtitle || "Retrouvez nos dernières célébrations et enseignements"}
              viewAllLink={pageContent?.videos_title?.button_link || "/videos"}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {videosLoading && displayVideos.length === 0 ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayVideos.length > 0 ? (
                displayVideos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <VideoCard
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      thumbnail={video.thumbnail_url || "/images/videos/default-thumbnail.jpg"}
                      duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : "0:00"}
                      views={video.views}
                      category={video.category || "Vidéo"}
                      date={new Date(video.created_at).toLocaleDateString('fr-FR')}
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

        

        {/* Upcoming Events */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent?.events_title?.title || "Prochains événements"}
              viewAllLink={pageContent?.events_title?.button_link || "/evenements"}
            />
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer provided by Layout */}
    </div>
  );
};

export default Index;
