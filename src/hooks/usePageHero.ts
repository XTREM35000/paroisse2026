import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

export interface PageHero {
  id: string;
  path: string;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
}

// Reuse main supabase client to avoid multiple GoTrue instances

const fetchHero = async (path: string, signal?: AbortSignal): Promise<PageHero | null> => {
  try {
    // Check if signal is aborted before making request
    if (signal?.aborted) {
      return null;
    }

    // Use untyped client to avoid TypeScript schema mismatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseClient as any)
      .from('page_hero_banners')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    // Check again after async operation
    if (signal?.aborted) {
      return null;
    }

    if (error) {
      console.error('Error fetching hero:', error);
      return null;
    }
    
    return data ? (data as PageHero) : null;
  } catch (err: unknown) {
    // Ignore abort errors
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      console.log('Hero query cancelled');
      return null;
    }
    console.error('Error in fetchHero:', err);
    return null;
  }
};

export default function usePageHero(path: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['page-hero', path],
    queryFn: ({ signal }) => fetchHero(path, signal),
    enabled: !!path,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      path: string;
      image_url?: string | null;
      title?: string | null;
      subtitle?: string | null;
    }) => {
      try {
        const body: Record<string, unknown> = {
          path: payload.path,
          updated_at: new Date().toISOString(),
        };
        if (payload.image_url !== undefined) body.image_url = payload.image_url;
        if (payload.title !== undefined) body.title = payload.title;
        if (payload.subtitle !== undefined) body.subtitle = payload.subtitle;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseClient as any)
          .from('page_hero_banners')
          .upsert(body, { onConflict: 'path' })
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error upserting hero:', error);
          return null;
        }

        return data ? (data as PageHero) : null;
      } catch (err) {
        console.error('Error in mutation:', err);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-hero', path] });
    },
  });

  return {
    ...query,
    save: async (
      image_urlOrPayload: string | null | { image_url?: string | null; title?: string | null; subtitle?: string | null }
    ): Promise<void> => {
      try {
        if (image_urlOrPayload === null || typeof image_urlOrPayload === 'string') {
          await mutation.mutateAsync({ path, image_url: image_urlOrPayload });
        } else {
          await mutation.mutateAsync({
            path,
            image_url: image_urlOrPayload.image_url,
            title: image_urlOrPayload.title,
            subtitle: image_urlOrPayload.subtitle,
          });
        }
      } catch (err) {
        console.warn('Could not save hero:', err);
      }
    },
  };
}
