// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '@/integrations/supabase/client';
import type { GalleryImage, GalleryCategory } from '@/types/database';

// =====================================================
// GALLERY QUERIES - CORRECTED VERSION
// Contournement des types Supabase : utiliser 'as any' car les types n'incluent pas encore
// les tables gallery_images et gallery_categories (génération CLI en attente)
// =====================================================

// Contournement du typage strict Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const galleryImagesTable = 'gallery_images' as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const galleryCategoriesTable = 'gallery_categories' as any;

export async function fetchGalleryImages(options?: {
  categoryId?: string;
  userId?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(galleryImagesTable) as any)
      .select(
        `
      *,
      category:gallery_categories(*)
    `,
        { count: 'exact' }
      );

    if (options?.categoryId) query = query.eq('category_id', options.categoryId);
    if (options?.userId) query = query.eq('user_id', options.userId);
    if (options?.isPublic !== undefined) query = query.eq('is_public', options.isPublic);
    if (options?.search) query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);

    query = query.order('created_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('❌ fetchGalleryImages error:', error.code, error.message);
      throw error;
    }
    
    // Log détaillé pour débogage
    const recordCount = data?.length || 0;
    const validData = (data || []).filter((img: any): img is GalleryImage => 
      !!img && typeof img === 'object' && 'id' in img && 'image_url' in img
    );
    
    console.log(`📸 Gallery Query: ${recordCount} records bruts → ${validData.length} valides (offset: ${options?.offset || 0})`);
    
    if (validData.length === 0 && recordCount === 0) {
      console.warn('⚠️  Aucune image trouvée en base de données. La table gallery_images est peut-être vide.');
    }
    
    return { data: validData, count };
  } catch (e) {
    console.error('❌ fetchGalleryImages unexpected error:', e);
    return null;
  }
}

export async function fetchGalleryImageById(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(galleryImagesTable) as any)
      .select(`*, category:gallery_categories(*)`)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('fetchGalleryImageById error', error);
      return null;
    }

    if (!data) return null;

    // If approved/published/public, return it
    if (data.status === 'approved' || data.published === true || data.is_public === true) return (data as any as GalleryImage);

    // Otherwise require owner or admin
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) return null;
      if (data.user_id === uid) return (data as any as GalleryImage);

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      const role = (profileData as any)?.role as string | undefined;
      if (role && role.toLowerCase() === 'admin') return (data as any as GalleryImage);
    } catch (e) {
      console.error('fetchGalleryImageById auth check error', e);
    }

    return null;
  } catch (e) {
    console.error('fetchGalleryImageById unexpected error', e);
    return null;
  }
}

export async function createGalleryImage(image: Partial<GalleryImage>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(galleryImagesTable) as any).insert([image]).select().single();
    if (error) {
      console.error('createGalleryImage error', error);
      return null;
    }
    return (data as any as GalleryImage) || null;
  } catch (e) {
    console.error('createGalleryImage unexpected error', e);
    return null;
  }
}

export async function updateGalleryImage(id: string, updates: Partial<GalleryImage>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(galleryImagesTable) as any).update(updates).eq('id', id).select().single();
    if (error) {
      console.error('updateGalleryImage error', error);
      return null;
    }
    return (data as any as GalleryImage) || null;
  } catch (e) {
    console.error('updateGalleryImage unexpected error', e);
    return null;
  }
}

export async function deleteGalleryImage(id: string) {
  try {
    // Validate UUID to avoid passing invalid input to Postgres (22P02)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(String(id))) {
      console.warn('deleteGalleryImage called with invalid id format:', id);
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(galleryImagesTable) as any).delete().eq('id', id).select();
    if (error) {
      console.error('deleteGalleryImage error', error);
      return { success: false, error } as any;
    }
    return { success: true, data } as any;
  } catch (e) {
    console.error('deleteGalleryImage unexpected error', e);
    return { success: false, error: e } as any;
  }
}

export async function incrementGalleryImageViews(id: string) {
  try {
    // Fallback: read current views and update (non-atomic)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: readData, error: readErr } = await (supabase.from(galleryImagesTable) as any)
      .select('views')
      .eq('id', id)
      .maybeSingle();
    
    if (readErr || !readData) {
      console.error('incrementGalleryImageViews read error', readErr);
      return null;
    }
    
    const current = (readData as any).views ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updData, error: updErr } = await (supabase.from(galleryImagesTable) as any)
      .update({ views: current + 1 })
      .eq('id', id)
      .select('views')
      .single();

    if (updErr) {
      console.error('incrementGalleryImageViews update error', updErr);
      return null;
    }
    return (updData as any) as { views: number } | null;
  } catch (e) {
    console.error('incrementGalleryImageViews unexpected error', e);
    return null;
  }
}

// Categories
export async function fetchGalleryCategories(limit?: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(galleryCategoriesTable) as any).select('*');
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) {
      console.error('fetchGalleryCategories error', error);
      return null;
    }
    return (data as any as GalleryCategory[]) || [];
  } catch (e) {
    console.error('fetchGalleryCategories unexpected error', e);
    return null;
  }
}

export async function createGalleryCategory(category: Partial<GalleryCategory>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(galleryCategoriesTable) as any).insert([category]).select().single();
    if (error) {
      console.error('createGalleryCategory error', error);
      return null;
    }
    return (data as any as GalleryCategory) || null;
  } catch (e) {
    console.error('createGalleryCategory unexpected error', e);
    return null;
  }
}

// Backwards compatible aliases (preferred names in some parts of the app)
export const getGalleryImages = fetchGalleryImages;
export const getGalleryImageById = fetchGalleryImageById;
