import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/components/ui/notification-system';
import { slugify } from '@/lib/slugify';
import { useParoisse } from '@/contexts/ParoisseContext';
// Supabase types can be deeply nested; keep the runtime code simple and use narrow casts where necessary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

interface Video {
  id: string;
  title: string;
  slug?: string; // Add slug field
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category?: string;
  created_at: string;
  description?: string;
  published?: boolean;
  video_url?: string | null;
  video_storage_path?: string | null;
}

type VideoInsertData = {
  title: string;
  slug?: string; // Add slug field
  thumbnail_url?: string | null;
  duration?: number | null;
  category?: string;
  created_at?: string;
  description?: string;
  published?: boolean;
  video_url?: string | null;
  video_storage_path?: string | null;
  storage_path?: string;
  poster_url?: string;
};
type VideoUpdateData = Partial<Omit<Video, 'id' | 'created_at'>>;

export const useVideos = (limit = 4, category?: string) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id;

  // Ensure slug uniqueness helper (similar to useEvents)
  const ensureUniqueSlug = async (base: string) => {
    let candidate = base;
    let counter = 1;
    while (counter < 1000) {
      const { data, error } = await sb.from('videos').select('id').eq('slug', candidate).limit(1);
      if (error) {
        console.warn('Erreur lors de la vérification du slug:', error);
        return candidate; // Use the slug anyway if check fails
      }
      if (!data || data.length === 0) {
        return candidate; // Slug is unique
      }
      candidate = `${base}-${counter}`;
      counter += 1;
    }
    return candidate; // Fallback
  };

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const client = sb;

      // Préparer l'utilisateur courant (si connecté)
      let currentUser: any = null;
      try {
        const { data: authData } = await (supabase as any).auth.getUser();
        currentUser = (authData as any)?.user || null;
      } catch (e) {
        // pas bloquant
        currentUser = null;
      }

      // Récupérer toutes les vidéos (le filtrage est effectué côté composant)
      let query: any;
      // apply role-based visibility
      if (!currentUser) {
        // public visitor: only approved videos
        query = client.from('videos').select('*').eq('status', 'approved').order('created_at', { ascending: false });
      } else {
        const rawRole = currentUser?.user_metadata?.role;
        const lowerRole = rawRole ? String(rawRole).toLowerCase() : '';
        const isAdmin = ['admin', 'super_admin', 'administrateur'].includes(lowerRole);
        if (isAdmin) {
          // admin sees everything
          query = client.from('videos').select('*').order('created_at', { ascending: false });
        } else {
          // normal user sees approved videos plus their own
          query = client
            .from('videos')
            .select('*')
            .or(`status.eq.approved,user_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false });
        }
      }

      // Filter by selected paroisse when available
      if (paroisseId) query = query.eq('paroisse_id', paroisseId);

      // appliquer limite/catégorie après
      if (limit) query = query.limit(limit);
      if (category) query = query.eq('category', category);


      const res = await query.limit(limit);
      const { data, error: fetchError } = res as { data: unknown[] | null; error: unknown };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (fetchError) {
        throw fetchError;
      }

      // Filtrer par catégorie côté client si nécessaire
      let filtered = (data || []) as Video[];
      if (category && category !== 'all') {
        console.debug('📹 Filtering videos by category (client-side):', category);
        filtered = filtered.filter(v => v.category === category);
      }

      setVideos(filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des vidéos:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      notifyError('Erreur', 'Impossible de charger les vidéos');
    } finally {
      setLoading(false);
    }
  }, [limit, category, notifyError, paroisseId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const createVideo = async (videoData: VideoInsertData) => {
    try {
      // Generate slug from title if not provided
      let slug = videoData.slug;
      if (!slug && videoData.title) {
        const baseSlug = slugify(videoData.title);
        slug = await ensureUniqueSlug(baseSlug);
      }

      // Colonnes de base garanties d'exister dans la table videos
      // déterminer le statut en fonction du rôle de l'utilisateur
      const { data: { user: curUser } = {} } = await (supabase as any).auth.getUser();
      let status = 'pending';
      const rawRole = curUser?.user_metadata?.role;
      const lowerRole = rawRole ? String(rawRole).toLowerCase() : '';
      if (['admin', 'super_admin', 'administrateur'].includes(lowerRole)) {
        status = 'approved';
      }

      const baseData = {
        title: videoData.title,
        description: videoData.description,
        thumbnail_url: videoData.thumbnail_url,
        duration: videoData.duration,
        created_at: videoData.created_at,
        status, // pending for members, approved for admins
        ...(paroisseId ? { paroisse_id: paroisseId } : {}),
        ...(slug && { slug }), // Include slug if generated or provided
      };

      // Colonnes optionnelles (ajoutées par migration)
      const optionalData: Record<string, any> = {};
      if (videoData.category !== undefined) optionalData.category = videoData.category;
      if (videoData.published !== undefined) optionalData.published = videoData.published;
      // video_url est optionnel - on le met que s'il est fourni
      if (videoData.video_url) optionalData.video_url = videoData.video_url;
      // video_storage_path pour les vidéos uploadées localement
      if (videoData.video_storage_path) optionalData.video_storage_path = videoData.video_storage_path;

      const insertData = { ...baseData, ...optionalData };
      console.debug('📹 Creating video with data:', insertData);

      const { data, error } = await sb
        .from('videos')
        .insert([insertData as never])
        .select()
        .single();

      if (error) {
        console.error('Erreur createVideo:', error);
        // Fallback: réessayer sans les colonnes optionnelles si erreur
        if (error.message?.includes('column') || error.message?.includes('42703')) {
          console.warn('⚠️ Colonnes optionnelles non disponibles, tentative sans');
          const { data: fallbackData, error: fallbackError } = await sb
            .from('videos')
            .insert([baseData as never])
            .select()
            .single();
          if (fallbackError) throw fallbackError;
          if (fallbackData) {
            setVideos(prev => [fallbackData as Video, ...prev]);
          }
          notifySuccess('Succès', 'Vidéo publiée (colonnes optionnelles non disponibles)');
          return fallbackData as Video | null;
        }
        throw error;
      }

      if (data) {
        setVideos(prev => [data as Video, ...prev]);
      }
      notifySuccess('Succès', 'Vidéo publiée avec succès');
      return data as Video | null;
    } catch (err: unknown) {
      console.error('Erreur lors de createVideo:', err);
      notifyError('Erreur', 'Échec de la publication de la vidéo');
      throw err;
    }
  };

  const updateVideo = async (id: string, updates: VideoUpdateData) => {
    try {
      console.debug('📹 Updating video with data:', updates);
      try {
        // Lire l'utilisateur courant pour aide au debug (RLS)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('📹 updateVideo executing as user:', currentUser?.id, 'targetVideoId:', id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant update:', authErr);
      }

      const { data, error } = await sb
        .from('videos')
        .update(updates as never)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur updateVideo:', error);
        // Fallback: réessayer sans les colonnes optionnelles si erreur
        if (error.message?.includes('column') || error.message?.includes('42703')) {
          console.warn('⚠️ Colonnes optionnelles non disponibles, tentative sans');
          const baseUpdates: Record<string, any> = {};
          if (updates.title !== undefined) baseUpdates.title = updates.title;
          if (updates.description !== undefined) baseUpdates.description = updates.description;
          if (updates.thumbnail_url !== undefined) baseUpdates.thumbnail_url = updates.thumbnail_url;
          if (updates.duration !== undefined) baseUpdates.duration = updates.duration;
          const { data: fallbackData, error: fallbackError } = await sb
            .from('videos')
            .update(baseUpdates as never)
            .eq('id', id)
            .select()
            .maybeSingle();
          if (fallbackError) throw fallbackError;
          if (fallbackData) {
            setVideos(prev => prev.map(video => (video.id === id ? fallbackData as Video : video)));
          } else {
            console.warn('updateVideo: aucune ligne affectée lors du fallback pour id', id);
          }
          notifySuccess('Succès', 'Vidéo mise à jour (colonnes optionnelles non disponibles)');
          return fallbackData as Video | null;
        }
        throw error;
      }
      if (data) {
        setVideos(prev => prev.map(video => (video.id === id ? data as Video : video)));
      } else {
        console.warn('updateVideo: aucune ligne affectée pour id', id);
        throw new Error('Aucune ligne mise à jour — vérifiez les permissions (RLS) ou l\'identifiant');
      }
      notifySuccess('Succès', 'Vidéo mise à jour avec succès');
      return data as Video | null;
    } catch (err: unknown) {
      console.error('Erreur lors de updateVideo:', err);
      notifyError('Erreur', 'Échec de la mise à jour de la vidéo');
      throw err;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      console.debug('📹 deleteVideo called for id:', id);
      
      // Récupérer l'utilisateur courant
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('📹 deleteVideo executing as user:', currentUser?.id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant delete:', authErr);
      }

      const { error, count } = await sb
        .from('videos')
        .delete()
        .eq('id', id);

      console.debug('📹 deleteVideo response:', { error, count });

      if (error) {
        console.error('❌ deleteVideo RLS/query error:', error);
        throw error;
      }

      // Supprimer du state local
      setVideos(prev => {
        const updated = prev.filter(video => video.id !== id);
        console.debug('📹 updateState: removed video id', id, '— remaining videos:', updated.length);
        return updated;
      });
      
      notifySuccess('Succès', 'Vidéo supprimée avec succès');
    } catch (err: unknown) {
      console.error('❌ Erreur lors de deleteVideo:', err);
      notifyError('Erreur', 'Échec de la suppression de la vidéo');
      throw err;
    }
  };

  return { videos, loading, error, createVideo, updateVideo, deleteVideo, refreshVideos: fetchVideos };
};
