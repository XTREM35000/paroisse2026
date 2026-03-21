import { supabase } from "@/integrations/supabase/client";

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
