import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Plus, Trash2, Edit2 } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import VideoCard from '@/components/VideoCard';
import VideoModalForm from '@/components/VideoModalForm';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import type { Video } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VideoCategory {
  id: string;
  label: string;
  value: string;
}

const CATEGORIES: VideoCategory[] = [
  { id: 'all', label: 'Toutes', value: 'all' },
  { id: 'sermon', label: 'Sermon', value: 'Sermon' },
  { id: 'musique', label: 'Musique', value: 'Musique' },
  { id: 'celebration', label: 'Célébration', value: 'Célébration' },
  { id: 'enseignement', label: 'Enseignement', value: 'Enseignement' },
  { id: 'temoignage', label: 'Témoignage', value: 'Témoignage' },
];

const VideosPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVideoForPlayback, setSelectedVideoForPlayback] = useState<Video | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useUser();
  const { videos, loading, createVideo, updateVideo, deleteVideo, refreshVideos } = useVideos(
    100,
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  const isAdmin = profile?.role === 'admin' || (user as any)?.user_metadata?.role === 'admin';
  console.debug('📹 VideosPage rendered:', { userId: user?.id, profileRole: profile?.role, authRole: (user as any)?.user_metadata?.role, isAdmin });

  // Filtrer les vidéos par recherche
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const displayVideos = searchTerm ? filteredVideos : videos;

  // Gestionnaire pour sauvegarder une vidéo (create ou update)
  const handleSaveVideo = async (videoData: Record<string, unknown>) => {
    try {
      setIsSaving(true);
      if (editingVideo) {
        await updateVideo(editingVideo.id as string, videoData);
      } else {
        await createVideo({
          ...videoData,
          created_at: new Date().toISOString(),
          views: 0,
        });
      }
      await refreshVideos?.();
    } finally {
      setIsSaving(false);
    }
  };

  // Gestionnaire pour supprimer une vidéo
  const handleDeleteVideo = async (videoId: string) => {
    try {
      setIsSaving(true);
      await deleteVideo(videoId);
      await refreshVideos?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (video?: Record<string, unknown>) => {
    console.debug('📹 Opening video modal', { video, isEditing: !!video });
    setEditingVideo(video || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.debug('📹 Closing video modal');
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const handleOpenPlayerModal = (video: Video) => {
    console.debug('📹 Opening player modal for video:', video.id);
    setSelectedVideoForPlayback(video);
    setIsPlayerModalOpen(true);
  };

  const handleClosePlayerModal = () => {
    console.debug('📹 Closing player modal');
    setIsPlayerModalOpen(false);
    setSelectedVideoForPlayback(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Vidéos"
        subtitle="Parcourez tous nos enregistrements de célébrations, enseignements et moments de partage"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
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
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Chercher une vidéo..."
                    className="pl-10 h-12 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  className="gap-2 h-12" 
                  onClick={() => {
                    if (!user) {
                      console.debug('❌ User not authenticated');
                      return;
                    }
                    handleOpenModal();
                  }}
                  disabled={!user}
                  title={!user ? 'Connectez-vous pour ajouter une vidéo' : 'Ajouter une nouvelle vidéo'}
                >
                  <Plus className="h-5 w-5" />
                  Ajouter une vidéo
                </Button>
              </div>
            </motion.div>

            <div className="flex items-center justify-between">
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
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground mb-6"
                >
                  {displayVideos.length} vidéo{displayVideos.length > 1 ? 's' : ''}
                  {searchTerm && ` trouvée${displayVideos.length > 1 ? 's' : ''} pour "${searchTerm}"`}
                </motion.p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {displayVideos.map((video, i) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="relative group"
                      >
                        <VideoCard
                          video={video}
                          onOpen={() => handleOpenPlayerModal(video)}
                          onDeleted={() => refreshVideos?.()}
                        />
                        {!video.published && (
                          <Badge variant="secondary" className="absolute top-2 right-2 z-5">
                            Brouillon
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-lg text-muted-foreground mb-4">
                  {searchTerm
                    ? `Aucune vidéo trouvée pour "${searchTerm}".`
                    : 'Aucune vidéo disponible pour le moment.'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Réinitialiser la recherche
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </section>
        <section className="py-12 lg:py-16 bg-muted/30 border-t border-border/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {displayVideos.length}
                </p>
                <p className="text-muted-foreground mt-2">
                  Vidéos {selectedCategory === 'all' ? 'disponibles' : 'de cette catégorie'}
                </p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {displayVideos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-muted-foreground mt-2">Vues au total</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {(displayVideos.reduce((sum, v) => sum + (v.duration || 0), 0) / 3600).toFixed(
                    1
                  )}
                  <span className="text-lg">h</span>
                </p>
                <p className="text-muted-foreground mt-2">Contenu total</p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Modal de gestion vidéo */}
      <VideoModalForm
        open={isModalOpen}
        onClose={handleCloseModal}
        editingVideo={editingVideo}
        onSave={handleSaveVideo}
        onDelete={handleDeleteVideo}
        isLoading={isSaving}
      />

      {/* Modal de lecteur vidéo */}
      <VideoPlayerModal
        video={selectedVideoForPlayback}
        isOpen={isPlayerModalOpen}
        onClose={handleClosePlayerModal}
      />

      {/* Footer provided by Layout */}
    </div>
  );
};

export default VideosPage;
