import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface NewVideo {
  title: string;
  description: string;
  category: string;
  duration: number;
  thumbnail_url: string;
  published?: boolean;
}

const VideosPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<NewVideo>({
    title: '',
    description: '',
    category: 'Sermon',
    duration: 0,
    thumbnail_url: '',
    published: true,
  });
  const { user } = useAuth();
  const { videos, loading, createVideo, updateVideo, deleteVideo } = useVideos(
    100,
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filtrer les vidéos par recherche
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const displayVideos = searchTerm ? filteredVideos : videos;

  // Gestionnaires CRUD
  const handleAddVideo = async () => {
    if (!newVideo.title.trim() || !newVideo.category) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      await createVideo({
        title: newVideo.title,
        description: newVideo.description,
        category: newVideo.category,
        duration: newVideo.duration,
        thumbnail_url: newVideo.thumbnail_url || '/images/videos/default-thumbnail.jpg',
        created_at: new Date().toISOString(),
        views: 0,
      } as NewVideo);

      setNewVideo({
        title: '',
        description: '',
        category: 'Sermon',
        duration: 0,
        thumbnail_url: '',
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vidéo:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      try {
        await deleteVideo(videoId);
      } catch (error) {
        console.error('Erreur lors de la suppression de la vidéo:', error);
      }
    }
  };

  const handleToggleVisibility = async (videoId: string, currentVideo: NewVideo) => {
    try {
      await updateVideo(videoId, {
        ...currentVideo,
        description: currentVideo.description || '',
        published: !currentVideo.published,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la vidéo:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

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
              {/* Barre de recherche et bouton d'ajout */}
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
                {isAdmin && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 h-12">
                        <Plus className="h-5 w-5" />
                        Ajouter une vidéo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Ajouter une nouvelle vidéo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium">
                            Titre *
                          </Label>
                          <Input
                            id="title"
                            placeholder="Titre de la vidéo"
                            value={newVideo.title}
                            onChange={(e) =>
                              setNewVideo({ ...newVideo, title: e.target.value })
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-sm font-medium">
                            Description
                          </Label>
                          <Input
                            id="description"
                            placeholder="Description brève"
                            value={newVideo.description}
                            onChange={(e) =>
                              setNewVideo({ ...newVideo, description: e.target.value })
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category" className="text-sm font-medium">
                            Catégorie *
                          </Label>
                          <Select
                            value={newVideo.category}
                            onValueChange={(value) =>
                              setNewVideo({ ...newVideo, category: value })
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.filter((cat) => cat.value !== 'all').map((cat) => (
                                <SelectItem key={cat.id} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="duration" className="text-sm font-medium">
                            Durée (secondes)
                          </Label>
                          <Input
                            id="duration"
                            type="number"
                            placeholder="0"
                            value={newVideo.duration}
                            onChange={(e) =>
                              setNewVideo({
                                ...newVideo,
                                duration: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="thumbnail" className="text-sm font-medium">
                            URL vignette
                          </Label>
                          <Input
                            id="thumbnail"
                            placeholder="/images/videos/..."
                            value={newVideo.thumbnail_url}
                            onChange={(e) =>
                              setNewVideo({
                                ...newVideo,
                                thumbnail_url: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleAddVideo}>Ajouter</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
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
                          id={video.id}
                          title={video.title}
                          description={video.description}
                          thumbnail={
                            video.thumbnail_url || '/images/videos/default-thumbnail.jpg'
                          }
                          duration={
                            video.duration
                              ? `${Math.floor(video.duration / 60)}:${String(
                                  video.duration % 60
                                ).padStart(2, '0')}`
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
                        {/* Admin actions overlay */}
                        {isAdmin && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/70 rounded-lg p-3 flex flex-col gap-2 justify-end z-10"
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-2"
                              onClick={() =>
                                handleToggleVisibility(video.id, {
                                  ...video,
                                  description: video.description || '',
                                } as NewVideo)
                              }
                            >
                              {(video as NewVideo).published ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Masquer
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Afficher
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => handleDeleteVideo(video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </Button>
                          </motion.div>
                        )}
                        {!(video as NewVideo).published && (
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
                  <Button
                    variant="outline"
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

      <Footer />
    </div>
  );
};

export default VideosPage;
