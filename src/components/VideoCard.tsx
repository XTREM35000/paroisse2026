import { motion } from 'framer-motion';
import { Trash2, Eye, AlertCircle, CheckCircle, Play, Clock, Download } from 'lucide-react';
import { useState } from 'react';
import type { Video } from '@/types/database';
import { useUser } from '@/hooks/useUser';
import { deleteVideo } from '@/lib/supabase/videoQueries';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DownloadButton from '@/components/DownloadButton';
import useFileManager from '@/hooks/useFileManager';

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
  const fm = useFileManager();

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
        
        {/* Badge de statut */}
        {video.status === 'pending' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-orange-500/90 text-white flex items-center gap-1 border-0">
              <Clock className="w-3 h-3" />
              En attente
            </Badge>
          </div>
        )}
        {video.status === 'approved' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-green-500/90 text-white flex items-center gap-1 border-0">
              <CheckCircle className="w-3 h-3" />
              Approuvée
            </Badge>
          </div>
        )}
        
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

      {/* Action buttons container - visible on hover at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 items-center">
        {/* Download button (prominent) */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const isYouTube = (url?: string) => !!(url && /(youtube\.com|youtu\.be)/i.test(url));
            try {
              if (video.video_storage_path) {
                try {
                  await fm.downloadMedia(video.video_storage_path, video.title || video.file_name || 'video', 'video-files');
                  try { toast({ title: 'Téléchargement lancé', description: 'Le téléchargement va démarrer.' }); } catch (e) { /* silent */ }
                  return;
                } catch (storageErr: any) {
                  console.warn('Storage download failed, will attempt fallback', storageErr);
                  // If external YouTube link exists, open it instead and notify
                  if (video.video_url && isYouTube(video.video_url)) {
                    window.open(video.video_url, '_blank');
                    toast({ title: 'Vidéo accessible sur Youtube pour le téléchargement', description: 'Ouverture sur YouTube' });
                    return;
                  }
                  // otherwise continue to try external URL
                }
              }

              if (video.video_url && video.video_url.startsWith('http')) {
                // For YouTube links prefer opening the page
                if (isYouTube(video.video_url)) {
                  window.open(video.video_url, '_blank');
                  toast({ title: 'Vidéo accessible sur Youtube pour le téléchargement', description: 'Ouverture sur YouTube' });
                  return;
                }

                try {
                  const res = await fetch(video.video_url);
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = video.title || video.file_name || 'video';
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    a.remove();
                    try { toast({ title: 'Téléchargement lancé', description: 'Le téléchargement va démarrer.' }); } catch (e) { /* silent */ }
                    return;
                  }
                } catch (fetchErr) {
                  console.warn('Fetch of external video failed', fetchErr);
                  // open in new tab as a fallback
                  window.open(video.video_url, '_blank');
                  toast({ title: 'Ouverture', description: 'Impossible de télécharger; ouverture du lien externe.' });
                  return;
                }
              }

              // Fallback: open whatever link we have
              if (video.video_url) {
                window.open(video.video_url, '_blank');
              } else {
                toast({ title: 'Erreur', description: 'Aucun fichier disponible à télécharger', variant: 'destructive' });
              }
            } catch (err) {
              console.error('Error handling download fallback:', err);
              toast({ title: 'Erreur', description: 'Impossible de télécharger la vidéo', variant: 'destructive' });
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-md z-40"
          title="Télécharger la vidéo"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">📥 Télécharger</span>
        </button>

        {/* Watch button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
          className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 backdrop-blur-sm transition-colors text-sm font-medium text-primary-foreground"
          title="Regarder"
        >
          <Play className="w-4 h-4 fill-primary-foreground" />
          <span>Regarder</span>
        </motion.button>

        {/* Edit button (admin only) */}
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="h-10 w-10 rounded-lg bg-blue-500/80 hover:bg-blue-600 flex items-center justify-center backdrop-blur-sm transition-colors flex-shrink-0"
            title="Modifier"
          >
            <span className="text-white text-lg font-bold">✎</span>
          </motion.button>
        )}

        {/* Delete button (admin only) */}
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className={`h-10 w-10 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors flex-shrink-0 ${
              showDeleteConfirm
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-destructive/80 hover:bg-destructive disabled:opacity-50'
            }`}
            title={showDeleteConfirm ? 'Cliquer à nouveau pour confirmer' : 'Supprimer'}
          >
            <Trash2 className={`w-4 h-4 ${showDeleteConfirm ? 'text-white' : 'text-destructive-foreground'}`} />
          </motion.button>
        )}
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
