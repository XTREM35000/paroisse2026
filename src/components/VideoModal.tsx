import { X, Upload, Link as LinkIcon, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/hooks/useAuthContext';
import { createVideo } from '@/lib/supabase/videoQueries';
import { useToast } from '@/hooks/use-toast';
import type { Video } from '@/types/database';
import DraggableModal from './DraggableModal';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  onVideoAdded?: () => void;
}

type TabType = 'url' | 'details';

const VideoModal: React.FC<VideoModalProps> = ({ open, onClose, onVideoAdded }) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [isLoading, setIsLoading] = useState(false);


  // États du formulaire
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const resetForm = () => {
    setVideoUrl('');
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setActiveTab('url');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddVideo = async () => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Vous devez être connecté pour ajouter une vidéo',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      });
      return;
    }

    if (!videoUrl.trim()) {
      toast({
        title: 'Erreur',
        description: 'L\'URL de la vidéo est requise',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newVideo: Partial<Video> = {
        title: title.trim(),
        description: description.trim() || null,
        url: videoUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        user_id: user.id,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await createVideo(newVideo);

      if (result) {
        toast({
          title: 'Succès',
          description: 'Vidéo ajoutée avec succès',
        });
        resetForm();
        handleClose();
        onVideoAdded?.();
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'ajouter la vidéo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout de la vidéo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <DraggableModal
      open={open}
      onClose={handleClose}
      draggableOnMobile={true}
      dragHandleOnly={false}
      verticalOnly={false}
      center={true}
      maxWidthClass="max-w-2xl"
      title="Ajouter une vidéo"
    >
      <div className="bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Tabs */}
              <div className="border-b border-border flex">
                <button
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 px-6 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === 'url'
                      ? 'border-amber-900 text-amber-900'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Lien vidéo
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-6 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === 'details'
                      ? 'border-amber-900 text-amber-900'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Détails
                  </div>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {activeTab === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">URL de la vidéo</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=... ou https://yourdomain.com/video.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Accepte les liens YouTube, Vimeo ou tout fichier vidéo hébergé
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">URL de la miniature (optionnel)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Image d'aperçu de la vidéo
                      </p>
                    </div>

                    {videoUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border border-border rounded-lg overflow-hidden bg-background/50"
                      >
                        <div className="aspect-video bg-black/20 flex items-center justify-center">
                          {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Aperçu YouTube</p>
                            </div>
                          ) : (
                            <video
                              src={videoUrl}
                              controls
                              className="w-full h-full object-cover"
                              onError={() => {
                                toast({
                                  title: 'Erreur',
                                  description: 'Impossible de charger la vidéo',
                                  variant: 'destructive',
                                });
                              }}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Titre <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Messe du dimanche - 2 janvier 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {title.length}/200 caractères
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        placeholder="Décrivez le contenu de cette vidéo..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1000}
                        rows={5}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {description.length}/1000 caractères
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Footer */}
              <div className="border-t border-border bg-background/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-foreground/5 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={isLoading || !videoUrl.trim() || !title.trim()}
                  className="px-6 py-2 rounded-lg bg-amber-900 text-white hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Ajouter la vidéo
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;
