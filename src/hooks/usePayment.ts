import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentResult {
  paymentUrl?: string;
  manualReceiptUrl?: string;
  method: string;
}

export const usePayment = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const processPayment = useCallback(
    async ({ donationId }: { donationId: string }): Promise<PaymentResult> => {
      setStatus("pending");
      setMessage("Initialisation du paiement...");

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { donationId },
      });

      if (error) {
        console.error(error);
        setStatus("failed");
        setMessage("Erreur lors du paiement");
        throw error;
      }

      if (data.method === "manual") {
        setStatus("completed");
        setMessage("Don enregistré. Merci !");
      } else {
        setStatus("processing");
        setMessage("Redirection vers la plateforme sécurisée...");
      }

      return data;
    },
    []
  );

  return { processPayment, status, message, setStatus, setMessage };
};