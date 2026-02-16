/**
 * Queries Supabase pour la gestion des donations
 */
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethodDB {
  id: string;
  code: string;
  label: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  requires_validation: boolean;
}

export interface DonationDB {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  provider?: string;
  transaction_ref?: string;
  campaign_id?: string;
  payer_name: string;
  payer_email: string;
  payer_phone?: string;
  intention_message?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReceiptDB {
  id: string;
  donation_id: string;
  receipt_number: string;
  payment_method: string;
  pdf_url?: string;
  qr_code_data?: string;
  created_at: string;
}

/**
 * Récupérer les méthodes de paiement actives
 */
export async function fetchPaymentMethods(): Promise<PaymentMethodDB[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Créer une nouvelle donation
 */
export async function createDonationRecord(donation: Omit<DonationDB, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('donations')
    .insert(donation)
    .select()
    .single();

  if (error) throw error;
  return data as DonationDB;
}

/**
 * Metà à jour le statut de paiement d'une donation
 */
export async function updateDonationStatus(
  donationId: string,
  status: 'confirmed' | 'failed' | 'refunded',
  transactionRef?: string
) {
  const { data, error } = await supabase
    .from('donations')
    .update({
      payment_status: status,
      transaction_ref: transactionRef || null,
    })
    .eq('id', donationId)
    .select()
    .single();

  if (error) throw error;
  return data as DonationDB;
}

/**
 * Créer un reçu pour une donation
 */
export async function createReceipt(receipt: Omit<ReceiptDB, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('receipts')
    .insert(receipt)
    .select()
    .single();

  if (error) throw error;
  return data as ReceiptDB;
}

/**
 * Récupérer les donations d'un utilisateur
 */
export async function fetchUserDonations(userId: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Récupérer une donation par ID
 */
export async function fetchDonationById(donationId: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .single();

  if (error) throw error;
  return data as DonationDB;
}

/**
 * Récupérer le reçu d'une donation
 */
export async function fetchReceiptByDonationId(donationId: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('donation_id', donationId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as ReceiptDB | null;
}

/**
 * Récupérer les statistiques de dons pour admin
 */
export async function fetchDonationStats(startDate?: string, endDate?: string) {
  let query = supabase
    .from('donations')
    .select('amount, payment_method, payment_status, created_at', { count: 'exact' });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    total: count || 0,
    donations: data || [],
    totalAmount: (data || []).reduce((sum, d) => sum + (d.amount || 0), 0),
  };
}

/**
 * Enregistrer le changement de statut dans l'audit log
 */
export async function logDonationStatusChange(
  donationId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
) {
  const { error } = await supabase
    .from('donation_audit_log')
    .insert({
      donation_id: donationId,
      old_status: oldStatus,
      new_status: newStatus,
      change_reason: reason,
    });

  if (error) throw error;
}
