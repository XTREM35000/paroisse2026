import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          setProfile({
            id: user.id,
            email: user.email || '',
          });
        } else {
          setProfile(data || {
            id: user.id,
            email: user.email || '',
          });
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        setProfile({
          id: user.id,
          email: user.email || '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}
