import { supabase } from "@/integrations/supabase/client";
import type { Video, ContentStatus } from "@/types/database";

export async function fetchVideos(options?: {
  status?: ContentStatus;
  categoryId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  let query = supabase
    .from('videos')
    .select('*', { count: 'exact' });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  
  // Fetch related data separately to avoid join issues
  if (data && data.length > 0) {
    const categoryIds = [...new Set(data.filter(v => v.category_id).map(v => v.category_id))];
    const authorIds = [...new Set(data.filter(v => v.author_id).map(v => v.author_id))];
    
    const [categoriesRes, profilesRes] = await Promise.all([
      categoryIds.length > 0 
        ? supabase.from('categories').select('*').in('id', categoryIds as string[])
        : { data: [] },
      authorIds.length > 0
        ? supabase.from('profiles').select('*').in('id', authorIds as string[])
        : { data: [] },
    ]);
    
    const categoryMap = new Map(categoriesRes.data?.map(c => [c.id, c]) || []);
    const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
    
    const enrichedData = data.map(video => ({
      ...video,
      category: video.category_id ? categoryMap.get(video.category_id) : null,
      author: video.author_id ? profileMap.get(video.author_id) : null,
    }));
    
    return { data: enrichedData as Video[], count };
  }
  
  return { data: data as Video[], count };
}

export async function fetchVideoById(id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  // Fetch related data
  const [categoryRes, authorRes] = await Promise.all([
    data.category_id
      ? supabase.from('categories').select('*').eq('id', data.category_id).maybeSingle()
      : { data: null },
    data.author_id
      ? supabase.from('profiles').select('*').eq('id', data.author_id).maybeSingle()
      : { data: null },
  ]);
  
  return {
    ...data,
    category: categoryRes.data,
    author: authorRes.data,
  } as Video;
}

export async function createVideo(video: Partial<Video>) {
  const insertData: Record<string, unknown> = {
    title: video.title,
    description: video.description,
    thumbnail_url: video.thumbnail_url,
    video_url: video.video_url,
    hls_url: video.hls_url,
    duration: video.duration,
    category_id: video.category_id,
    author_id: video.author_id,
    status: video.status || 'draft',
    is_live: video.is_live,
    is_featured: video.is_featured,
    allow_comments: video.allow_comments,
    allow_download: video.allow_download,
    tags: video.tags,
    metadata: video.metadata,
  };

  const { data, error } = await supabase
    .from('videos')
    .insert([insertData])
    .select('*')
    .single();

  if (error) throw error;
  return data as Video;
}

export async function updateVideo(id: string, updates: Partial<Video>) {
  const updateData: Record<string, unknown> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.thumbnail_url !== undefined) updateData.thumbnail_url = updates.thumbnail_url;
  if (updates.video_url !== undefined) updateData.video_url = updates.video_url;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;
  if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
  if (updates.published_at !== undefined) updateData.published_at = updates.published_at;
  if (updates.views !== undefined) updateData.views = updates.views;

  const { data, error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Video;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function incrementVideoViews(id: string) {
  try {
    const { data } = await supabase
      .from('videos')
      .select('views')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      const nextViews = (data.views ?? 0) + 1;
      await supabase
        .from('videos')
        .update({ views: nextViews })
        .eq('id', id);
    }
  } catch (e) {
    console.warn('Error incrementing views:', e);
  }
}

export async function publishVideo(id: string) {
  return updateVideo(id, { 
    status: 'published', 
    published_at: new Date().toISOString() 
  });
}

export async function unpublishVideo(id: string) {
  return updateVideo(id, { status: 'draft' });
}

export async function fetchFeaturedVideos(limit = 6) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Video[];
}

export async function fetchRecentVideos(limit = 12) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Video[];
}
