import { getAuthCallbackUrl, supabase } from '@/integrations/supabase/client';
// `Json` type isn't exported from '@/integrations/supabase/types' in this repo —
// use a local alias until a shared Json type is available.
type Json = any;
import { gravatarUrlFromEmail } from '@/utils/gravatar';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { storePendingAvatarForUpload, uploadPendingAvatar } from '@/utils/uploadPendingAvatar';
import { STORAGE_SELECTED_PAROISSE } from '@/lib/paroisseStorage';

export type HomepageSectionRow = {
  section_key: string;
  title?: string | null;
  subtitle?: string | null;
  content?: any;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
};

// Use gallery bucket for setup images (header logo, hero image, branding)
const SETUP_BUCKET = (import.meta.env.VITE_BUCKET_GALLERY as string) || 'gallery';

export async function uploadImageToStorage(file: File, folder: string): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(SETUP_BUCKET)
      .upload(filename, file, { 
        cacheControl: '3600',
        upsert: false 
      });

    if (error) throw error;
    
    const { data: publicData } = supabase.storage
      .from(SETUP_BUCKET)
      .getPublicUrl(data.path);

    return publicData?.publicUrl ?? null;
  } catch (err) {
    console.error('uploadImageToStorage error', err);
    return null;
  }
  }

export async function saveHeaderConfig(headerData: {
  logo_url?: string;
  main_title: string;
  subtitle: string;
}, queryClient?: any) {
  try {
    // Generate a UUID v4 for the header config (will be the primary key)
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    // Try to update first by matching is_active = true
    const { data: existingData, error: selectError } = await supabase
      .from('header_config')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!selectError && existingData) {
      // Update existing active config
      const { error: updateError } = await supabase.from('header_config').update({
        logo_url: headerData.logo_url ?? null,
        logo_alt_text: 'Logo Paroisse',
        logo_size: 'md',
        main_title: headerData.main_title,
        subtitle: headerData.subtitle,
        navigation_items: [
          { label: 'Accueil', href: '/', icon: 'home' },
          { label: 'À propos', href: '/a-propos', icon: 'info' },
        ],
        updated_at: new Date().toISOString(),
      }).eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      // No existing config, insert new one
      const { error: insertError } = await supabase.from('header_config').insert({
        id: generateUUID(),
        logo_url: headerData.logo_url ?? null,
        logo_alt_text: 'Logo Paroisse',
        logo_size: 'md',
        main_title: headerData.main_title,
        subtitle: headerData.subtitle,
        navigation_items: [
          { label: 'Accueil', href: '/', icon: 'home' },
          { label: 'À propos', href: '/a-propos', icon: 'info' },
        ],
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;
    }

    // Invalidate the header-config query if queryClient is provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['header-config'] });
    }

    return { success: true };
  } catch (err) {
    console.error('saveHeaderConfig error', err);
    return { success: false, error: err };
  }
}
/** Données assistant setup : champs header optionnels (sinon dérivés du branding). */
export type SetupFooterPayload = {
  address?: string | null;
  email?: string | null;
  moderator_phone?: string | null;
  super_admin_phone?: string | null;
  super_admin_email?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  whatsapp_url?: string | null;
  copyright_text?: string | null;
};

export type SetupData = {
  sections: HomepageSectionRow[];
  about: unknown;
  branding: {
    name: string;
    logo?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    footer_text?: string | null;
  };
  /** Contenu `footer_config` (paroisse) — remplit aussi téléphone/adresse paroisse via branding lors de l’init. */
  footer?: SetupFooterPayload | null;
  help?: unknown;
  headerLogo?: string | null;
  headerMainTitle?: string;
  headerSubtitle?: string;
  /** Images hero par chemin de route (pages publiques), upsert dans `page_hero_banners`. */
  heroBanners?: Record<string, string>;
};

/** Enregistre les bannières hero (pages accessibles sans rôle admin). */
export async function upsertPageHeroBanners(entries: Record<string, string> | undefined | null) {
  if (!entries || typeof entries !== 'object') return;
  const rows = Object.entries(entries).filter(([, url]) => typeof url === 'string' && url.trim().length > 0);
  for (const [path, image_url] of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('page_hero_banners').upsert(
      {
        path,
        image_url: image_url.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'path' },
    );
    if (error) console.error('upsertPageHeroBanners', path, error);
  }
}

