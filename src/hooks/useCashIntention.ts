import { useState, useCallback } from 'react';
import {
  createIntention,
  findIntentionByToken,
  type CreateIntentionInput,
  type CashIntentionRow,
} from '@/lib/supabase/cashDonationQueries';
import { useToast } from '@/hooks/use-toast';

export function useCashIntention() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitIntention = useCallback(
    async (data: CreateIntentionInput): Promise<{ intention_token: string } | null> => {
      setLoading(true);
      try {
        const result = await createIntention(data);
        toast({
          title: 'Intention enregistrée',
          description: 'Présentez ce code au guichet de la paroisse.',
        });
        return { intention_token: result.intention_token };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement';
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const getByToken = useCallback(async (token: string): Promise<CashIntentionRow | null> => {
    setLoading(true);
    try {
      return await findIntentionByToken(token);
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitIntention, getByToken, loading };
}
