/**
 * Hook pour créer une donation
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CreateDonationInput {
  amount: number;
  currency: string;
  payment_method: string;
  campaign_id?: string;
  payer_name: string;
  payer_email: string;
  payer_phone?: string;
  intention_message?: string;
  is_anonymous?: boolean;
}

export interface ParsedDonation {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  payer_name: string;
  payer_email: string;
  payer_phone?: string;
  created_at?: string;
}

interface UseCreateDonationResult {
  createDonation: (input: CreateDonationInput) => Promise<ParsedDonation | null>;
  loading: boolean;
  error: string | null;
}

export function useCreateDonation(): UseCreateDonationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDonation = async (input: CreateDonationInput): Promise<ParsedDonation | null> => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Vous devez être connecté pour faire un don');
      }

      // Créer la donation
      const { data, error: insertError } = await supabase
        .from('donations')
        .insert({
          user_id: user.id,
          amount: input.amount,
          currency: input.currency,
          payment_method: input.payment_method,
          payment_status: 'pending',
          campaign_id: input.campaign_id || null,
          payer_name: input.payer_name || user.user_metadata?.full_name || '',
          payer_email: input.payer_email || user.email || '',
          payer_phone: input.payer_phone || null,
          intention_message: input.intention_message || null,
          is_anonymous: input.is_anonymous || false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data as ParsedDonation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la donation';
      setError(message);
      console.error('useCreateDonation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createDonation, loading, error };
}
