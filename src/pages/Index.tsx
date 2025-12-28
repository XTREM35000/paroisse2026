import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";

const mockVideos = [
  { id: "1", title: "Messe du dimanche - Fête de la Réconciliation", thumbnail: "https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=600", duration: "1:23:45", views: 1250, category: "Messes", date: "Il y a 2 jours" },
  { id: "2", title: "Catéchèse - La prière du Notre Père en Dioula", thumbnail: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600", duration: "45:30", views: 890, category: "Catéchèse", date: "Il y a 5 jours" },
  { id: "3", title: "Concert Gospel - Chorale Espoir d'Afrique", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600", duration: "1:05:20", views: 2100, category: "Chorale", date: "Il y a 1 semaine" },
  { id: "4", title: "Homélie du Père Kouamé - L'espérance africaine", thumbnail: "https://images.unsplash.com/photo-1523803326055-13f1e653f650?w=600", duration: "18:45", views: 670, category: "Homélies", date: "Il y a 3 jours" },
];

const mockImages = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400", title: "Procession de la Toussaint", likes: 45, comments: 12 },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=400", title: "Baptême communautaire", likes: 78, comments: 8 },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?w=400", title: "Kermesse paroissiale", likes: 56, comments: 15 },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=400", title: "Veillée de prière", likes: 34, comments: 5 },
];

const mockEvents = [
  { id: "1", title: "Messe de Noël", description: "Célébration solennelle de la Nativité du Seigneur avec la chorale Espoir d'Afrique.", date: "2024-12-25", time: "22h00", location: "Église Notre Dame, Cocody", attendees: 350, imageUrl: "https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=600" },
  { id: "2", title: "Retraite spirituelle de l'Avent", description: "Week-end de recueillement et de préparation spirituelle au Centre Jean-Paul II.", date: "2024-12-21", time: "9h00 - 17h00", location: "Centre paroissial, Cocody", attendees: 75 },
];

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

      <main>
        {/* Hero Banner */}
        <HeroBanner
          title="Bienvenue à Notre Dame de la Réconciliation"
          subtitle="Une communauté vivante au cœur d'Abidjan, au service de la foi, de l'espérance et de la charité. Rejoignez-nous pour célébrer ensemble la Parole de Dieu."
          eventTitle="Messe de Noël"
          eventDate="25 décembre à 22h"
          backgroundImage="https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=1920"
        />

        {/* Featured Event */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Événement à venir"
              subtitle="Ne manquez pas nos prochaines célébrations"
              viewAllLink="/evenements"
            />
            <EventCard {...mockEvents[0]} featured />
          </div>
        </section>

        {/* Popular Videos */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Vidéos populaires"
              subtitle="Retrouvez nos dernières célébrations et enseignements"
              viewAllLink="/videos"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <VideoCard {...video} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Galerie photos"
              subtitle="Les moments forts de notre communauté"
              viewAllLink="/galerie"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockImages.map((image, i) => (
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
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Prochains événements"
              viewAllLink="/evenements"
            />
            <div className="grid md:grid-cols-2 gap-6">
              {mockEvents.map((event) => (
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
