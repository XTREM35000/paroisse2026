import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryItem {
  id: string;
  name: string;
  description: string | null;
  category: 'service' | 'member' | 'clergy';
  email: string | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook pour récupérer l'annuaire de la paroisse
 * Retourne les services, membres et clergé organisés par catégorie
 */
export const useDirectory = () => {
  return useQuery({
    queryKey: ['directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directory')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as DirectoryItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour mettre à jour un élément de l'annuaire (admin)
 */
export const useUpdateDirectoryItem = () => {
  const queryClient = useQueryClient();
  
  return {
    mutate: async (id: string, updates: Partial<DirectoryItem>) => {
      const { error } = await supabase
        .from('directory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate query
      await queryClient.invalidateQueries({ queryKey: ['directory'] });
    },
  };
};

/**
 * Organiser les éléments de l'annuaire par catégorie
 */
export const organizeByCategory = (items: DirectoryItem[]) => {
  return {
    services: items.filter(item => item.category === 'service').sort((a, b) => a.display_order - b.display_order),
    clergy: items.filter(item => item.category === 'clergy').sort((a, b) => a.display_order - b.display_order),
    members: items.filter(item => item.category === 'member').sort((a, b) => a.display_order - b.display_order),
  };
};
