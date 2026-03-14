import { useState } from 'react';
import UnifiedFormModal from '@/components/ui/unified-form-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCashIntention } from '@/hooks/useCashIntention';

interface CashIntentionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CashIntentionModal({ open, onClose }: CashIntentionModalProps) {
  const { submitIntention, loading } = useCashIntention();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [token, setToken] = useState('');
  const [donor_name, setDonorName] = useState('');
  const [donor_phone, setDonorPhone] = useState('');
  const [donor_email, setDonorEmail] = useState('');
  const [intended_amount, setIntendedAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitIntention({
      donor_name: donor_name.trim(),
      donor_phone: donor_phone.trim(),
      donor_email: donor_email.trim() || undefined,
      intended_amount: intended_amount ? Number(intended_amount) : undefined,
      message: message.trim() || undefined,
    });
    if (result) {
      setToken(result.intention_token);
      setStep('success');
    }
  };

  const handleClose = () => {
    setStep('form');
    setToken('');
    setDonorName('');
    setDonorPhone('');
    setDonorEmail('');
    setIntendedAmount('');
    setMessage('');
    onClose();
  };

  return (
    <UnifiedFormModal
      open={open}
      onClose={handleClose}
      title="Don au guichet"
      headerClassName="bg-amber-800"
    >
      {step === 'success' ? (
        <div className="text-center space-y-4 py-4">
          <p className="text-muted-foreground">
            Votre don sera enregistré et vous recevrez un reçu officiel au guichet.
          </p>
          <p className="text-sm font-medium text-foreground">Présentez ce code au guichet de la paroisse :</p>
          <div className="bg-muted/50 rounded-lg px-6 py-4 font-mono text-2xl font-bold tracking-widest text-primary">
            {token}
          </div>
          <p className="text-xs text-muted-foreground">
            Conservez ce code jusqu&apos;à la remise du reçu.
          </p>
          <Button type="button" onClick={handleClose} className="w-full">
            Fermer
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Remplissez ce formulaire. Vous recevrez un code à présenter au guichet pour finaliser votre don en espèces.
          </p>
          <div>
            <Label>Nom complet *</Label>
            <Input
              value={donor_name}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Jean Kouadio"
              required
            />
          </div>
          <div>
            <Label>Téléphone *</Label>
            <Input
              type="tel"
              value={donor_phone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              required
            />
          </div>
          <div>
            <Label>Email (optionnel)</Label>
            <Input
              type="email"
              value={donor_email}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="jean@email.com"
            />
          </div>
          <div>
            <Label>Montant prévu (FCFA, optionnel)</Label>
            <Input
              type="number"
              min={0}
              value={intended_amount}
              onChange={(e) => setIntendedAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div>
            <Label>Message (optionnel)</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Pour la collecte..."
            />
          </div>
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
            {loading ? 'Enregistrement...' : "Obtenir mon code d'intention"}
          </Button>
        </form>
      )}
    </UnifiedFormModal>
  );
}
