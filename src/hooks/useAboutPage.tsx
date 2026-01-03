// src/hooks/useAboutPage.ts
import { supabase } from '../integrations/supabase/client';
import type { Json } from '../integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';

export interface AboutSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  content_type: string | null;
  metadata: Json | null;
  image_url: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean; // Ajouté ici
  updated_at: string;
}

export const useAboutPage = () => {
  return useQuery({
    queryKey: ['about-page'],
    queryFn: async (): Promise<AboutSection[]> => {
      const { data, error } = await supabase
        .from('about_page_sections')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const organizeAboutSections = (sections: AboutSection[]) => {
  return {
    hero: sections.find(s => s.section_key === 'about_hero'),
    description: sections.find(s => s.section_key === 'parish_description'),
    mission: sections.find(s => s.section_key === 'our_mission'),
    values: sections.find(s => s.section_key === 'our_values'),
    ministries: sections.find(s => s.section_key === 'our_ministries'),
    contact: sections.find(s => s.section_key === 'contact_info'),
    cta: sections.find(s => s.section_key === 'contact_cta')
  };
};