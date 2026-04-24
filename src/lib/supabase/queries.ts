import { supabase } from "@/integrations/supabase/client";

export async function fetchExistingOfficiantTitles(paroisseId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('officiants')
      .select('title')
      .eq('paroisse_id', paroisseId);
    if (error) return [];
    const titles = (data ?? [])
      .map((r) => (r as { title?: string | null }).title ?? null)
      .filter((t): t is string => Boolean(t && t.trim()))
      .map((t) => t.trim());
    return Array.from(new Set(titles));
  } catch {
    return [];
  }
}

export async function insertMissingOfficiantTitles(
  paroisseId: string,
  missing: Array<{ title: string; description: string }>,
): Promise<void> {
  if (!paroisseId) return;
  if (!missing.length) return;

  // We insert "template" rows so the title + description exist in DB for this paroisse.
  // Kept silent to avoid breaking admin flows if RLS blocks it.
  try {
    const payload = missing.map((m, idx) => ({
      paroisse_id: paroisseId,
      name: m.title,
      title: m.title,
      description: m.description,
      bio: null,
      photo_url: null,
      is_active: false,
      sort_order: idx,
    }));
    await supabase.from('officiants').insert(payload as any);
  } catch {
    // silent
  }
}

export async function getVideoById(id: string, paroisseId?: string) {
  let query = supabase.from("videos").select("*").eq("id", id);
  if (paroisseId) query = query.eq("paroisse_id", paroisseId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // If content is explicitly approved/published/public, return it
  const status = data.status ?? null;
  if (status === 'approved' || data.published === true || data.is_public === true) return data;

  // Otherwise require owner or admin
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return null;
    if (data.user_id === uid) return data;

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
    const role = (profileData as any)?.role as string | undefined;
    const lower = role ? role.toLowerCase() : '';
    if (['admin', 'super_admin', 'administrateur'].includes(lower)) return data;
  } catch (e) {
    console.error('getVideoById auth check error', e);
  }

  return null;
}

export async function incrementViewCount(id: string, paroisseId?: string) {
  try {
    let query = supabase.from("videos").select("views").eq("id", id);
    if (paroisseId) query = query.eq("paroisse_id", paroisseId);

    const { data, error } = await query.maybeSingle();
    if (error) return console.warn(error);
    const next = (data?.views ?? 0) + 1;
    let updateQuery = supabase.from("videos").update({ views: next }).eq("id", id);
    if (paroisseId) updateQuery = updateQuery.eq("paroisse_id", paroisseId);

    const { error: err } = await updateQuery;
    if (err) console.warn(err);
  } catch (e) {
    console.warn(e);
  }
}
