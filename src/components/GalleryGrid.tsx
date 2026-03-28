import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Plus } from 'lucide-react';
import GalleryCard from './GalleryCard';
import GalleryImageModal from './GalleryImageModal';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import type { GalleryImage } from '@/types/database';

interface GalleryGridProps {
  columns?: number;
  gap?: string;
  onOpen?: (image: GalleryImage) => void;
  pageSize?: number;
  canAddImages?: boolean;
  /** Si fourni, la grille n’utilise plus le hook interne (filtrage / pagination gérés par le parent). */
  images?: GalleryImage[];
  loading?: boolean;
  refetch?: () => Promise<void> | void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  columns = 4,
  gap = '6',
  onOpen,
  pageSize = 12,
  canAddImages = true,
  images: imagesProp,
  loading: loadingProp,
  refetch: refetchProp,
}) => {
  const hook = useGalleryImages(pageSize);
  const controlled = imagesProp !== undefined;
  const images = controlled ? imagesProp! : hook.images;
  const loading = controlled ? !!loadingProp : hook.loading;
  const error = controlled ? null : hook.error;
  const loadMore = controlled ? () => {} : hook.loadMore;
  const hasMore = controlled ? false : hook.hasMore;
  const isEmpty = !images?.length;
  const refetch = controlled ? refetchProp : hook.refetch;
  const removeImageById = hook.removeImageById;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleted = (id?: string) => {
    if (controlled) {
      void refetch?.();
    } else if (id) {
      removeImageById(id);
    } else {
      void refetch?.();
    }
  };

  const style: React.CSSProperties = {
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`,
  };

  // État vide avec message amical
  if (!loading && isEmpty) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-16">
          <ImageOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune photo disponible</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            La galerie sera bientôt remplie de moments mémorables de notre communauté.
          </p>
          {canAddImages && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une première image
            </button>
          )}
        </div>
        <GalleryImageModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onImageAdded={() => {
            setIsModalOpen(false);
            refetch?.();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Bouton d'ajout d'image */}
      {canAddImages && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une image
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
          Erreur lors du chargement des images : {error.message}
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`grid gap-${gap}`} style={style}>
        {loading && images.length === 0 ? (
          // Skeleton placeholders
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted h-64" />
          ))
        ) : (
          (images || []).map((img) => (
            <Fragment key={img.id}>
                <GalleryCard 
                  image={img} 
                  onOpen={() => onOpen?.(img)}
                  onDeleted={handleDeleted}
                />
            </Fragment>
          ))
        )}
      </motion.div>

      <div className="flex justify-center mt-6">
        {hasMore ? (
          <button
            className="btn"
            onClick={() => loadMore()}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Voir plus'}
          </button>
        ) : images.length > 0 ? (
          <span className="text-sm text-muted-foreground">Toutes les images chargées</span>
        ) : null}
      </div>

      {/* Modal d'ajout d'image */}
      <GalleryImageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageAdded={() => {
          setIsModalOpen(false);
          refetch?.();
        }}
      />
    </div>
  );
};

export default GalleryGrid;