export async function saveInitialSetup(data: SetupData) {
  try {
    const sections = data.sections.map((s, idx) => ({
      ...s,
      display_order: s.display_order ?? idx,
      is_active: s.is_active ?? true,
    }));

    const slug = data.branding.name.toLowerCase().replace(/\s+/g, '-');

    const footer = data.footer ?? null;
    const { data: result, error } = await supabase.rpc('init_system', {
      p_paroisse_nom: data.branding.name,
      p_paroisse_slug: slug,
      p_paroisse_description: `Paroisse ${data.branding.name}`,
      p_sections: sections as unknown as Json,
      p_header_config: {
        logo_url: data.headerLogo ?? data.branding.logo ?? null,
        main_title: data.headerMainTitle ?? data.branding.name,
        subtitle: data.headerSubtitle ?? '',
      } as Json,
      p_about_config: data.about as Json,
      p_branding: {
        name: data.branding.name,
        logo: data.branding.logo ?? null,
        email: data.branding.email,
        phone: data.branding.phone ?? null,
        address: data.branding.address ?? null,
        footer_text: data.branding.footer_text ?? null,
      } as Json,
      p_footer_config: {
        address: footer?.address ?? null,
        email: footer?.email ?? null,
        moderator_phone: footer?.moderator_phone ?? null,
        super_admin_email: footer?.super_admin_email ?? null,
        super_admin_phone: footer?.super_admin_phone ?? null,
        facebook_url: footer?.facebook_url ?? null,
        youtube_url: footer?.youtube_url ?? null,
        instagram_url: footer?.instagram_url ?? null,
        whatsapp_url: footer?.whatsapp_url ?? null,
        copyright_text: footer?.copyright_text ?? null,
      } as Json,
    });

    if (error) throw error;

    // Normalize RPC result shape.
    // Depending on how the Postgres function is exposed, supabase.rpc may return:
    // - an array like [{ init_system: { paroisse_id: '...' } }]
    // - an object like { init_system: { ... } }
    // - or directly the object { paroisse_id: '...' }
    const extractParoisseId = (value: unknown): string | undefined => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        try {
          return extractParoisseId(JSON.parse(value));
        } catch {
          return undefined;
        }
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          const found = extractParoisseId(entry);
          if (found) return found;
        }
        return undefined;
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const direct =
          (typeof obj.paroisse_id === 'string' && obj.paroisse_id) ||
          (typeof obj.paroisseId === 'string' && obj.paroisseId) ||
          (typeof obj.id === 'string' && obj.id);
        if (direct) return direct;
        if ('init_system' in obj) return extractParoisseId(obj.init_system);
      }
      return undefined;
    };

    let row: { paroisse_id?: string } | null = null;
    try {
      const parsedParoisseId = extractParoisseId(result);
      row = parsedParoisseId ? { paroisse_id: parsedParoisseId } : (result as any);
    } catch (e) {
      console.warn('saveInitialSetup: failed to normalize rpc result', e, result);
      row = result as any;
    }

    if (!row?.paroisse_id) {
      const { data: paroisseRow, error: lookupError } = await supabase
        .from('paroisses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!lookupError && paroisseRow?.id) {
        row = { paroisse_id: paroisseRow.id };
      }
    }

    // Debug log to help troubleshoot frontend not receiving paroisse_id
    // eslint-disable-next-line no-console
    console.debug('saveInitialSetup: rpc result', { raw: result, normalized: row });

    if (row?.paroisse_id) {
      try {
        localStorage.setItem('selectedParoisse', row.paroisse_id);
      } catch {
        // ignore
      }
    }

    return { success: true as const, data: row, raw: result };
  } catch (error) {
    console.error('saveInitialSetup error', error);
    return { success: false as const, error };
  }
}

export default saveInitialSetup;

export type FirstAdminUserData = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  /** Si vrai et pas de fichier : URL Gravatar dans les métadonnées à l’inscription. */
  useGravatar: boolean;
  /** URL d’avatar (champ collé) lorsqu’aucun fichier n’est téléversé. */
  avatarUrl?: string | null;
};

/**
 * Après `saveInitialSetup` (RPC `init_system` → paroisse + contenu), crée le premier compte
 * avec `paroisse_id` dans les métadonnées (trigger → `super_admin` pour le 1er utilisateur de la paroisse).
 */
export async function initFirstParoisseAndUser(
  setupData: SetupData,
  userData: FirstAdminUserData,
  avatarFile?: File | null,
) {
  const setupRes = await saveInitialSetup(setupData);
  if (setupRes.success && setupData.heroBanners && Object.keys(setupData.heroBanners).length > 0) {
    await upsertPageHeroBanners(setupData.heroBanners);
  }
  if (!setupRes.success) {
    const err = setupRes.error as { message?: string; code?: string } | null;
    const msg =
      (typeof err?.message === 'string' && err.message) ||
      err?.code ||
      (err != null ? JSON.stringify(err) : null) ||
      'Échec de la configuration initiale';
    throw new Error(msg);
  }

  const row = setupRes.data as { paroisse_id?: string } | null;
  const paroisseId = row?.paroisse_id;
  if (!paroisseId) {
    throw new Error('Identifiant de paroisse manquant après la configuration initiale.');
  }

  try {
    localStorage.setItem(STORAGE_SELECTED_PAROISSE, paroisseId);
  } catch {
    // ignore
  }

  const email = userData.email.trim();
  const fullName = userData.full_name.trim();
  const phone = userData.phone.trim();

  let avatarUrlForMeta: string | undefined;
  if (!avatarFile && userData.useGravatar) {
    avatarUrlForMeta = gravatarUrlFromEmail(email);
  } else if (!avatarFile && userData.avatarUrl?.trim()) {
    const u = userData.avatarUrl.trim();
    if (/^https?:\/\//i.test(u)) avatarUrlForMeta = u;
  }

  const redirect = getAuthCallbackUrl();
  const emailRedirectTo = redirect && /^https?:\/\//i.test(redirect) ? redirect : undefined;

  const { data: authData, error: signErr } = await supabase.auth.signUp({
    email,
    password: userData.password,
    options: {
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
      data: {
        full_name: fullName,
        phone,
        role: 'super_admin',
        paroisse_id: paroisseId,
        ...(avatarUrlForMeta ? { avatar_url: avatarUrlForMeta } : {}),
      },
    },
  });

  if (signErr) throw signErr;

  const uid = authData.user?.id;
  const hasSession = !!authData.session;

  if (uid && avatarFile) {
    try {
      await storePendingAvatarForUpload(uid, avatarFile);
    } catch (e) {
      console.error('storePendingAvatarForUpload', e);
    }
    if (hasSession) {
      await ensureProfileExists(uid);
      await uploadPendingAvatar(uid);
    }
  }

  return { paroisseId, authData };
}
