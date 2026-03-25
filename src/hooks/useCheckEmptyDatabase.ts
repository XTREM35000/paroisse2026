import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCheckEmptyDatabase = () => {
  const [isEmpty, setIsEmpty] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkDatabase = async () => {
      try {
        // Create the internal developer user/profile + SYSTEM parish (idempotent)
        // before evaluating whether the DB is "empty".
        const { error: rpcError } = await supabase.rpc('ensure_developer_account');
        if (rpcError) {
          // Backward compatibility with older DB state/migrations.
          const { error: legacyError } = await supabase.rpc('ensure_developer_exists');
          if (legacyError) throw legacyError;
        }

        // Ignore the internal system parish and inactive rows when checking if the DB is "empty".
        const {
          count: paroisseCount,
          error: paroisseError,
        } = await supabase
          .from('paroisses')
          .select('*', { count: 'exact', head: true })
          .neq('slug', 'system');

        if (paroisseError) throw paroisseError;

        // Ignore the internal developer profile when deciding if the DB is empty.
        const {
          count: profileCount,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('role', 'developer');

        if (profileError) throw profileError;

        if (!mounted) return;

        setIsEmpty((profileCount ?? 0) === 0 && (paroisseCount ?? 0) === 0);
        setError(null);
      } catch (err) {
        console.error('Erreur vérification base:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsEmpty(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    void checkDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return { isEmpty, loading, error } as const;
};
