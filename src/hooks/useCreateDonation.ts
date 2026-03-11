import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreateDonationInput {
  amount: number;
  currency: string;
  payment_method: string;
  payer_name: string;
  payer_email: string;
  payer_phone?: string;
  intention_message?: string;
  is_anonymous?: boolean;
}

export const useCreateDonation = () => {
  const [loading, setLoading] = useState(false);

  const createDonation = async (input: CreateDonationInput) => {
    setLoading(true);

    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("donations")
      .insert({
        user_id: user && !input.is_anonymous ? user.id : null,
        amount: input.amount,
        currency: input.currency,
        payment_method: input.payment_method,
        payer_name: input.payer_name,
        payer_email: input.payer_email,
        payer_phone: input.payer_phone,
        intention_message: input.intention_message,
        is_anonymous: input.is_anonymous || false,
        payment_status: "pending",
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  };

  return { createDonation, loading };
};