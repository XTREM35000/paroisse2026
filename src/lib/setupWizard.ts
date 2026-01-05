import { supabase } from '@/integrations/supabase/client';
import type { UseQueryClient } from '@tanstack/react-query';

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
export async function saveInitialSetup(data: {
  sections: HomepageSectionRow[];
  about: any;
  branding: any;
  help?: any;
}) {
  // Upsert homepage_sections rows (insert if not exists, update if exists)
  try {
    const sections = data.sections.map((s, idx) => ({ ...s, display_order: s.display_order ?? idx, is_active: true }));

    const { error: secErr } = await supabase.from('homepage_sections').upsert(sections, { onConflict: 'section_key' });
    if (secErr) throw secErr;

    const contentRows = [
      { section: 'about', content: data.about },
      { section: 'branding', content: data.branding },
    ];

    if (data.help) contentRows.push({ section: 'help', content: data.help });

    // Upsert homepage_content rows (insert if not exists, update if exists)
    const { error: contentErr } = await supabase.from('homepage_content').upsert(contentRows, { onConflict: 'section' });
    if (contentErr) throw contentErr;

    return { success: true };
  } catch (err) {
    console.error('saveInitialSetup error', err);
    return { success: false, error: err };
  }
}

export default saveInitialSetup;
