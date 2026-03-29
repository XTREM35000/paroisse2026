import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUser } from '@/hooks/useUser';
import GalleryImageModal from '@/components/GalleryImageModal';
import { Button } from '@/components/ui/button';

const GalleryPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { images, loading, refresh } = useGalleryImages(100);
  const { isAdmin } = useUser();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <HeroBanner
        title="Galerie photos"
        subtitle="Moments de vie paroissiale en images"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <h1 className="text-3xl font-bold mt-8 mb-6">Galerie Photos</h1>

      {isAdmin && (
        <Button onClick={() => setShowUploadModal(true)} className="mb-6">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une image
        </Button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images?.map((image) => (
          <div key={image.id} className="relative group">
            <img
              src={image.url}
              alt={image.title || 'Image de la galerie'}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        ))}
      </div>

      <GalleryImageModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImageAdded={() => {
          setShowUploadModal(false);
          void refresh();
          void queryClient.invalidateQueries({ queryKey: ['gallery'] });
        }}
      />

      {loading && <p className="text-sm text-muted-foreground mt-4">Chargement...</p>}
    </div>
  );
};

export default GalleryPage;
