import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureOfficiantTitles } from '@/hooks/useOfficiantTitles';

export interface Parish {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  logo_url: string | null;
  couleur_principale: string | null;
  created_at: string;
  members_count?: number;
  content_count?: number;
}

export function useDeveloperAdmin() {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchParishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: paroisses, error: parishesError } = await supabase
        .from('paroisses')
        .select('*')
        .order('created_at', { ascending: false });

      if (parishesError) throw parishesError;

      const parishesWithStats = await Promise.all(
        (paroisses || []).map(async (parish) => {
          const { count: membersCount } = await supabase
            .from('parish_members')
            .select('*', { count: 'exact', head: true })
            .eq('parish_id', parish.id);

          const { count: videosCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('paroisse_id', parish.id);

          const { count: eventsCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('paroisse_id', parish.id);

          return {
            ...parish,
            members_count: membersCount || 0,
            content_count: (videosCount || 0) + (eventsCount || 0),
          };
        }),
      );

      setParishes(parishesWithStats as Parish[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paroisses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateParishStatus = async (id: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('paroisses')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setParishes((prev) =>
        prev.map((parish) => (parish.id === id ? { ...parish, is_active: isActive } : parish)),
      );

      toast({
        title: 'Succes',
        description: isActive ? 'Paroisse activee' : 'Paroisse desactivee',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Action impossible',
        variant: 'destructive',
      });
    }
  };

  const deleteParish = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('paroisses').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setParishes((prev) => prev.filter((parish) => parish.id !== id));
      toast({
        title: 'Succes',
        description: 'Paroisse supprimee definitivement',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  const createParish = async (data: Partial<Parish>) => {
    try {
      const { data: newParish, error: insertError } = await supabase
        .from('paroisses')
        .insert({
          nom: data.nom,
          slug: data.slug,
          description: data.description,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Ensure default officiant titles exist for the new paroisse (silent if blocked by RLS).
      void ensureOfficiantTitles((newParish as { id?: string | null } | null)?.id ?? null);

      setParishes((prev) => [{ ...newParish, members_count: 0, content_count: 0 } as Parish, ...prev]);
      toast({
        title: 'Succes',
        description: `Paroisse "${data.nom}" creee avec succes`,
      });
      return newParish;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Creation impossible',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    void fetchParishes();
  }, [fetchParishes]);

  return {
    parishes,
    loading,
    error,
    updateParishStatus,
    deleteParish,
    createParish,
    refresh: fetchParishes,
  };
}
