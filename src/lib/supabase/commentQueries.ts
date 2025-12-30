import { supabase } from "@/integrations/supabase/client";
import type { Comment, CommentStatus } from "@/types/database";

export async function fetchComments(options: {
  videoId?: string;
  mediaId?: string;
  status?: CommentStatus;
  limit?: number;
}) {
  let query = supabase
    .from('comments')
    .select('*')
    .is('parent_id', null);

  if (options.videoId) {
    query = query.eq('video_id', options.videoId);
  }

  if (options.mediaId) {
    query = query.eq('media_id', options.mediaId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  query = query
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch author profiles separately
  if (data && data.length > 0) {
    const authorIds = [...new Set(data.map(c => c.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', authorIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    return data.map(comment => ({
      ...comment,
      author: profileMap.get(comment.author_id) || null,
    })) as Comment[];
  }
  
  return data as Comment[];
}

export async function fetchRecentComments(limit = 50) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  // Fetch author profiles separately
  if (data && data.length > 0) {
    const authorIds = [...new Set(data.map(c => c.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', authorIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    return data.map(comment => ({
      ...comment,
      author: profileMap.get(comment.author_id) || null,
    })) as Comment[];
  }
  
  return data as Comment[];
}

export async function createComment(comment: {
  content: string;
  author_id: string;
  video_id?: string;
  media_id?: string;
  parent_id?: string;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select('*')
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function updateComment(id: string, updates: Partial<Comment>) {
  const { status, is_pinned, content } = updates;
  const updateData: Record<string, unknown> = {};
  
  if (status !== undefined) updateData.status = status;
  if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
  if (content !== undefined) updateData.content = content;

  const { data, error } = await supabase
    .from('comments')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function moderateComment(id: string, status: CommentStatus) {
  return updateComment(id, { status });
}

export async function pinComment(id: string, isPinned: boolean) {
  return updateComment(id, { is_pinned: isPinned });
}
