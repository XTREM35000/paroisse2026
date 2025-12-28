import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import EventCard from "@/components/EventCard";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  imageUrl?: string;
  category?: string;
  featured?: boolean;
}

const EventsPage = () => {
  const { events, loading } = useUpcomingEvents(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set((events as Event[])?.map((evt) => evt.category).filter(Boolean) ?? [])
      ).sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return (events as Event[]).filter((evt) => {
      const matchesSearch =
        (evt.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (evt.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || evt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header darkMode={false} toggleDarkMode={() => {}} />
      
      <HeroBanner
        title="Événements"
        subtitle="Retrouvez tous nos événements et activités paroissiales"
        showBackButton={true}
        backgroundImage="/images/messe.png"
      />

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-muted/30"
            />
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Tous
              </motion.button>
              {categories.map((cat: string) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  attendees={event.attendees || 0}
                  imageUrl={event.imageUrl}
                  featured={event.featured}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              Aucun événement trouvé
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
