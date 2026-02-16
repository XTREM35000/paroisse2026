import { useEffect, useState } from 'react';
import { fetchLiveProviderSources } from '@/lib/supabase/mediaQueries';
import type { LiveProviderSource } from '@/types/database';

interface UseLiveProviderSourcesResult {
  sources: LiveProviderSource[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook pour récupérer et gérer les liens fournisseurs d'un live stream
 * 
 * @param liveId - L'ID du live stream
 * @returns {UseLiveProviderSourcesResult} Sources, loading, error
 * 
 * @example
 * const { sources, loading, error } = useLiveProviderSources(liveStream.id);
 * if (sources.length > 0) {
 *   return <LiveProviderLinks sources={sources} />;
 * }
 */
export default function useLiveProviderSources(
  liveId?: string
): UseLiveProviderSourcesResult {
  const [sources, setSources] = useState<LiveProviderSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!liveId) {
      setSources([]);
      return;
    }

    const fetchSources = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLiveProviderSources(liveId);
        setSources(data);
      } catch (err) {
        console.error('Error fetching live provider sources:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setSources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, [liveId]);

  return { sources, loading, error };
}
