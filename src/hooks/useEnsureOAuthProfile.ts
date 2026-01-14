import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook qui gère la création/mise à jour du profil après OAuth
 * Vérifie si le profil existe et le crée si nécessaire
 */
export function useEnsureOAuthProfile() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ensureProfile = async () => {
      try {
        // Vérifier si le profil existe
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération du profil:', fetchError);
          return;
        }

        // Si le profil n'existe pas, le créer
        if (!profile) {
          // Extraire les informations du user_metadata (fourni par OAuth)
          const userMetadata = user.user_metadata || {};
          const fullName = userMetadata.full_name || 
                          `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() || 
                          user.email?.split('@')[0] || 'Utilisateur';
          
          const avatarUrl = userMetadata.avatar_url || null;

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                role: 'membre', // Rôle par défaut pour les utilisateurs OAuth
                created_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (upsertError) {
            console.error('Erreur lors de la création du profil OAuth:', upsertError);
          } else {
            console.log('✅ Profil créé automatiquement après OAuth');
          }
        }
      } catch (error) {
        console.error('Erreur dans ensureOAuthProfile:', error);
      }
    };

    ensureProfile();
  }, [user?.id]);
}
