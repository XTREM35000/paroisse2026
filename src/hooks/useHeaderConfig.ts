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
    queryFn: async (): Promise<HeaderConfig> => {
      // @ts-expect-error - header_config table exists but not in types yet
      const { data, error } = await supabase
        .from('header_config')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement de la config du header:', error);
        // Retourner une configuration par défaut en cas d'erreur
        return getDefaultHeaderConfig();
      }

      if (!data) {
        // Aucune config trouvée, retourner la config par défaut
        return getDefaultHeaderConfig();
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
      // @ts-expect-error - header_config table exists but not in types yet
      const { data, error } = await supabase
        .from('header_config')
        .update(config)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      return data as unknown as HeaderConfig;
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
