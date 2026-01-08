import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGalleryImages } from '@/lib/supabase/galleryQueries';
import type { GalleryImage } from '@/types/database';

export function useGalleryImages(initialLimit = 20) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Chargement des images de galerie (offset:', offsetRef.current, 'limit:', initialLimit, ')');
      const res = await fetchGalleryImages({ limit: initialLimit, offset: offsetRef.current });
      if (!res) {
        const err = new Error('Impossible de charger les images - Supabase n\'a pas répondu');
        setError(err);
        console.error('❌', err.message);
        return;
      }
      // Filtrer les valeurs undefined/null et valider les données
      const data = (res.data || []).filter((img): img is GalleryImage => !!img && typeof img === 'object' && 'id' in img);
      console.log(`📸 Images chargées: ${data.length} valides (offset: ${offsetRef.current})`);
      
      if (data.length === 0 && offsetRef.current === 0) {
        console.warn('⚠️  Aucune image trouvée. Vérifiez les données de la table gallery_images');
      }
      
      setImages((prev) => [...prev, ...data]);
      offsetRef.current += data.length;
      setHasMore(data.length === initialLimit);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur gallery:', errorMsg);
      setError(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const refresh = useCallback(async () => {
    console.log('🔄 Rafraîchissement de la galerie');
    offsetRef.current = 0;
    setImages([]);
    setHasMore(true);
    setError(null);
    await loadMore();
  }, [loadMore]);

  useEffect(() => {
    // initial load
    refresh();
  }, [refresh]);

  const removeImageById = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  return { images, loading, error, refresh, loadMore, hasMore, isEmpty: images.length === 0, refetch: refresh, removeImageById } as const;
}
