/**
 * Modal de formulaire de donation (style Admin Live)
 */
import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DocumentEditorModal from '@/components/DocumentEditorModal';

export interface DonationFormData {
  amount: string;
  currency: string;
  paymentMethod: string;
  campaign?: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  intentionMessage?: string;
  isAnonymous: boolean;
}

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: DonationFormData) => Promise<void>;
  selectedPaymentMethod: string;
  campaigns?: Array<{ id: string; title: string }>;
  loading?: boolean;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  open,
  onClose,
  onSubmit,
  selectedPaymentMethod,
  campaigns = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState<DonationFormData>({
    amount: '',
    currency: 'XOF',
    paymentMethod: selectedPaymentMethod,
    payerName: '',
    payerEmail: '',
    payerPhone: '',
    intentionMessage: '',
    isAnonymous: false,
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    if (!formData.payerName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    if (!formData.payerEmail.trim()) {
      alert('Veuillez entrer votre email');
      return;
    }

    try {
      setSubmitLoading(true);
      await onSubmit(formData);
      // Reset form
      setFormData({
        amount: '',
        currency: 'XOF',
        paymentMethod: selectedPaymentMethod,
        payerName: '',
        payerEmail: '',
        payerPhone: '',
        intentionMessage: '',
        isAnonymous: false,
      });
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Erreur lors de la soumission du formulaire');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Keep internal paymentMethod in sync when parent selection changes
  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, paymentMethod: selectedPaymentMethod }));
  }, [selectedPaymentMethod]);

  return (
    <DocumentEditorModal
      open={open}
      onClose={onClose}
      title="Faire un don"
      headerClassName="bg-green-700"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Montant */}
        <div>
          <Label htmlFor="amount" className="text-gray-700">
            Montant *
          </Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="10000"
              className="mt-1 bg-white text-black border border-gray-300 flex-1"
              required
            />
            <div className="flex items-end">
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="mt-1 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Campagne (optionnel) */}
        {campaigns.length > 0 && (
          <div>
            <Label htmlFor="campaign" className="text-gray-700">
              Campagne (optionnel)
            </Label>
            <Select
              value={formData.campaign || ''}
              onValueChange={(value) => setFormData({ ...formData, campaign: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une campagne" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dateur */}
        <div>
          <Label htmlFor="payer_name" className="text-gray-700">
            Votre nom *
          </Label>
          <Input
            id="payer_name"
            value={formData.payerName}
            onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
            placeholder="Jean Dupont"
            className="mt-1 bg-white text-black border border-gray-300"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="payer_email" className="text-gray-700">
            Email *
          </Label>
          <Input
            id="payer_email"
            type="email"
            value={formData.payerEmail}
            onChange={(e) => setFormData({ ...formData, payerEmail: e.target.value })}
            placeholder="jean@example.com"
            className="mt-1 bg-white text-black border border-gray-300"
            required
          />
        </div>

        {/* Téléphone (optionnel) */}
        <div>
          <Label htmlFor="payer_phone" className="text-gray-700">
            Téléphone (optionnel)
          </Label>
          <Input
            id="payer_phone"
            type="tel"
            value={formData.payerPhone || ''}
            onChange={(e) => setFormData({ ...formData, payerPhone: e.target.value })}
            placeholder="+221 77 XXX XX XX"
            className="mt-1 bg-white text-black border border-gray-300"
          />
        </div>

        {/* Message intention (optionnel) */}
        <div>
          <Label htmlFor="intention_message" className="text-gray-700">
            Intention de prière (optionnel)
          </Label>
          <textarea
            id="intention_message"
            value={formData.intentionMessage || ''}
            onChange={(e) => setFormData({ ...formData, intentionMessage: e.target.value })}
            placeholder="Entrez votre intention..."
            className="mt-1 w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        {/* Anonyme */}
        <div className="flex items-center gap-2">
          <input
            id="anonymous"
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="anonymous" className="text-gray-700 cursor-pointer">
            Faire un don anonyme
          </Label>
        </div>

        {/* Footer */}
        <div className="border-t border-green-100 bg-gray-50 px-6 py-4 flex gap-2 justify-end -mx-6 -mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitLoading || loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitLoading || loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitLoading || loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
            Continuer
          </Button>
        </div>
      </form>
    </DocumentEditorModal>
  );
};

export default DonationModal;
