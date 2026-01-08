import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PublicAd } from '@/types/advertisements';

export function useAdvertisements() {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear old ad-seen keys from localStorage to allow fresh display
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('ad-seen-')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Cleared old advertisement seen keys from localStorage');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }

    let mounted = true;
    
    const fetchAds = async () => {
      try {
        setLoading(true);
        console.log('Fetching advertisements...');
        const { data, error } = await supabase
          .from('public_advertisements')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error fetching advertisements:', error);
          setAds([]);
          return;
        }
        
        console.log('Advertisements fetched:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('First ad:', data[0].title);
        }
        setAds((data || []) as PublicAd[]);
      } catch (e) {
        console.error('Exception fetching advertisements:', e);
        if (mounted) setAds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAds();
    return () => { mounted = false };
  }, []);

  const latestAd = ads?.[0] || null;
  return { ads, loading, latestAd };
}
