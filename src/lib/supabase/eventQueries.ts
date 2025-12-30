import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/database';

export async function fetchEvents(options?: { upcoming?: boolean; limit?: number }) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published');

  if (options?.upcoming) {
    query = query.gte('start_date', new Date().toISOString());
  }

  query = query.order('start_date', { ascending: true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Event[];
}

export async function fetchUpcomingEvents(limit = 5) {
  return fetchEvents({ upcoming: true, limit });
}

export async function createEvent(event: {
  title: string;
  description?: string;
  start_date: string;
  location?: string;
  organizer_id?: string;
}) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
  return true;
}
