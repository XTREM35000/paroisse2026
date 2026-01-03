import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageHero {
  id: string;
  path: string;
  image_url?: string | null;
  metadata?: any;
  updated_at?: string;
}

const fetchHero = async (path: string): Promise<PageHero | null> => {
  const { data, error } = await supabase
    .from('page_hero_banners')
    .select('*')
    .eq('path', path)
    .maybeSingle();

  if (error) throw error;
  return data as PageHero | null;
};

export default function usePageHero(path: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['page-hero', path],
    queryFn: () => fetchHero(path),
    enabled: !!path,
  });

  const mutation = useMutation({
    mutationFn: async (payload: { path: string; image_url: string | null }) => {
      const { data, error } = await supabase
        .from('page_hero_banners')
        .upsert(
          { path: payload.path, image_url: payload.image_url, updated_at: new Date().toISOString() },
          { onConflict: 'path', returning: 'representation' }
        )
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PageHero | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['page-hero', path] });
    }
  });

  return {
    ...query,
    save: async (image_url: string | null): Promise<void> => {
      await mutation.mutateAsync({ path, image_url });
    },
  };
}
