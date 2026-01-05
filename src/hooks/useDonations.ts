import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export interface Donation {
  id: string;
  donor_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  amount: number | null;
  currency: string | null;
  amount_value: number | null;
  amount_currency: string | null;
  payment_method: string | null;
  payment_status: string | null;
  type: string | null;
  description: string | null;
  donation_date: string;
  purpose: string | null;
  notes: string | null;
  is_anonymous: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: string | null;
  metadata?: { quantity?: string } | null;
  quantity?: string | null;
}

export const useDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDonations = useCallback(async (filters?: { userId?: string; type?: string; limit?: number }) => {
    try {
      setLoading(true);
      
      // Sélectionnez SEULEMENT les colonnes existantes dans le schéma
      let query = supabase
        .from("donations")
        .select(`
          id,
          donor_id,
          donor_name,
          donor_email,
          amount,
          currency,
          amount_value,
          amount_currency,
          payment_method,
          payment_status,
          type,
          description,
          purpose,
          donation_date,
          notes,
          metadata,
          is_anonymous,
          is_verified,
          is_active,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.userId) query = query.eq("donor_id", filters.userId);
      if (filters?.type) query = query.eq("type", filters.type);

      const { data, error } = await query;

      if (error) throw error;
      
      setDonations(data as Donation[]);
      setLoading(false);
      return data as Donation[];
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erreur lors du chargement des donations:", err);
      
      if (String(err?.message || "").toLowerCase().includes("column") && String(err?.message || "").toLowerCase().includes("does not exist")) {
        toast({
          title: "Erreur de schéma",
          description: "Vérifiez les colonnes de votre table donations",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les donations.",
          variant: "destructive",
        });
      }
      setLoading(false);
      return [];
    }
  }, [toast]);

  // Charger les donations au montage du composant
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const createDonation = async (donationData: Partial<Donation>) => {
    try {
      // Préparez les données selon votre schéma réel
      type DonationInsert = Database['public']['Tables']['donations']['Insert'];

      const payload: Partial<DonationInsert> = {
        type: donationData.type,
        donation_date: donationData.donation_date || new Date().toISOString().split('T')[0],
        purpose: (donationData as Partial<Donation>).location || null,
        description: donationData.description || null,
        // store quantity in metadata since table doesn't have a dedicated column
        metadata: donationData.quantity ? { quantity: donationData.quantity } : undefined,
        notes: donationData.notes || null,
        is_anonymous: donationData.is_anonymous || false,
        donor_name: donationData.is_anonymous ? null : donationData.donor_name || null,
        donor_email: donationData.donor_email || null,
      };

      // Gestion du montant - choisissez UNE colonne (amount ou amount_value)
      if (donationData.amount_value !== undefined && donationData.amount_value !== null) {
        // store both amount_value (optional) and amount (required by schema)
        payload.amount_value = donationData.amount_value;
        payload.amount = donationData.amount_value as number;
        if (donationData.amount_currency) {
          payload.amount_currency = donationData.amount_currency.substring(0, 3);
          payload.currency = donationData.amount_currency.substring(0, 3);
        }
      } else if (donationData.amount !== undefined && donationData.amount !== null) {
        payload.amount = donationData.amount as number;
        if (donationData.currency) {
          payload.currency = donationData.currency;
        }
      } else {
        // Default to 0 if no amount provided (required by schema)
        payload.amount = 0;
      }

      // Gestion du donateur
      if (donationData.donor_id) {
        payload.donor_id = donationData.donor_id;
      }

      // Valeurs par défaut pour les nouvelles colonnes
      payload.is_verified = false;
      payload.is_active = true;
      payload.payment_status = 'pending';
      if (donationData.payment_method) {
        payload.payment_method = donationData.payment_method;
      }

      // Cast payload to DonationInsert with required amount field
      const insertPayload = payload as DonationInsert;
      const { error } = await supabase
        .from("donations")
        .insert([insertPayload]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre don a été enregistré. Merci !",
      });

      await fetchDonations();
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erreur lors de la création du don:", err);
      
      // Aide au débogage pour les erreurs de schéma
      if (err.message?.includes("column") && err.message?.includes("does not exist")) {
        toast({
          title: "Erreur de schéma",
          description: `Colonne manquante: ${err.message}. Vérifiez votre table donations.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer votre don.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const updateDonation = async (id: string, updates: Partial<Donation>) => {
    try {
      const { error } = await supabase
        .from("donations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Don mis à jour.",
      });

      await fetchDonations();
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erreur lors de la mise à jour du don:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le don.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDonation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("donations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Don supprimé.",
      });

      setDonations(donations.filter((d) => d.id !== id));
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erreur lors de la suppression du don:", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le don.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    donations,
    loading,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  };
};