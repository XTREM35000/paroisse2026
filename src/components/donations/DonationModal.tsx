import React, { useState } from "react";
import UnifiedFormModal from "@/components/ui/unified-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmailInputWithSuffix from "@/components/EmailInputWithSuffix";
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

  const getMinAmount = (currency: string) => {
    switch (currency) {
      case "XOF": return 5000;
      case "EUR": return 8;
      case "USD": return 8;
      case "CAD": return 10;
      case "GBP": return 7;
      case "CNY": return 60;
      default: return 5000;
    }
  };
  const [form, setForm] = useState({
    amount: getMinAmount("XOF").toString(),
    payerName: "",
    payerEmail: "",
  });
  const [emailValid, setEmailValid] = useState(true);

  const getMinAmount = (currency: string) => {
    switch (currency) {
      case "XOF": return 5000;
      case "EUR": return 8;
      case "USD": return 8;
      case "CAD": return 10;
      case "GBP": return 7;
      case "CNY": return 60;
      default: return 5000;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = getMinAmount("XOF"); // à adapter si multidevise
    const amt = Number(form.amount);
    if (isNaN(amt) || amt < min) {
      alert(`Le montant minimum est ${min} XOF`);
      return;
    }
    if (!emailValid || !form.payerEmail) {
      alert("Veuillez saisir un email valide.");
      return;
    }
    try {
      setLoading(true);
      const donation = await onSubmit({
        amount: amt,
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
            min={getMinAmount("XOF")}
            step="1"
            pattern="[0-9]*"
            inputMode="numeric"
            value={form.amount}
            placeholder={`Montant (min ${getMinAmount("XOF")} XOF)`}
            onChange={(e) => {
              // Empêche la saisie non numérique
              const val = e.target.value.replace(/[^0-9]/g, "");
              setForm({ ...form, amount: val });
            }}
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
          <EmailInputWithSuffix
            email={form.payerEmail}
            onEmailChange={(v) => setForm({ ...form, payerEmail: v })}
            onValidationChange={setEmailValid}
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