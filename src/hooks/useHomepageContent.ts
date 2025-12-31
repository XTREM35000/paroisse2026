import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeroSection {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  image_url?: string;
}

interface SectionTitleBlock {
  title?: string;
  subtitle?: string;
  button_link?: string;
}

interface HomepageContent {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  hero?: HeroSection;
  videos_title?: SectionTitleBlock;
  events_title?: SectionTitleBlock;
  [key: string]: any;
}

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('homepage_content')
        .select('*')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is acceptable
        throw fetchError;
      }

      if (data) {
        // `data.content` in the DB is stored as JSON; normalize to the HomepageContent shape
        let parsed: HomepageContent | null = null;
        try {
          const raw = (data as any).content ?? null;
          if (raw) {
            parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as HomepageContent);
          }
        } catch (e) {
          console.warn('Impossible de parser homepage_content.content', e);
        }

        setContent(parsed || {
          id: data.id || 'default',
          title: data.title || 'Bienvenue',
          subtitle: data.subtitle || 'Paroisse Notre Dame',
          description: data.title || 'Découvrez nos vidéos, galeries et événements',
        });
      } else {
        // Provide default content if none exists
        setContent({
          id: 'default',
          title: 'Bienvenue',
          subtitle: 'Paroisse Notre Dame',
          description: 'Découvrez nos vidéos, galeries et événements',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement du contenu de la page d\'accueil:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Provide default content on error
      setContent({
        id: 'default',
        title: 'Bienvenue',
        subtitle: 'Paroisse Notre Dame',
        description: 'Découvrez nos vidéos, galeries et événements',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, error, refreshContent: fetchContent };
}
