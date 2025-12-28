import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category?: string;
  created_at: string;
  description?: string;
}

export const useVideos = (limit = 4, category?: string) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        let query = supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        const { data, error: fetchError } = await query.limit(limit);
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setVideos(data as Video[]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des vidéos:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [limit, category]);

  return { videos, loading, error };
};
