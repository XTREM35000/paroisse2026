import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HomepageSection, HomepageContentData, MassTimesData, ContactData, GalleryDisplayData, VideoDisplayData, EventDisplayData } from '@/types/homepage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const homepageSectionsTable = 'homepage_sections' as any;

/**
 * Hook pour récupérer toutes les données dynamiques de la homepage
 * Combine les sections éditables avec les données des tables existantes
 */
export const useHomepageContent = () => {
  // Récupérer toutes les sections de la homepage
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(homepageSectionsTable) as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des sections:', error);
        return [];
      }

      return (data || []) as HomepageSection[];
    },
  });

  // Récupérer les 4 dernières photos de la galerie (préférer les images approuvées, sinon compléter avec les images publiques)
  const { data: latestPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['homepage-gallery'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        if (signal?.aborted) return [];
        const sb = supabase as any;

        // IDs d'images approuvées (content_approvals)
        const { data: approvedImgs = [], error: approvedErr } = await sb
          .from('content_approvals')
          .select('content_id')
          .eq('content_type', 'gallery')
          .eq('status', 'approved');

        if (approvedErr) console.error('Erreur récupération approbations galerie:', approvedErr);
        const approvedIds = (approvedImgs || []).map((r: any) => r.content_id);

        // Récupérer les images publiques (is_public=true)
        const { data: publicImgs = [], error: publicErr } = await sb
          .from('gallery_images')
          .select('id, title, description, thumbnail_url, image_url, created_at')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (publicErr) console.error('Erreur galerie publique:', publicErr);

        // Récupérer aussi les images référencées dans content_approvals
        let approvedImgsData: any[] = [];
        if (approvedIds.length > 0) {
          const { data, error } = await sb
            .from('gallery_images')
            .select('id, title, description, thumbnail_url, image_url, created_at')
            .in('id', approvedIds)
            .order('created_at', { ascending: false });
          if (error) console.error('Erreur galerie (approuvées):', error);
          approvedImgsData = data || [];
        }

        // Fusionner en unique, prioriser approuvées puis publiques, trier par date
        const map = new Map<string, any>();
        const push = (arr: any[]) => arr.forEach((it) => { if (it && it.id && !map.has(it.id)) map.set(it.id, it); });
        push(approvedImgsData);
        push(publicImgs);
        const combined = Array.from(map.values())
          .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
          .slice(0, 4);

        return combined;
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Gallery query cancelled');
          return [];
        }
        console.error('Exception galerie combinée:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Récupérer les 4 dernières vidéos (combiner vidéos référencées comme approuvées, status 'approved' et flag 'published' si présents)
  const { data: latestVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['homepage-videos'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        if (signal?.aborted) return [];
        const sb = supabase as any;

        // IDs de vidéos approuvées via content_approvals
        const { data: approvedVids = [], error: approvedErr } = await sb
          .from('content_approvals')
          .select('content_id')
          .eq('content_type', 'video')
          .eq('status', 'approved');

        if (approvedErr) console.error('Erreur récupération approbations vidéos:', approvedErr);
        const approvedIds = (approvedVids || []).map((r: any) => r.content_id);

        // Récupérer les vidéos explicitement référencées comme approuvées
        let approvedData: any[] = [];
        if (approvedIds.length > 0) {
          const { data, error } = await sb
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, video_storage_path, views, created_at')
            .in('id', approvedIds)
            .order('created_at', { ascending: false });
          if (error) console.error('Erreur vidéos (approuvées):', error);
          approvedData = data || [];
        }

        // Essayer aussi de récupérer les vidéos ayant status='approved' (si colonne disponible)
        let statusData: any[] = [];
        try {
          const { data, error } = await sb
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, video_storage_path, views, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
          if (!error) statusData = data || [];
        } catch (err) {
          // colonne 'status' inexistante ou autre erreur non bloquante
          console.debug('status column not available for videos - skipping status query');
        }

        // Essayer aussi le flag 'published' si présent
        let publishedData: any[] = [];
        try {
          const { data, error } = await sb
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, video_storage_path, views, created_at')
            .eq('published', true)
            .order('created_at', { ascending: false });
          if (!error) publishedData = data || [];
        } catch (err) {
          // colonne 'published' inexistante ou autre erreur non bloquante
          console.debug('published column not available for videos - skipping published query');
        }

        // Fusionner en unique, prioriser approuvées/status/published, trier par date
        const map = new Map<string, any>();
        const push = (arr: any[]) => arr.forEach((it) => { if (it && it.id && !map.has(it.id)) map.set(it.id, it); });
        push(approvedData);
        push(statusData);
        push(publishedData);

        let combined = Array.from(map.values())
          .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
          .slice(0, 4);

        // Fallback: si rien obtenu, récupérer les 4 vidéos les plus récentes
        if (combined.length === 0) {
          const { data, error } = await sb
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, video_storage_path, views, created_at')
            .order('created_at', { ascending: false })
            .limit(4);
          if (error) {
            console.error('Erreur fallback vidéos:', error);
            return [];
          }
          return data || [];
        }

        return combined;
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Videos query cancelled');
          return [];
        }
        console.error('Exception vidéos combinée:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Récupérer les 2 derniers événements (créés ou à venir)
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homepage-events'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        // Check if signal is aborted before making request
        if (signal?.aborted) {
          return [];
        }

        const { data, error } = await (supabase.from('events') as any)
          .select('id, title, description, start_date, end_date, location, image_url')
          .order('created_at', { ascending: false })
          .limit(2);

        // Check again after async operation
        if (signal?.aborted) {
          return [];
        }

        if (error) {
          if (error.code === '42703') {
            console.warn('events: colonne manquante, retenter avec sélection réduite', error.message);
            const { data: reduced } = await (supabase.from('events') as any)
              .select('id, title, description, start_date, location')
              .order('created_at', { ascending: false })
              .limit(2);
            return reduced || [];
          }
          console.error('Erreur événements:', error);
          return [];
        }

        return data || [];
      } catch (e: unknown) {
        // Ignore abort errors
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Events query cancelled');
          return [];
        }
        console.error('Exception événements:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Extraire et parser les sections spécifiques
  const heroSection = sections.find((s) => s.section_key === 'hero') || null;
  const gallerySectionConfig = sections.find((s) => s.section_key === 'gallery_section');
  const videosSectionConfig = sections.find((s) => s.section_key === 'videos_section');
  const eventsSectionConfig = sections.find((s) => s.section_key === 'events_section');
  const massTimesSection = sections.find((s) => s.section_key === 'footer_mass_times');
  const contactSection = sections.find((s) => s.section_key === 'footer_contact');

  // Parser le contenu JSON des sections
  const parsedMassTimes: MassTimesData | null = massTimesSection?.content
    ? (JSON.parse(massTimesSection.content) as MassTimesData)
    : null;

  const parsedContact: ContactData | null = contactSection?.content
    ? (JSON.parse(contactSection.content) as ContactData)
    : null;

  const parsedGalleryConfig: GalleryDisplayData | null = gallerySectionConfig?.content
    ? (JSON.parse(gallerySectionConfig.content) as GalleryDisplayData)
    : { limit: 4, order: 'recent' };

  const parsedVideosConfig: VideoDisplayData | null = videosSectionConfig?.content
    ? (JSON.parse(videosSectionConfig.content) as VideoDisplayData)
    : { limit: 4, order: 'recent' };

  const parsedEventsConfig: EventDisplayData | null = eventsSectionConfig?.content
    ? (JSON.parse(eventsSectionConfig.content) as EventDisplayData)
    : { limit: 2, upcoming_only: true };

  const isLoading = sectionsLoading || photosLoading || videosLoading || eventsLoading;

  return {
    sections,
    hero: heroSection,
    gallerySectionConfig: parsedGalleryConfig,
    videosSectionConfig: parsedVideosConfig,
    eventsSectionConfig: parsedEventsConfig,
    massTimes: parsedMassTimes,
    contact: parsedContact,
    latestPhotos,
    latestVideos,
    upcomingEvents,
    isLoading,
  } as HomepageContentData & {
    sections: HomepageSection[];
    isLoading: boolean;
  };
};
