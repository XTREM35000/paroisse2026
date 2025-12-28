import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  likes?: number;
  comments?: number;
  created_at: string;
  user_id?: string;
}

export const useGalleryImages = (limit = 20) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (fetchError) throw fetchError;
        
        if (data) {
          // Mapper les données de la base avec les noms attendus
          const mappedImages: GalleryImage[] = data.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            title: (item.title as string | null) || 'Sans titre',
            imageUrl: (item.image_url as string | null) || (item.imageUrl as string | null) || '',
            likes: (item.likes as number) || 0,
            comments: (item.comments as number) || 0,
            created_at: item.created_at as string,
            user_id: item.user_id as string,
          }));
          
          setImages(mappedImages);
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la galerie:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // Fallback pour le développement
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, [limit]);

  return { images, loading, error };
};
