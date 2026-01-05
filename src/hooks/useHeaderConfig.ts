// src/hooks/useHeaderConfig.ts
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

export interface HeaderConfig {
  id: string;
  logo_url: string | null;
  logo_alt_text: string;
  logo_size: 'sm' | 'md' | 'lg';
  main_title: string;
  subtitle: string;
  navigation_items: NavigationItem[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Hook pour récupérer la configuration du Header depuis Supabase
 * Retourne la première configuration active ou une config par défaut
 */
export const useHeaderConfig = () => {
  return useQuery({
    queryKey: ['header-config'],
    queryFn: async (): Promise<HeaderConfig | null> => {
      // @ts-expect-error - header_config table exists but not in types yet
      const { data, error } = await supabase
        .from('header_config')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement de la config du header:', error);
        // En cas d'erreur, retourner null pour forcer le tenant à configurer
        return null;
      }

      if (!data) {
        // Aucune config trouvée -> retourner null (nouveau tenant doit configurer)
        return null;
      }

      return data as HeaderConfig;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour mettre à jour la configuration du Header
 */
export const useUpdateHeaderConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<HeaderConfig>) => {
      try {
        // Try update first
        // @ts-expect-error - header_config table exists but not in types yet
        const { data, error, status, statusText } = await supabase
          .from('header_config')
          .update(config)
          .eq('is_active', true)
          .select();

        if (error) {
          console.error('[useUpdateHeaderConfig] update error', { error, status, statusText, config });
          throw new Error(`Erreur lors de la mise à jour: ${error?.message ?? JSON.stringify(error)}`);
        }

        // If update returned rows, return the first
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as unknown as HeaderConfig;
        }

        if (data && typeof data === 'object') {
          return data as unknown as HeaderConfig;
        }

        // No rows were updated -> insert a new config (table was likely empty)
        const insertPayload = { ...(config as object), is_active: true } as any;
        // @ts-expect-error
        const { data: insertData, error: insertError } = await supabase
          .from('header_config')
          .insert(insertPayload)
          .select();

        if (insertError) {
          console.error('[useUpdateHeaderConfig] insert error', insertError, { config });
          throw new Error(`Erreur lors de l'insertion: ${insertError?.message ?? JSON.stringify(insertError)}`);
        }

        if (Array.isArray(insertData) && insertData.length > 0) {
          return insertData[0] as unknown as HeaderConfig;
        }

        if (insertData && typeof insertData === 'object') {
          return insertData as unknown as HeaderConfig;
        }

        throw new Error('Impossible de mettre à jour ou d\'insérer la config du header');
      } catch (err: any) {
        console.error('[useUpdateHeaderConfig] unexpected error', err, { config });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header-config'] });
      toast({
        title: 'Succès',
        description: 'Configuration du header mise à jour',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Configuration par défaut du Header
 */
export const getDefaultHeaderConfig = (): HeaderConfig => {
  return {
    id: 'default',
    logo_url: null,
    logo_alt_text: 'Logo Paroisse Notre Dame de la Compassion',
    logo_size: 'sm',
    main_title: 'Paroisse Notre Dame',
    subtitle: 'de la Compassion',
    navigation_items: [
      { label: 'Accueil', href: '/', icon: 'home' },
      { label: 'À propos', href: '/a-propos', icon: 'info' },
    ],
    is_active: true,
  };
};
