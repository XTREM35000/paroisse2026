import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import { useVideos } from '@/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VideoCategory {
  id: string;
  label: string;
  value: string;
}

const CATEGORIES: VideoCategory[] = [
  { id: 'all', label: 'Toutes', value: 'all' },
  { id: 'messes', label: 'Messes', value: 'Messes' },
  { id: 'catechese', label: 'Catéchèse', value: 'Catéchèse' },
  { id: 'chorale', label: 'Chorale', value: 'Chorale' },
  { id: 'homilies', label: 'Homélies', value: 'Homélies' },
];

const VideosPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { videos, loading } = useVideos(50, selectedCategory === 'all' ? undefined : selectedCategory);

  // Filtrer les vidéos par recherche
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const displayVideos = searchTerm ? filteredVideos : videos;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
      
     <HeroBanner
      title="Vidéos"
      subtitle="Parcourez tous nos enregistrements de célébrations, enseignements et moments de partage"
      showBackButton={true}
      backgroundImage="/images/messe.png"
    />

      <main className="flex-1">
        {/* Barre de recherche et filtres */}
        <section className="py-8 border-b border-border/50 bg-card/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto mb-8"
            >
              {/* Barre de recherche */}
              <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Chercher une vidéo..."
                  className="pl-10 h-12 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setSearchTerm('');
                  }}
                  className="transition-all"
                >
                  {cat.label}
                </Button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contenu principal */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayVideos.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  {displayVideos.length} vidéo{displayVideos.length > 1 ? 's' : ''}
                  {searchTerm && ` trouvée${displayVideos.length > 1 ? 's' : ''} pour "${searchTerm}"`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayVideos.map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <VideoCard
                        id={video.id}
                        title={video.title}
                        thumbnail={video.thumbnail_url || 'https://via.placeholder.com/400x300'}
                        duration={
                          video.duration
                            ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(
                                2,
                                '0'
                              )}`
                            : '0:00'
                        }
                        views={video.views}
                        category={video.category || 'Vidéo'}
                        date={new Date(video.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-lg text-muted-foreground">
                  {searchTerm
                    ? `Aucune vidéo trouvée pour "${searchTerm}".`
                    : 'Aucune vidéo disponible pour le moment.'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm('')}
                  >
                    Réinitialiser la recherche
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 lg:py-16 bg-muted/30 border-t border-border/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">{displayVideos.length}</p>
                <p className="text-muted-foreground mt-2">Vidéos {selectedCategory === 'all' ? 'disponibles' : 'de cette catégorie'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {displayVideos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-muted-foreground mt-2">Vues au total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {(
                    displayVideos.reduce((sum, v) => sum + (v.duration || 0), 0) / 3600
                  ).toFixed(1)}
                  <span className="text-lg">h</span>
                </p>
                <p className="text-muted-foreground mt-2">Contenu total</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VideosPage;
