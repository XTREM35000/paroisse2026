import { motion } from 'framer-motion';
import { Heart, MessageCircle, Maximize2, Trash2, Clock, CheckCircle, Download } from 'lucide-react';
import { useState } from 'react';
import type { GalleryImage } from '@/types/database';
import { useUser } from '@/hooks/useUser';
import { deleteGalleryImage } from '@/lib/supabase/galleryQueries';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import useFileManager from '@/hooks/useFileManager';

interface GalleryCardProps {
  image?: GalleryImage | null;
  onOpen?: () => void;
  onDeleted?: (id?: string) => void;
}

const GalleryCard = ({ image, onOpen, onDeleted }: GalleryCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';
  const { downloadMedia } = useFileManager();
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAdmin || !image?.id) return;
    
    // Si pas encore en confirmation, afficher un toast avec confirmation
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      toast({
        title: '⚠️ Confirmer la suppression',
        description: `Êtes-vous sûr de vouloir supprimer "${image.title}" ? Cliquez de nouveau pour confirmer.`,
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
      // Validate UUID format to avoid passing invalid ids (e.g. numeric mocks) to the DB
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(String(image.id))) {
        console.warn('Refusing to delete image with invalid id format:', image.id);
        toast({ title: 'Erreur', description: 'Identifiant d\'image invalide', variant: 'destructive' });
        setIsDeleting(false);
        return;
      }

      const res: any = await deleteGalleryImage(image.id);
      const success = res && res.success;
      if (success) {
        toast({
          title: 'Succès ✓',
          description: 'Image supprimée avec succès',
        });
        // Prévenir le parent via callback si fourni, sinon invalider la query homepage pour forcer le rafraîchissement
        if (onDeleted) {
          onDeleted(String(image.id));
        } else {
          try {
            queryClient.invalidateQueries({ queryKey: ['homepage-gallery'] });
          } catch (e) {
            // silent
          }
        }
      } else {
        console.error('deleteGalleryImage failed', res?.error || res);
        const message = res?.error?.message || (res?.error?.msg ?? 'Impossible de supprimer l\'image');
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  
  // Vérification critique - afficher un placeholder si image est undefined/null
  if (!image) {
    return (
      <div className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer h-full flex flex-col bg-muted animate-pulse">
        <div className="aspect-square overflow-hidden bg-muted-foreground/20" />
        <div className="p-4 flex-1">
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-3/4" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
        </div>
      </div>
    );
  }
  
  const imgUrl = image.thumbnail_url || image.image_url || '/images/gallery/default.jpg';
  const title = image.title || 'Sans titre';
  const description = image.description;
  const likes = (image.metadata && (image.metadata as any).likes) || 0;
  const comments = (image.metadata && (image.metadata as any).comments) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer h-full flex flex-col"
      onClick={onOpen}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imgUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge de statut */}
        {image.status === 'pending' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-orange-500/90 text-white flex items-center gap-1 border-0">
              <Clock className="w-3 h-3" />
              En attente
            </Badge>
          </div>
        )}
        {image.status === 'approved' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-green-500/90 text-white flex items-center gap-1 border-0">
              <CheckCircle className="w-3 h-3" />
              Approuvée
            </Badge>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h4 className="font-display text-primary-foreground font-medium mb-2 line-clamp-2">{title}</h4>
          {description && <p className="text-xs text-primary-foreground/80 line-clamp-1 mb-3">{description}</p>}

          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                isLiked ? 'text-destructive' : 'text-primary-foreground/80 hover:text-primary-foreground'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? likes + 1 : likes}</span>
            </button>

            <span className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
              <MessageCircle className="w-4 h-4" />
              <span>{comments}</span>
            </span>
          </div>

          {/* Prominent download button (bottom-left) */}
          <div className="absolute bottom-4 left-4 z-40">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  // Prefer storage download if path exists
                  if (image.image_url && !image.image_url.startsWith('http')) {
                    await downloadMedia(image.image_url, image.title || image.file_name || 'image');
                    return;
                  }

                  // Attempt to fetch remote resource and force download (works around cross-origin behavior when possible)
                  const targetUrl = image.image_url && image.image_url.startsWith('http')
                    ? image.image_url
                    : image.thumbnail_url && image.thumbnail_url.startsWith('http')
                    ? image.thumbnail_url
                    : undefined;

                  if (targetUrl) {
                    const res = await fetch(targetUrl);
                    if (!res.ok) throw new Error('Network response was not ok');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = image.title || image.file_name || 'image';
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    a.remove();
                    return;
                  }

                  throw new Error('Aucun fichier téléchargeable trouvé');
                } catch (err) {
                  console.error('Download image error', err);
                  try { toast({ title: 'Erreur', description: 'Impossible de télécharger l\'image', variant: 'destructive' }); } catch (e) { /* silent */ }
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-md"
              title="Télécharger"
              aria-label="Télécharger"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">📥 Télécharger</span>
            </button>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <motion.div whileHover={{ scale: 1.1 }} className="w-8 h-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>

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
      </div>

      {description && (
        <div className="p-3 bg-card border-t border-border/50">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      )}
    </motion.div>
  );
};

export default GalleryCard;
