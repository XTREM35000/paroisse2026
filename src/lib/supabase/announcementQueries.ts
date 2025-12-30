import { supabase } from "@/integrations/supabase/client";
import type { Announcement, ContentStatus } from "@/types/database";

export async function fetchAnnouncements(options?: {
  status?: ContentStatus;
  isPinned?: boolean;
  limit?: number;
}) {
  let query = supabase
    .from('announcements')
    .select('*');

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.isPinned !== undefined) {
    query = query.eq('is_pinned', options.isPinned);
  }

  query = query
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch author profiles separately
  if (data && data.length > 0) {
    const authorIds = [...new Set(data.filter(a => a.author_id).map(a => a.author_id))];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', authorIds as string[]);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return data.map(announcement => ({
        ...announcement,
        author: announcement.author_id ? profileMap.get(announcement.author_id) : null,
      })) as Announcement[];
    }
  }
  
  return data as Announcement[];
}

export async function fetchAnnouncementById(id: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  // Fetch author profile
  if (data.author_id) {
    const { data: author } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.author_id)
      .maybeSingle();
    
    return { ...data, author } as Announcement;
  }
  
  return data as Announcement;
}

export async function createAnnouncement(announcement: {
  title: string;
  content: string;
  priority?: string;
  is_pinned?: boolean;
  author_id?: string;
  image_url?: string;
}) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([announcement])
    .select('*')
    .single();

  if (error) throw error;
  return data as Announcement;
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  const updateData: Record<string, unknown> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.is_pinned !== undefined) updateData.is_pinned = updates.is_pinned;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url;

  const { data, error } = await supabase
    .from('announcements')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Announcement;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function pinAnnouncement(id: string, isPinned: boolean) {
  return updateAnnouncement(id, { is_pinned: isPinned });
}

export async function fetchRecentAnnouncements(limit = 5) {
  return fetchAnnouncements({ status: 'published', limit });
}
