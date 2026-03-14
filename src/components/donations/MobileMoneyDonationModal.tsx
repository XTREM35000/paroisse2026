import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedFormModal from "@/components/ui/unified-form-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useCinetPay } from "@/hooks/useCinetPay";
import { useCreateDonation } from "@/hooks/useCreateDonation";

type MobileMoneyProvider = "mtn" | "orange" | "moov" | "wave";
type Step = "provider" | "payment";

interface MobileMoneyDonationModalProps {
  open: boolean;
  onClose: () => void;
}

const providerLogos: Record<MobileMoneyProvider, string> = {
  mtn: "/svg/MTN.svg",
  orange: "/svg/ORANGE.svg",
  moov: "/svg/MOOV.svg",
  wave: "/svg/WAVE.svg",
};

const providerNames: Record<MobileMoneyProvider, string> = {
  mtn: "MTN Money",
  orange: "Orange Money",
  moov: "Moov Money",
  wave: "Wave",
};

const providerValidation: Record<MobileMoneyProvider, (phone: string) => boolean> = {
  // MTN CI : 05XXXXXXXX
  mtn: (phone) => /^05[0-9]{8}$/.test(phone),
  // Orange CI : 07XXXXXXXX
  orange: (phone) => /^07[0-9]{8}$/.test(phone),
  // Moov CI : 01XXXXXXXX
  moov: (phone) => /^01[0-9]{8}$/.test(phone),
  // Wave : accepte les principaux préfixes Mobile Money
  wave: (phone) => /^(07|05|01)[0-9]{8}$/.test(phone),
};

const providerPlaceholders: Record<MobileMoneyProvider, string> = {
  mtn: "05 XX XX XX XX",
  orange: "07 XX XX XX XX",
  moov: "01 XX XX XX XX",
  wave: "07 / 05 / 01 XX XX XX XX",
};

// Formater le numéro au format international (+225...)
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, "");

  if (cleaned.startsWith("0")) {
    return "+225" + cleaned.substring(1);
  } else if (cleaned.startsWith("225") && !cleaned.startsWith("+")) {
    return "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    return "+225" + cleaned;
  }

  return cleaned;
};

export default function MobileMoneyDonationModal({
  open,
  onClose,
}: MobileMoneyDonationModalProps) {
  const { processPayment, loading } = useCinetPay();
  const { createDonation } = useCreateDonation();

  const [step, setStep] = useState<Step>("provider");
  const [provider, setProvider] = useState<MobileMoneyProvider>("mtn");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handleClose = () => {
    setStep("provider");
    setProvider("mtn");
    setAmount("");
    setPhone("");
    setName("");
    setEmail("");
    setPhoneError("");
    setPhoneTouched(false);
    onClose();
  };

  const validatePhone = (rawPhone: string) => {
    const formatted = formatPhoneNumber(rawPhone);
    const localNumber = formatted.replace("+225", "");
    const isValid = providerValidation[provider](localNumber);
    setPhoneError(
      isValid ? "" : `Numéro invalide pour ${providerNames[provider]}`
    );
    return isValid;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    setPhone(value);
    if (phoneTouched) {
      validatePhone(value);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    validatePhone(phone);
  };

  const handleProviderSelect = (selectedProvider: MobileMoneyProvider) => {
    setProvider(selectedProvider);
    setStep("payment");
    setPhone("");
    setPhoneError("");
    setPhoneTouched(false);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formattedPhone = formatPhoneNumber(phone);

    if (!validatePhone(phone)) {
      setPhoneTouched(true);
      return;
    }

    const amountNum = Number(amount);
    const parts = (name || "Donateur").trim().split(/\s+/);
    const firstName = parts[0] || "Donateur";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      const donation = await createDonation({
        amount: amountNum,
        currency: "XOF",
        payment_method: "cinetpay",
        payer_name: name || "Donateur",
        payer_email: email,
        payer_phone: formattedPhone,
        is_anonymous: !name,
      });

      const paymentMethod =
        provider === "orange" ? "OM" : provider === "mtn" ? "MTN" : provider === "moov" ? "MOOV" : undefined;

      await processPayment({
        amount: amountNum,
        client_first_name: firstName,
        client_last_name: lastName,
        client_email: email,
        client_phone_number: formattedPhone,
        payment_method: paymentMethod,
        donationId: donation.id,
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <UnifiedFormModal open={open} onClose={handleClose} title="Paiement Mobile Money">
      <AnimatePresence mode="wait">
        {step === "provider" ? (
          <motion.div
            key="provider"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <p className="text-center text-gray-600 mb-4">
              Sélectionnez votre opérateur Mobile Money
            </p>

            <div className="grid grid-cols-2 gap-4">
              {(["mtn", "orange", "moov", "wave"] as const).map((prov) => (
                <motion.button
                  key={prov}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleProviderSelect(prov)}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <img
                    src={providerLogos[prov]}
                    alt={providerNames[prov]}
                    className="h-12 w-auto mb-3"
                  />
                  <span className="text-sm font-medium">
                    {providerNames[prov]}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col items-center mb-6">
              <img
                src={providerLogos[provider]}
                alt={providerNames[provider]}
                className="h-16 w-auto mb-2"
              />
              <p className="text-sm text-gray-500">{providerNames[provider]}</p>
              <button
                type="button"
                onClick={() => setStep("provider")}
                className="text-xs text-orange-600 hover:text-orange-700 mt-2 underline"
              >
                Changer d'opérateur
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  required
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  Numéro {providerNames[provider]}
                  {phoneTouched && !phoneError && phone && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  placeholder={providerPlaceholders[provider]}
                  required
                  className={`text-lg ${
                    phoneError && phoneTouched ? "border-red-500" : ""
                  }`}
                />
                {phoneError && phoneTouched && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 mt-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </motion.p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pour personnaliser votre don"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3"
                disabled={loading || (phoneTouched && !!phoneError)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement...
                  </div>
                ) : (
                  `Payer avec ${providerNames[provider]}`
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </UnifiedFormModal>
  );
}