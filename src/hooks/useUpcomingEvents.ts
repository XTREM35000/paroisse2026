import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParoisse } from '@/contexts/ParoisseContext';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  time?: string;
  location: string;
  imageUrl?: string;
  attendees?: number;
  created_at?: string;
  updated_at?: string;
}

export const useUpcomingEvents = (limit = 10) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Récupérer TOUS les événements sans filtre de date d'abord
        // Multi-paroisses: filter only when selected
        let query = supabase
          .from('events')
          .select('id, title, description, start_date, location, image_url');
        if (paroisseId) query = query.eq('paroisse_id', paroisseId);

        const { data, error: fetchError } = await query
          .order('start_date', { ascending: true })
          .limit(limit);
        
        if (fetchError) throw fetchError;
        
        console.log('📅 Events fetched (ALL):', data);
        
        if (data) {
          console.log('📅 All events:', data);
          
          // Mapper les données avec les noms attendus (afficher tous les événements)
          const mappedEvents: Event[] = data.map((item: Record<string, unknown>) => {
            const startDate = (item.start_date as string) || '';
            // Extraire l'heure depuis start_date (format ISO: 2026-01-03T10:30:00Z)
            const timeFromDate = startDate ? new Date(startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            
            const mapped = {
              id: item.id as string,
              title: item.title as string,
              description: item.description as string | undefined,
              start_date: startDate,
              time: timeFromDate,
              location: item.location as string,
              imageUrl: (item.image_url as string | null) || undefined,
              attendees: 0,
              created_at: undefined,
              updated_at: undefined,
            };
            console.log('🖼️ Event:', mapped.title, 'Date:', mapped.start_date, 'Image URL:', mapped.imageUrl);
            return mapped;
          });
          
          setEvents(mappedEvents);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [limit, paroisseId]);

  return { events, loading, error };
};
