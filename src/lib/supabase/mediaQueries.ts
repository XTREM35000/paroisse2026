import { supabase } from '@/integrations/supabase/client';
import type { Media, Album, MediaType } from '@/types/database';
import type { StreamSources, ProviderType } from '@/lib/providers';

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
// LIVE STREAMS (REFACTORED v2)
// =====================================================

export interface LiveStream {
  id: string;
  title: string;
  description?: string | null;

  // new simplified scheme
  provider: ProviderType;
  video_id?: string | null;

  // New: Extensible sources structure (kept for backward compatibility)
  stream_sources?: StreamSources | null;

  // Legacy: Backward compatibility
  stream_url: string;

  // Metadata
  stream_type: 'tv' | 'radio';

  // Playback hints
  playback_strategy?: 'primary' | 'fallback' | null;

  // Activation
  is_active: boolean;
  scheduled_at?: string | null;

  // Replay handling
  replay_created?: boolean;
  replay_video_id?: string | null;

  // Timestamps
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
 * 
 * Handles both new stream_sources and legacy stream_url for backward compatibility
 * Always maintains stream_url for fallback (required by DB constraint)
 */
export async function upsertLiveStream(
  stream: Omit<LiveStream, 'created_at' | 'updated_at'> & { id?: string }
) {
  // Ensure we compute a fallback URL for legacy columns
  let fallbackUrl = stream.stream_url || '';

  // If video_id is provided, build an embed based on provider (helper can be added externally)
  if (stream.video_id && stream.provider) {
    try {
      const { getEmbedUrl } = await import('@/lib/providers/videoUtils');
      const embed = getEmbedUrl(stream.provider as any, stream.video_id);
      if (embed) fallbackUrl = embed;
    } catch {
      /* ignore dynamic import failure */
    }
  }

  if (stream.stream_sources) {
    // Extract first available source as fallback
    fallbackUrl =
      stream.stream_sources.url ||
      stream.stream_sources.hls ||
      stream.stream_sources.audio ||
      stream.stream_sources.embed ||
      fallbackUrl;
  }

  const payload: any = {
    title: stream.title,
    stream_url: fallbackUrl,
    stream_sources: stream.stream_sources ?? null,
    stream_type: stream.stream_type,
    provider: stream.provider || 'youtube',
    is_active: stream.is_active,
    scheduled_at: stream.scheduled_at ?? null,
    updated_at: new Date().toISOString(),
  };

  if (stream.video_id !== undefined) {
    payload.video_id = stream.video_id;
  }

  if (stream.id) {
    // Update existing stream
    const { data, error } = await supabase
      .from('live_streams')
      .update(payload)
      .eq('id', stream.id)
      .select()
      .single();

    if (error) throw error;
    return data as LiveStream;
  } else {
    // Create new stream
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

// =====================================================
// LIVE STREAM PROVIDER SOURCES (Links below player)
// =====================================================

import type { LiveProviderSource } from '@/types/database';

/**
 * Récupère tous les liens fournisseurs pour un live stream
 */
export async function fetchLiveProviderSources(liveId: string): Promise<LiveProviderSource[]> {
  const { data, error } = await supabase
    .from('live_stream_sources')
    .select('*')
    .eq('live_id', liveId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as LiveProviderSource[];
}

/**
 * Ajoute une source de fournisseur pour un live
 */
export async function addLiveProviderSource(
  liveId: string,
  provider: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'custom',
  url: string
): Promise<LiveProviderSource> {
  const { data, error } = await supabase
    .from('live_stream_sources')
    .insert([{ live_id: liveId, provider, url }])
    .select()
    .single();

  if (error) throw error;
  return data as LiveProviderSource;
}

/**
 * Met à jour une source de fournisseur
 */
export async function updateLiveProviderSource(
  sourceId: string,
  provider: string,
  url: string
): Promise<LiveProviderSource> {
  const { data, error } = await supabase
    .from('live_stream_sources')
    .update({ provider, url })
    .eq('id', sourceId)
    .select()
    .single();

  if (error) throw error;
  return data as LiveProviderSource;
}

/**
 * Supprime une source de fournisseur
 */
export async function deleteLiveProviderSource(sourceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('live_stream_sources')
    .delete()
    .eq('id', sourceId);

  if (error) throw error;
  return true;
}

// =====================================================
// LIVE HELPERS: RPCs and stats
// =====================================================

export interface LiveStats {
  live_id: string;
  viewers_count: number;
  peak_viewers: number;
  total_views: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wrapper for the server RPC that increments/decrements viewers and updates peaks/totals.
 */
export async function rpcIncrementViewer(liveId: string, delta = 1, userId?: string) {
  const { data, error } = await supabase.rpc('rpc_increment_viewer', { p_live_id: liveId, p_delta: delta, p_user_id: userId ?? null });
  if (error) throw error;
  // rpc returns a recordset
  return (data && data[0]) as LiveStats | null;
}

/**
 * Fetch live stats row
 */
export async function getLiveStats(liveId: string) {
  const { data, error } = await supabase
    .from('live_stats')
    .select('*')
    .eq('live_id', liveId)
    .maybeSingle();

  if (error) throw error;
  return data as LiveStats | null;
}

/**
 * Get or create a chat room dedicated to a live stream
 */
export async function getOrCreateLiveChatRoom(liveId: string, title?: string, currentUserId?: string) {
  // 1) Try to find an existing room tied to this live by name or by explicit pattern
  const patterns = [`live_${liveId}`, `Live: ${liveId}`, `%${liveId}%`];

  for (const p of patterns) {
    const query = supabase
      .from('chat_rooms')
      .select('*');

    if (p.includes('%')) {
      // broad search
      query.ilike('name', p);
    } else {
      query.ilike('name', `%${p}%`).limit(1);
    }

    const { data: existing, error: qErr } = await query.limit(1);
    if (qErr) console.warn('getOrCreateLiveChatRoom search error', qErr);
    if (existing && existing.length > 0) {
      // If an old automatically named room exists ("live_<id>"), attempt to make its
      // name friendlier by using the stream title or the creator's display name.
      const room = existing[0];
      if (room.name?.startsWith('live_') && (title || currentUserId)) {
        let newName = room.name;
        if (title) newName = `Live: ${title}`;
        else if (currentUserId) {
          try {
            const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', currentUserId).maybeSingle();
            if (profile?.display_name) newName = `Live: ${profile.display_name}`;
          } catch (e) { /* ignore */ }
        }
        if (newName !== room.name) {
          try {
            const { data: updated } = await supabase.from('chat_rooms').update({ name: newName }).eq('id', room.id).select().single();
            return updated || room;
          } catch (e) {
            console.warn('getOrCreateLiveChatRoom rename error', e);
            return room;
          }
        }
      }
      return room;
    }
  }

  // 2) If no room found and no authenticated user, return null so UI can prompt login
  if (!currentUserId) {
    return null;
  }

  // 3) Authenticated user: create an idempotent named room using the stream title or the creator's display name
  let roomName = `live_${liveId}`;
  let description = `Chat en direct pour la diffusion ${title ?? liveId}`;

  if (title) {
    roomName = `Live: ${title}`;
    description = `Chat en direct pour la diffusion ${title}`;
  } else if (currentUserId) {
    // try to fetch the creator's display name to make the room friendlier
    try {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', currentUserId).maybeSingle();
      if (profile?.display_name) {
        roomName = `Live: ${profile.display_name}`;
        description = `Chat en direct animé par ${profile.display_name}`;
      }
    } catch (e) {
      // ignore and fallback to live_<id>
    }
  }

  const payload = {
    name: roomName,
    description,
    type: 'live',
    is_private: false,
    created_by: currentUserId,
  };

  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert([payload])
    .select()
    .single();

  if (error) {
    // re-check in case of race insertion by another process
    console.warn('getOrCreateLiveChatRoom insert error, trying to find existing', error);
    const { data: existingAfter, error: eErr } = await supabase
      .from('chat_rooms')
      .select('*')
      .ilike('name', `%${roomName}%`)
      .limit(1);
    if (eErr) throw eErr;
    if (existingAfter && existingAfter.length > 0) return existingAfter[0];
    throw error;
  }

  return newRoom as any;
}
