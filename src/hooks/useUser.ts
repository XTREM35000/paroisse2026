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
      setIsLoading(false);
      return;
    }

    // Utiliser une variable pour tracker le montage et éviter les mises à jour après unmount
    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return; // Vérifier si le composant est toujours monté

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
        if (isMounted) {
          setProfile({
            id: user.id,
            email: user.email || '',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]); // Dépendre de user pour que l'effet se déclenche quand l'objet user change

  const isAdmin = !!(profile && typeof profile.role === 'string' && ['admin', 'administrateur', 'superadmin'].includes(profile.role.toLowerCase()));

  return { profile, isLoading, isAdmin };
}
