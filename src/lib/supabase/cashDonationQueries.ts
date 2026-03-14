import { supabase } from '@/integrations/supabase/client';

export type CashIntentionStatus = 'pending' | 'intention' | 'completed' | 'failed' | 'cancelled';

export interface CashIntentionRow {
  id: string;
  donor_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone?: string | null;
  payer_name?: string | null;
  payer_phone?: string | null;
  payer_email?: string | null;
  intention_message?: string | null;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  payment_status: string | null;
  purpose: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  status?: string | null;
  intention_token?: string | null;
  receipt_number?: string | null;
}

export interface CreateIntentionInput {
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  intended_amount?: number;
  message?: string;
}

export interface ValidateIntentionInput {
  actual_amount: number;
  receipt_number?: string;
  notes?: string;
}

function generateIntentionToken(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INT-${date}-${random}`;
}

export async function createIntention(data: CreateIntentionInput): Promise<{ id: string; intention_token: string }> {
  const intention_token = generateIntentionToken();
  const name = (data.donor_name ?? '').trim();
  const phone = (data.donor_phone ?? '').trim();
  const email = (data.donor_email ?? '').trim() || null;
  const message = (data.message ?? '').trim() || null;

  // Schéma réel : payer_*, intention_message, intention_token, donor_phone (pas de type, donor_name, etc.)
  const payload: Record<string, unknown> = {
    user_id: null,
    is_anonymous: !name,
    payer_name: name || null,
    payer_email: email,
    payer_phone: phone || null,
    intention_message: message,
    amount: data.intended_amount ?? 0,
    currency: 'XOF',
    payment_method: 'cash',
    payment_status: 'intention',
    intention_token,
    donor_phone: phone || null,
    metadata: {},
  };

  const { data: row, error } = await supabase
    .from('donations')
    .insert(payload as Record<string, never>)
    .select('id, intention_token')
    .single();

  if (error) throw error;
  const token = (row as { intention_token?: string })?.intention_token ?? intention_token;
  return { id: (row as { id: string }).id, intention_token: token };
}

export async function getPendingIntentions(): Promise<CashIntentionRow[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('payment_method', 'cash')
    .eq('payment_status', 'intention')
    .not('intention_token', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CashIntentionRow[];
}

export async function findIntentionByToken(token: string): Promise<CashIntentionRow | null> {
  const t = token.trim().toUpperCase();
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('intention_token', t)
    .maybeSingle();

  if (error) throw error;
  return data as CashIntentionRow | null;
}

export async function validateIntention(
  donationId: string,
  data: ValidateIntentionInput
): Promise<void> {
  const update: Record<string, unknown> = {
    amount: data.actual_amount,
    payment_status: 'completed',
    receipt_number: data.receipt_number ?? null,
  };
  if (data.receipt_number || data.notes) {
    const { data: current } = await supabase.from('donations').select('metadata').eq('id', donationId).single();
    const meta: Record<string, unknown> = { ...((current?.metadata as Record<string, unknown>) ?? {}) };
    if (data.receipt_number) meta.receipt_number = data.receipt_number;
    if (data.notes) meta.notes = data.notes;
    update.metadata = meta;
  }
  const { error } = await supabase
    .from('donations')
    .update(update as Record<string, never>)
    .eq('id', donationId);
  if (error) throw error;
}

export async function getAllCashDonations(): Promise<CashIntentionRow[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('payment_method', 'cash')
    .not('intention_token', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CashIntentionRow[];
}

export interface CreateDirectReceiptInput {
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  amount: number;
  intention_message?: string;
  receipt_number?: string;
}

export async function createDirectReceipt(data: CreateDirectReceiptInput): Promise<{ id: string; intention_token: string }> {
  const intention_token = generateIntentionToken();
  const payload: Record<string, unknown> = {
    user_id: null,
    is_anonymous: !data.payer_name?.trim(),
    payer_name: data.payer_name?.trim() || null,
    payer_email: (data.payer_email ?? '').trim() || null,
    payer_phone: (data.payer_phone ?? '').trim() || null,
    donor_phone: (data.payer_phone ?? '').trim() || null,
    intention_message: (data.intention_message ?? '').trim() || null,
    amount: data.amount,
    currency: 'XOF',
    payment_method: 'cash',
    payment_status: 'completed',
    intention_token,
    receipt_number: data.receipt_number ?? null,
    metadata: {},
  };

  const { data: row, error } = await supabase
    .from('donations')
    .insert(payload as Record<string, never>)
    .select('id, intention_token')
    .single();

  if (error) throw error;
  return { id: (row as { id: string }).id, intention_token: (row as { intention_token?: string }).intention_token ?? intention_token };
}

export async function updateCashDonation(
  id: string,
  updates: Partial<{ payer_name: string; payer_phone: string; payer_email: string; amount: number; intention_message: string; receipt_number: string }>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.payer_name !== undefined) payload.payer_name = updates.payer_name || null;
  if (updates.payer_phone !== undefined) {
    payload.payer_phone = updates.payer_phone || null;
    payload.donor_phone = updates.payer_phone || null;
  }
  if (updates.payer_email !== undefined) payload.payer_email = updates.payer_email || null;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.intention_message !== undefined) payload.intention_message = updates.intention_message || null;
  if (updates.receipt_number !== undefined) payload.receipt_number = updates.receipt_number || null;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from('donations').update(payload as Record<string, never>).eq('id', id);
  if (error) throw error;
}

export async function deleteCashDonation(id: string): Promise<void> {
  const { error } = await supabase.from('donations').delete().eq('id', id);
  if (error) throw error;
}
