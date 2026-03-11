import React, { useState } from "react";
import UnifiedFormModal from "@/components/ui/unified-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface Props {
  open: boolean;
  onClose: () => void;
    onSubmit: (data: {
      amount: number;
      currency: string;
      payment_method: string;
      payer_name: string;
      payer_email: string;
      payer_phone?: string;
      intention_message?: string;
      is_anonymous?: boolean;
    }) => Promise<{ id: string; donor_id?: string; donor_name?: string; donor_email?: string; amount: number; currency: string; payment_method: string; payment_status?: string; purpose?: string; intention_id?: string; is_active?: boolean }>;
  selectedPaymentMethod: string;
}

export default function DonationModal({
  open,
  onClose,
  onSubmit,
  selectedPaymentMethod,
}: Props) {
  const [loading, setLoading] = useState(false);

  const { processPayment } = usePayment();

  const [form, setForm] = useState({
    amount: "",
    payerName: "",
    payerEmail: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const donation = await onSubmit({
        amount: Number(form.amount),
        currency: "XOF",
        payment_method: selectedPaymentMethod,
        payer_name: form.payerName,
        payer_email: form.payerEmail,
      });

      const payment = await processPayment({
        donationId: donation.id,
      });

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      }
    } catch (error) {
      console.error(error);
      alert("Erreur paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedFormModal open={open} onClose={onClose} title="Faire un don">
      <form onSubmit={submit} className="space-y-4">

        <div>
          <Label>Montant</Label>
          <Input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Nom</Label>
          <Input
            value={form.payerName}
            onChange={(e) =>
              setForm({ ...form, payerName: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            value={form.payerEmail}
            onChange={(e) =>
              setForm({ ...form, payerEmail: e.target.value })
            }
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Loader className="animate-spin mr-2" />}
          Continuer
        </Button>

      </form>
    </UnifiedFormModal>
  );
}