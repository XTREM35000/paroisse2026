/**
 * Hook pour récupérer les méthodes de paiement actives
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

  id: string;
  code: string;
  label: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  requires_validation: boolean;
  display_order?: number;
  image?: string;
}

interface UseDonationMethodsResult {
  methods: PaymentMethod[];
  loading: boolean;
  error: string | null;
}

// Fallback methods if DB is not available
const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    code: 'card',
    label: 'Carte Bancaire',
    icon: 'CreditCard',
    description: 'Paiement par Stripe',
    is_active: true,
    requires_validation: false,
    display_order: 1,
  },
  {
    id: '2',
    code: 'mobile_money',
    label: 'Mobile Money',
    icon: 'Smartphone',
    description: 'Wave, Orange, Moov',
    is_active: true,
    requires_validation: true,
    display_order: 2,
  },
  {
    id: '3',
    code: 'cash',
    label: 'Espèces',
    icon: 'DollarSign',
    description: 'Au bureau de la Paroisse',
    is_active: true,
    requires_validation: true,
    display_order: 3,
  },
];

function useDonationMethods(): UseDonationMethodsResult {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) {
          console.warn('Payment methods DB fetch failed, using defaults:', fetchError.message);
          setMethods(DEFAULT_PAYMENT_METHODS);
          return;
        }

        if (data && data.length > 0) {
          setMethods(data as PaymentMethod[]);
        } else {
          console.warn('No payment methods found in DB, using defaults');
          setMethods(DEFAULT_PAYMENT_METHODS);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des méthodes de paiement';
        setError(message);
        console.error('useDonationMethods error:', err);
        // Fallback to default methods even on error
        setMethods(DEFAULT_PAYMENT_METHODS);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  return { methods, loading, error };
}

export { useDonationMethods };
