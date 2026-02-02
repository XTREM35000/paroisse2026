import { supabase } from '@/integrations/supabase/client';
import type { Media, Album, MediaType } from '@/types/database';

// =====================================================
// MEDIA QUERIES
// =====================================================

export async function fetchMedia(options?: {
  type?: MediaType;
  albumId?: string;
  categoryId?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  let query = supabase
    .from('media')
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      album:albums(*)
    `, { count: 'exact' });

  if (options?.type) {
    query = query.eq('file_type', options.type);
  }

  if (options?.albumId) {
    query = query.eq('album_id', options.albumId);
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic);
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
  return { data: data as Media[], count };
}

export async function fetchMediaById(id: string) {
  const { data, error } = await supabase
    .from('media')
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      album:albums(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Media | null;
}

export async function createMedia(media: Partial<Media>) {
  const { data, error } = await supabase
    .from('media')
    .insert([media])
    .select()
    .single();

  if (error) throw error;
  return data as Media;
}

export async function updateMedia(id: string, updates: Partial<Media>) {
  const { data, error } = await supabase
    .from('media')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Media;
}

export async function deleteMedia(id: string) {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =====================================================
// ALBUM QUERIES
// =====================================================

export async function fetchAlbums(options?: {
  authorId?: string;
  isPublic?: boolean;
  limit?: number;
}) {
  let query = supabase
    .from('albums')
    .select(`
      *,
      author:profiles(*)
    `);

  if (options?.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  if (options?.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Album[];
}

export async function fetchAlbumById(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Album | null;
}

export async function createAlbum(album: Partial<Album>) {
  const { data, error } = await supabase
    .from('albums')
    .insert([album])
    .select()
    .single();

  if (error) throw error;
  return data as Album;
}

export async function updateAlbum(id: string, updates: Partial<Album>) {
  const { data, error } = await supabase
    .from('albums')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Album;
}

export async function deleteAlbum(id: string) {
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =====================================================
// RECENT MEDIA
// =====================================================

export async function fetchRecentImages(limit = 12) {
  const { data, error } = await supabase
    .from('media')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('file_type', 'image')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Media[];
}

// =====================================================
// LIVE STREAMS
// =====================================================

export interface LiveStream {
  id: string;
  title: string;
  stream_url: string;
  stream_type: 'tv' | 'radio';
  provider?: 'youtube' | 'api_video' | 'radio_stream';
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 

/**
 * Fetch the active live stream (most recent if multiple)
 */
export async function fetchActiveLiveStream() {
  const { data, error } = await supabase
    .from('live_streams')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as LiveStream | null;
}

/**
 * Fetch all live streams (for admin dashboard)
 */
export async function fetchAllLiveStreams(options?: {
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('live_streams')
    .select('*', { count: 'exact' });

  query = query.order('updated_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as LiveStream[], count };
}

/**
 * Create or update a live stream
 */
export async function upsertLiveStream(stream: Omit<LiveStream, 'created_at' | 'updated_at'> & { id?: string }) {
  if (stream.id) {
    // Update existing - include all fields
    const payload = {
      title: stream.title,
      stream_url: stream.stream_url,
      stream_type: stream.stream_type,
      is_active: stream.is_active,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('live_streams')
      .update(payload)
      .eq('id', stream.id)
      .select()
      .single();

    if (error) throw error;
    return data as LiveStream;
  } else {
    // Create new - exclude id to let PostgreSQL generate UUID
    const { title, stream_url, stream_type, is_active } = stream;
    const payload = {
      title,
      stream_url,
      stream_type,
      provider: stream.provider ?? 'youtube',
      is_active,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('live_streams')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data as LiveStream;
  }
}

/**
 * Delete a live stream
 */
export async function deleteLiveStream(id: string) {
  const { error } = await supabase.from('live_streams').delete().eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * Deactivate all other live streams (only one active at a time)
 */
export async function deactivateOtherLiveStreams(activeId: string) {
  const { error } = await supabase
    .from('live_streams')
    .update({ is_active: false })
    .neq('id', activeId);

  if (error) throw error;
  return true;
}
