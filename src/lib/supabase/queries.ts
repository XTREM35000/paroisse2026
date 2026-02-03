import { supabase } from "@/integrations/supabase/client";

export async function getVideoById(id: string) {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
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
    if (role && role.toLowerCase() === 'admin') return data;
  } catch (e) {
    console.error('getVideoById auth check error', e);
  }

  return null;
}

export async function incrementViewCount(id: string) {
  try {
    const { data, error } = await supabase.from("videos").select("views").eq("id", id).maybeSingle();
    if (error) return console.warn(error);
    const next = (data?.views ?? 0) + 1;
    const { error: err } = await supabase.from("videos").update({ views: next }).eq("id", id);
    if (err) console.warn(err);
  } catch (e) {
    console.warn(e);
  }
}
