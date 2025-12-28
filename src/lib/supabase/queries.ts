import { supabase } from "@/integrations/supabase/client";

export async function getVideoById(id: string) {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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
