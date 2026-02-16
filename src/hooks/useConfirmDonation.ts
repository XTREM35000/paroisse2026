/**
 * Hook pour confirmer le paiement d'une donation
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseConfirmDonationResult {
  confirmDonation: (donationId: string, transactionRef?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useConfirmDonation(): UseConfirmDonationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDonation = async (donationId: string, transactionRef?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('donations')
        .update({
          payment_status: 'confirmed',
          transaction_ref: transactionRef || null,
        })
        .eq('id', donationId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la confirmation de la donation';
      setError(message);
      console.error('useConfirmDonation error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { confirmDonation, loading, error };
}
