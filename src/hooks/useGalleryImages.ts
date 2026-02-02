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

      // Vérifier si l'utilisateur est connecté : si non, ne récupérer que les images approuvées
      let currentUser: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
        // Note: import dynamique pour éviter les dépendances cycliques
        currentUser = (authData as any)?.user || null;
      } catch (e) {
        currentUser = null;
      }

      let data: GalleryImage[] = [];

      if (!currentUser) {
        // Récupérer IDs approuvés pour la galerie
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = (await import('@/integrations/supabase/client')).supabase as any;
        const { data: approvedImgs, error: approvedErr } = await sb
          .from('content_approvals')
          .select('content_id')
          .eq('content_type', 'gallery')
          .eq('status', 'approved');

        if (approvedErr) {
          console.error('Erreur récupération approbations galerie:', approvedErr);
          const err = new Error('Impossible de charger la galerie');
          setError(err);
          return;
        }

        const ids = (approvedImgs || []).map((r: any) => r.content_id);
        if (ids.length === 0) {
          // Pas d'images approuvées
          setHasMore(false);
          setImages((prev) => prev);
          return;
        }

        const { data: imgs, error } = await sb
          .from('gallery_images')
          .select('*, category:gallery_categories(*)')
          .in('id', ids)
          .order('created_at', { ascending: false })
          .limit(initialLimit)
          .range(offsetRef.current, offsetRef.current + initialLimit - 1);

        if (error) {
          console.error('Erreur fetch gallery (approuvées):', error);
          const err = new Error('Impossible de charger la galerie');
          setError(err);
          return;
        }

        data = (imgs || []).filter((img: any): img is GalleryImage => !!img && typeof img === 'object' && 'id' in img);
      } else {
        // Utilisateur connecté : comportement existant
        const res = await fetchGalleryImages({ limit: initialLimit, offset: offsetRef.current });
        if (!res) {
          const err = new Error('Impossible de charger les images - Supabase n\'a pas répondu');
          setError(err);
          console.error('❌', err.message);
          return;
        }
        data = (res.data || []).filter((img): img is GalleryImage => !!img && typeof img === 'object' && 'id' in img);
      }

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
