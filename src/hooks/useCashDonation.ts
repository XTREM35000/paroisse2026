import { useState, useCallback, useEffect } from 'react';
import {
  getPendingIntentions,
  validateIntention,
  findIntentionByToken,
  getAllCashDonations,
  createDirectReceipt,
  updateCashDonation,
  deleteCashDonation,
  type CashIntentionRow,
  type ValidateIntentionInput,
  type CreateDirectReceiptInput,
} from '@/lib/supabase/cashDonationQueries';
import { useToast } from '@/hooks/use-toast';

export function useCashDonation() {
  const [pending, setPending] = useState<CashIntentionRow[]>([]);
  const [allCash, setAllCash] = useState<CashIntentionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<CashIntentionRow | null>(null);
  const { toast } = useToast();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPendingIntentions();
      setPending(list);
      return list;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur chargement';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAllCash = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllCashDonations();
      setAllCash(list);
      return list;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur chargement';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const searchByToken = useCallback(async (token: string): Promise<CashIntentionRow | null> => {
    if (!token.trim()) return null;
    setLoading(true);
    setSearchResult(null);
    try {
      const row = await findIntentionByToken(token.trim());
      setSearchResult(row);
      return row;
    } catch {
      setSearchResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processIntention = useCallback(
    async (donationId: string, data: ValidateIntentionInput): Promise<boolean> => {
      setLoading(true);
      try {
        await validateIntention(donationId, data);
        toast({ title: 'Don validé', description: 'Le reçu a été enregistré.' });
        await fetchPending();
        await fetchAllCash();
        setSearchResult(null);
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur lors de la validation';
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, fetchPending, fetchAllCash]
  );

  const createDirect = useCallback(
    async (data: CreateDirectReceiptInput): Promise<{ id: string; intention_token: string } | null> => {
      setLoading(true);
      try {
        const res = await createDirectReceipt(data);
        toast({ title: 'Reçu créé', description: 'Paiement en espèces enregistré.' });
        await fetchPending();
        await fetchAllCash();
        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur création';
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast, fetchPending, fetchAllCash]
  );

  const updateDonation = useCallback(
    async (id: string, updates: Parameters<typeof updateCashDonation>[1]): Promise<boolean> => {
      setLoading(true);
      try {
        await updateCashDonation(id, updates);
        toast({ title: 'Modification enregistrée' });
        await fetchPending();
        await fetchAllCash();
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur mise à jour';
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, fetchPending, fetchAllCash]
  );

  const removeDonation = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await deleteCashDonation(id);
        toast({ title: 'Don supprimé' });
        await fetchPending();
        await fetchAllCash();
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur suppression';
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, fetchPending, fetchAllCash]
  );

  return {
    pending,
    allCash,
    searchResult,
    loading,
    fetchPending,
    fetchAllCash,
    searchByToken,
    processIntention,
    createDirect,
    updateDonation,
    removeDonation,
    clearSearchResult: () => setSearchResult(null),
  };
}
