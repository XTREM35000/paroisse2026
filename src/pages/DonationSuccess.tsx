/**
 * Page Donate Success - Confirmation de donation
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DonationSummary from '@/components/donations/DonationSummary';
import { Button } from '@/components/ui/button';

interface DonationRecord {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  [key: string]: unknown;
}

interface ReceiptRecord {
  id: string;
  donation_id: string;
  receipt_number: string;
  pdf_url?: string;
  [key: string]: unknown;
}

export default function DonationSuccess() {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState<DonationRecord | null>(null);
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!donationId) {
          navigate('/donate');
          return;
        }

        // Récupérer la donation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donationData, error: donationError } = await supabase
          .from(('donations') as any)
          .select('*')
          .eq('id', donationId)
          .single();

        if (donationError) throw donationError;
        setDonation(donationData);

        // Récupérer le reçu
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: receiptData } = await supabase
          .from(('receipts') as any)
          .select('*')
          .eq('donation_id', donationId)
          .single();

        if (receiptData) {
          setReceipt(receiptData);
        }
      } catch (err) {
        console.error('Error fetching donation data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [donationId, navigate]);

  const handleDownloadReceipt = () => {
    if (receipt?.pdf_url) {
      window.open(receipt.pdf_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loader"></div>
          <p>Chargement de votre confirmation...</p>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur : donation non trouvée</p>
          <Button onClick={() => navigate('/donate')} className="mt-4">
            Retour aux dons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <DonationSummary
          donationId={donation.id}
          amount={donation.amount}
          currency={donation.currency}
          paymentMethod={donation.payment_method}
          receiptNumber={receipt?.receipt_number || 'N/A'}
          onDownloadReceipt={receipt ? handleDownloadReceipt : undefined}
          onReturn={() => navigate('/')}
        />
      </div>
    </div>
  );
}
