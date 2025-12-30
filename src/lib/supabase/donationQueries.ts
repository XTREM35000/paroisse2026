import { supabase } from '@/integrations/supabase/client';
import type { Donation, DonationCampaign } from '@/types/database';

export async function fetchDonations(options?: { donorId?: string; limit?: number }) {
  let query = supabase.from('donations').select('*');

  if (options?.donorId) {
    query = query.eq('donor_id', options.donorId);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Donation[];
}

export async function createDonation(donation: {
  amount: number;
  donor_id?: string;
  donor_name?: string;
  donor_email?: string;
  campaign_id?: string;
  message?: string;
}) {
  const { data, error } = await supabase
    .from('donations')
    .insert([donation])
    .select()
    .single();

  if (error) throw error;
  return data as Donation;
}

export async function fetchCampaigns(options?: { isActive?: boolean; limit?: number }) {
  let query = supabase.from('donation_campaigns').select('*');

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DonationCampaign[];
}

export async function createCampaign(campaign: {
  title: string;
  description?: string;
  goal_amount?: number;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('donation_campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) throw error;
  return data as DonationCampaign;
}

export async function fetchActiveCampaigns() {
  return fetchCampaigns({ isActive: true });
}
