import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ReligiousFeast } from '@/types/religiousFeasts';

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

export function useReligiousFeasts(initialDate = new Date()) {
  const [monthDate, setMonthDate] = useState<Date>(initialDate);
  const [feasts, setFeasts] = useState<ReligiousFeast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfMonth(monthDate);
      const to = endOfMonth(monthDate);
      const { data, error: qError } = await supabase
        .from('religious_feasts')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (qError) {
        const isMissingTable =
          qError.code === '42P01' ||
          qError.message?.toLowerCase().includes('relation') ||
          qError.message?.toLowerCase().includes('not found');

        if (isMissingTable) {
          setFeasts([]);
          setError('TABLE_MISSING');
          return;
        }

        throw qError;
      }
      setFeasts((data ?? []) as ReligiousFeast[]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur chargement des fetes.';
      setError(message);
      setFeasts([]);
    } finally {
      setLoading(false);
    }
  }, [monthDate]);

  useEffect(() => {
    void loadFeasts();
  }, [loadFeasts]);

  return {
    feasts,
    loading,
    error,
    monthDate,
    setMonthDate,
    refresh: loadFeasts,
    refetch: loadFeasts,
  };
}
