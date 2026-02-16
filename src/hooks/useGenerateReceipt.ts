/**
 * Hook pour générer un reçu de donation
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptData {
  donation_id: string;
  receipt_number: string;
  payment_method: string;
  pdf_url?: string;
  qr_code_data?: string;
}

interface UseGenerateReceiptResult {
  generateReceipt: (donationId: string, paymentMethod: string) => Promise<ReceiptData | null>;
  loading: boolean;
  error: string | null;
}

export function useGenerateReceipt(): UseGenerateReceiptResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReceipt = async (donationId: string, paymentMethod: string): Promise<ReceiptData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Générer un numéro de reçu unique
      const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Insérer le reçu dans la table receipts
      const { data, error: insertError } = await supabase
        .from('receipts')
        .insert({
          donation_id: donationId,
          receipt_number: receiptNumber,
          payment_method: paymentMethod,
          qr_code_data: `https://donate.paroisse.local/receipt/${receiptNumber}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        donation_id: donationId,
        receipt_number: receiptNumber,
        payment_method: paymentMethod,
        qr_code_data: (data as any)?.qr_code_data,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération du reçu';
      setError(message);
      console.error('useGenerateReceipt error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generateReceipt, loading, error };
}
