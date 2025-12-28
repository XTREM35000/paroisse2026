import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";
import { useVideos } from "@/hooks/useVideos";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";

// Fallback images au cas où la galerie serait vide
const fallbackImages = [
  { id: "1", imageUrl: "/images/messe.png", title: "Procession de la Toussaint", likes: 45, comments: 12 },
  { id: "2", imageUrl: "/images/bapteme.png", title: "Baptême communautaire", likes: 78, comments: 8 },
  { id: "3", imageUrl: "/images/celebration.png", title: "Kermesse paroissiale", likes: 56, comments: 15 },
  { id: "4", imageUrl: "/images/prieres.png", title: "Veillée de prière", likes: 34, comments: 5 },
];

const mockEventsDefault = [
  { id: "1", title: "Messe de Noël", description: "Célébration solennelle de la Nativité du Seigneur avec la chorale Espoir d'Afrique.", date: "2024-12-25", time: "22h00", location: "Église Notre Dame, Cocody", attendees: 350, imageUrl: "/images/celebration.png" },
  { id: "2", title: "Retraite spirituelle de l'Avent", description: "Week-end de recueillement et de préparation spirituelle au Centre Jean-Paul II.", date: "2024-12-21", time: "9h00 - 17h00", location: "Centre paroissial, Cocody", attendees: 75 },
];

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { videos, loading: videosLoading } = useVideos(4);
  const { content: pageContent } = useHomepageContent();
  const { images: galleryImages, loading: galleryLoading } = useGalleryImages(4);
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(2);
  const [events, setEvents] = useState(mockEventsDefault);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Utiliser les événements du hook ou le fallback
  useEffect(() => {
    if (upcomingEvents && upcomingEvents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEvents(upcomingEvents as any);
    }
  }, [upcomingEvents]);

  const heroSection = pageContent.hero || {
    title: "Bienvenue à Notre Dame de la Réconciliation",
    subtitle: "Une communauté vivante au cœur d'Abidjan, au service de la foi, de l'espérance et de la charité. Rejoignez-nous pour célébrer ensemble la Parole de Dieu.",
    button_text: "Voir les horaires",
    button_link: "/evenements",
    image_url: "/images/noel.png"
  };

  // Utiliser les images de la galerie ou le fallback
  const displayImages = galleryImages && galleryImages.length > 0 ? galleryImages : fallbackImages;

  return (
    <div className="min-h-screen bg-background">
      <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

      <main>
        {/* Hero Banner */}
        <HeroBanner
          title={heroSection.title || "Bienvenue à Notre Dame de la Réconciliation"}
          subtitle={heroSection.subtitle || "Une communauté vivante..."}
          eventTitle="Messe de Noël"
          eventDate="25 décembre à 22h"
          backgroundImage={heroSection.image_url || "/images/celebration.png"} />

        {/* Featured Event */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent.featured_event_title?.title || "Événement à venir"}
              subtitle={pageContent.featured_event_title?.subtitle || "Ne manquez pas nos prochaines célébrations"}
              viewAllLink={pageContent.featured_event_title?.button_link || "/evenements"}
            />
            {events.length > 0 && <EventCard {...events[0]} featured />}
          </div>
        </section>

        {/* Popular Videos */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent.videos_title?.title || "Vidéos populaires"}
              subtitle={pageContent.videos_title?.subtitle || "Retrouvez nos dernières célébrations et enseignements"}
              viewAllLink={pageContent.videos_title?.button_link || "/videos"}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {videosLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : videos.length > 0 ? (
                videos.map((video, i) => (
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
                      thumbnail={video.thumbnail_url || "https://via.placeholder.com/400x300"}
                      duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : "0:00"}
                      views={video.views}
                      category={video.category || "Vidéo"}
                      date={new Date(video.created_at).toLocaleDateString('fr-FR')}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Aucune vidéo disponible pour le moment
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent.gallery_title?.title || "Galerie photos"}
              subtitle={pageContent.gallery_title?.subtitle || "Les moments forts de notre communauté"}
              viewAllLink={pageContent.gallery_title?.button_link || "/galerie"}
            />
            {galleryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayImages.map((image, i) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <GalleryCard {...image} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title={pageContent.events_title?.title || "Prochains événements"}
              viewAllLink={pageContent.events_title?.button_link || "/evenements"}
            />
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
