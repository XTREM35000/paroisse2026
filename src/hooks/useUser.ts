import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  created_at?: string | null;
}

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
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
          setProfile((data as UserProfile) || {
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
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isAdmin = !!(profile && typeof profile.role === 'string' && ['admin', 'administrateur', 'superadmin'].includes(profile.role.toLowerCase()));

  return { profile, isLoading, isAdmin };
}
