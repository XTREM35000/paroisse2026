/**
 * Résumé de donation
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DonationSummaryProps {
  donationId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  receiptNumber: string;
  onDownloadReceipt?: () => void;
  onReturn?: () => void;
}

export const DonationSummary: React.FC<DonationSummaryProps> = ({
  donationId,
  amount,
  currency,
  paymentMethod,
  receiptNumber,
  onDownloadReceipt,
  onReturn,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Merci pour votre don !</h2>

      <div className="bg-green-50 rounded-lg p-4 mb-6 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Montant :</span>
          <span className="font-semibold">
            {amount.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Méthode :</span>
          <span className="font-semibold">{paymentMethod}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Numéro de reçu :</span>
          <span className="font-mono text-sm">{receiptNumber}</span>
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mb-6">
        Un reçu a été envoyé à votre adresse email. Le numéro de votre donation est {donationId}.
      </p>

      <div className="flex gap-2">
        {onDownloadReceipt && (
          <Button onClick={onDownloadReceipt} variant="outline" className="flex-1">
            Télécharger Reçu
          </Button>
        )}
        {onReturn && (
          <Button onClick={onReturn} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            Retour
          </Button>
        )}
      </div>
    </div>
  );
};

export default DonationSummary;
