import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepageSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export const useHomepageContent = () => {
  const [content, setContent] = useState<Record<string, HomepageSection>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('homepage_sections')
          .select('*')
          .eq('is_active', true)
          .order('sort_order') as { data: HomepageSection[] | null; error: any };
        
        if (fetchError) throw fetchError;
        
        if (data) {
          const contentMap: Record<string, HomepageSection> = {};
          data.forEach((section) => {
            contentMap[section.key] = section;
          });
          setContent(contentMap);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du contenu:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, loading, error };
};
