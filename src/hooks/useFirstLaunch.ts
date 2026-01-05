import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFirstLaunch() {
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [sectionsRes, contentRes, headerRes] = await Promise.all([
          supabase.from('homepage_sections').select('id', { count: 'exact', head: true }),
          supabase.from('homepage_content').select('id', { count: 'exact', head: true }),
          supabase.from('header_config').select('id', { count: 'exact', head: true }),
        ]);

        if (!mounted) return;
        const sCount = sectionsRes.count ?? 0;
        const cCount = contentRes.count ?? 0;
        const hCount = headerRes.count ?? 0;
        // Consider first launch if header_config is missing OR both homepage sections and content are empty
        const isEmpty = hCount === 0 || (sCount === 0 && cCount === 0);

        console.log('useFirstLaunch check:', { sCount, cCount, hCount, isEmpty });
        setIsFirstLaunch(isEmpty);
      } catch (err) {
        console.error('useFirstLaunch error', err);
        // In case of error, don't block admin from seeing app — assume not first launch
        setIsFirstLaunch(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { isFirstLaunch, loading };
}

export default useFirstLaunch;
