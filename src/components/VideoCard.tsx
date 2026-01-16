import { motion } from 'framer-motion';
import { Trash2, Eye, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { useState } from 'react';
import type { Video } from '@/types/database';
import { useUser } from '@/hooks/useUser';
import { deleteVideo } from '@/lib/supabase/videoQueries';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  video?: Video | null;
  onOpen?: () => void;
  onDeleted?: () => void;
}

const VideoCard = ({ video, onOpen, onDeleted }: VideoCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  // Vérification critique - afficher un placeholder si vidéo est undefined/null
  if (!video) {
    return (
      <div className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer h-full flex flex-col bg-muted animate-pulse">
        <div className="aspect-video overflow-hidden bg-muted-foreground/20" />
        <div className="p-4 flex-1">
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-3/4" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const thumbnailUrl = video.thumbnail_url || '/images/video-placeholder.jpg';
  const title = video.title || 'Sans titre';
  const views = video.views || 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAdmin || !video?.id) return;

    // Si pas encore en confirmation, afficher un toast avec confirmation
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      toast({
        title: '⚠️ Confirmer la suppression',
        description: `Êtes-vous sûr de vouloir supprimer "${video.title}" ? Cliquez de nouveau pour confirmer.`,
        variant: 'destructive',
      });
      // Auto-réinitialiser après 5 secondes
      setTimeout(() => setShowDeleteConfirm(false), 5000);
      return;
    }

    // Deuxième clic = suppression confirmée
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(String(video.id))) {
        console.warn('Refusing to delete video with invalid id format:', video.id);
        toast({ title: 'Erreur', description: 'Identifiant de vidéo invalide', variant: 'destructive' });
        setIsDeleting(false);
        return;
      }

      const success = await deleteVideo(video.id);
      if (success) {
        toast({ title: 'Succès ✓', description: 'Vidéo supprimée avec succès' });
        onDeleted?.();
      } else {
        toast({ title: 'Erreur', description: 'Impossible de supprimer la vidéo', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({ title: 'Erreur', description: 'Une erreur est survenue lors de la suppression', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer h-full flex flex-col"
      onClick={onOpen}
    >
      <div className="aspect-video overflow-hidden bg-muted">
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        {/* Play icon overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur-sm group-hover:bg-primary transition-colors">
            <div className="w-0 h-0 border-l-8 border-l-primary-foreground border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
          </div>
        </div>
      </div>

      {/* Info overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h4 className="font-display text-primary-foreground font-medium mb-2 line-clamp-2">{title}</h4>

          <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {views}
            </span>
          </div>
        </div>
      </div>

      {/* Delete button */}
      {isAdmin && (
        <div className="absolute top-3 left-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              showDeleteConfirm 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-destructive/80 hover:bg-destructive disabled:opacity-50'
            }`}
            title={showDeleteConfirm ? 'Cliquer à nouveau pour confirmer' : 'Supprimer'}
          >
            <Trash2 className={`w-4 h-4 ${showDeleteConfirm ? 'text-white' : 'text-destructive-foreground'}`} />
          </motion.button>
        </div>
      )}

      {/* Play button (visible on hover) */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center backdrop-blur-sm transition-colors"
          title="Lire"
        >
          <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
        </motion.button>
      </div>

      {/* Info footer */}
      <div className="p-3 bg-card border-t border-border/50">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {views} vues
        </p>
      </div>
    </motion.div>
  );
};

export default VideoCard;
