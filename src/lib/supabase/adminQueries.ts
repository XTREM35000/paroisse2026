import { supabase } from "@/integrations/supabase/client";

export async function fetchVideos() {
  const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateVideo(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("videos").update(updates).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchRecentComments(limit = 50) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function moderateComment(id: string, status: string) {
  const { data, error } = await supabase.from("comments").update({ status }).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
  return true;
}
