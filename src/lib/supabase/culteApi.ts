import { supabase } from '@/integrations/supabase/client';
import type {
  CulteRequestType,
  FaqModerationStatus,
  FaqRow,
  OfficiantRow,
  RequestPriority,
  RequestRow,
  RequestStatus,
} from '@/types/culte';

function isMissingRelationError(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  const code = String(err?.code ?? '');
  const message = String(err?.message ?? '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist')
  );
}

export async function fetchOfficiants(paroisseId: string): Promise<OfficiantRow[]> {
  const { data, error } = await supabase
    .from('officiants')
    .select('*')
    .eq('paroisse_id', paroisseId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OfficiantRow[];
}

export async function fetchDailyOfficiant(
  paroisseId: string,
  dateIso: string,
): Promise<{ officiant: OfficiantRow | null }> {
  const day = dateIso.slice(0, 10);
  const { data: row, error } = await supabase
    .from('daily_officiant')
    .select('officiant_id')
    .eq('paroisse_id', paroisseId)
    .eq('date', day)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) {
      // daily_officiant table is optional in some environments.
      return { officiant: null };
    }
    throw error;
  }
  if (!row?.officiant_id) return { officiant: null };
  const { data: off, error: e2 } = await supabase
    .from('officiants')
    .select('*')
    .eq('id', row.officiant_id)
    .maybeSingle();
  if (e2) throw e2;
  return { officiant: (off as OfficiantRow) ?? null };
}

export async function insertRequest(payload: {
  paroisse_id: string;
  type: CulteRequestType;
  is_anonymous: boolean;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  location: string | null;
  preferred_date: string | null;
  preferred_officiant_id: string | null;
  default_officiant_id: string | null;
  duration_minutes: number | null;
  description: string | null;
  priority: RequestPriority;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('requests').insert({
    paroisse_id: payload.paroisse_id,
    type: payload.type,
    is_anonymous: payload.is_anonymous,
    user_id: payload.user_id,
    user_name: payload.user_name,
    user_email: payload.user_email,
    user_phone: payload.user_phone,
    location: payload.location,
    preferred_date: payload.preferred_date,
    preferred_officiant_id: payload.preferred_officiant_id,
    default_officiant_id: payload.default_officiant_id,
    duration_minutes: payload.duration_minutes,
    description: payload.description,
    priority: payload.priority,
    metadata: payload.metadata,
  });
  if (error) throw error;
}

export async function listRequestsAdmin(
  paroisseId: string,
  filters?: { type?: CulteRequestType; status?: RequestStatus },
): Promise<RequestRow[]> {
  let q = supabase.from('requests').select('*').eq('paroisse_id', paroisseId).order('created_at', { ascending: false });
  if (filters?.type) q = q.eq('type', filters.type);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RequestRow[];
}

export async function updateRequestAdmin(
  id: string,
  patch: Partial<{
    status: RequestStatus;
    admin_notes: string | null;
    preferred_officiant_id: string | null;
  }>,
): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function upsertOfficiant(
  row: Partial<OfficiantRow> & { paroisse_id: string; name: string },
): Promise<void> {
  const payload: Record<string, unknown> = {
    paroisse_id: row.paroisse_id,
    name: row.name,
    title: row.title ?? null,
    description: row.description ?? null,
    bio: row.bio ?? null,
    photo_url: row.photo_url ?? null,
    is_active: row.is_active ?? true,
    sort_order: Number(row.sort_order ?? row.display_order ?? 0) || 0,
  };

  if (row.id) {
    payload.id = row.id;
  }

  const { error } = await supabase.from('officiants').upsert(payload as any);
  if (error) throw error;
}

export async function deleteOfficiant(id: string): Promise<void> {
  const { error } = await supabase.from('officiants').delete().eq('id', id);
  if (error) throw error;
}

export async function listAllOfficiantsAdmin(paroisseId: string): Promise<OfficiantRow[]> {
  const { data, error } = await supabase
    .from('officiants')
    .select('*')
    .eq('paroisse_id', paroisseId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OfficiantRow[];
}

export async function setDailyOfficiant(paroisseId: string, dateIso: string, officiantId: string | null): Promise<void> {
  const day = dateIso.slice(0, 10);
  const { error } = await supabase.from('daily_officiant').upsert(
    {
      paroisse_id: paroisseId,
      date: day,
      officiant_id: officiantId,
    },
    { onConflict: 'paroisse_id,date' },
  );
  if (error) {
    if (isMissingRelationError(error)) {
      // Keep page functional if migration for daily_officiant is not applied yet.
      return;
    }
    throw error;
  }
}

export async function fetchPublishedFaqs(paroisseId: string): Promise<FaqRow[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('paroisse_id', paroisseId)
    .eq('moderation_status', 'published')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FaqRow[];
}

export async function insertFaqQuestion(payload: {
  paroisse_id: string;
  question: string;
  category: string | null;
  author_name: string | null;
  author_email: string | null;
  user_id: string | null;
  is_anonymous: boolean;
}): Promise<void> {
  const { error } = await supabase.from('faqs').insert({
    paroisse_id: payload.paroisse_id,
    question: payload.question,
    category: payload.category,
    author_name: payload.author_name,
    author_email: payload.author_email,
    user_id: payload.user_id,
    is_anonymous: payload.is_anonymous,
    moderation_status: 'pending',
  });
  if (error) throw error;
}

export async function listFaqsAdmin(paroisseId: string): Promise<FaqRow[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('paroisse_id', paroisseId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FaqRow[];
}

export async function updateFaqAdmin(
  id: string,
  patch: Partial<{
    answer: string | null;
    moderation_status: FaqModerationStatus;
    category: string | null;
    is_pinned: boolean;
  }>,
): Promise<void> {
  const publishedAt =
    patch.moderation_status === 'published'
      ? new Date().toISOString()
      : undefined;
  const { error } = await supabase
    .from('faqs')
    .update({
      ...patch,
      ...(publishedAt ? { published_at: publishedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteFaqAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
}

export async function castFaqVote(faqId: string, vote: 1 | -1): Promise<void> {
  const { error } = await supabase.rpc('faq_cast_vote', {
    p_faq_id: faqId,
    p_vote: vote,
  });
  if (error) throw error;
}
