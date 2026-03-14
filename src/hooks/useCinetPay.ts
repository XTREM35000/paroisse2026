import { useState, useCallback } from 'react';
import { initCinetPayPayment } from '@/lib/payments/cinetpay';
import { useToast } from '@/hooks/use-toast';

export const useCinetPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processPayment = useCallback(
    async (data: {
      amount: number;
      client_first_name: string;
      client_last_name: string;
      client_email: string;
      client_phone_number?: string;
      payment_method?: string;
      donationId: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const paymentPayload = {
          currency: 'XOF',
          payment_method: data.payment_method,
          merchant_transaction_id: `DON-${Date.now()}-${data.donationId}`,
          amount: data.amount,
          lang: 'fr',
          designation: 'Don Paroisse NDC',
          client_email: data.client_email,
          client_phone_number: data.client_phone_number,
          client_first_name: data.client_first_name,
          client_last_name: data.client_last_name,
          success_url: import.meta.env.VITE_CINETPAY_SUCCESS_URL,
          failed_url: import.meta.env.VITE_CINETPAY_FAILED_URL,
          notify_url: import.meta.env.VITE_CINETPAY_NOTIFY_URL,
          direct_pay: false,
        };

        const result = await initCinetPayPayment(paymentPayload);

        if (result.details?.must_be_redirected && result.payment_url) {
          window.location.href = result.payment_url;
        }

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur de paiement';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { processPayment, loading, error };
};
