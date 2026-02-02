import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/components/ui/notification-system';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
  views?: number;
  created_at?: string;
  user_id?: string;
}

type EventInsertData = {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
  user_id?: string;
  created_at?: string;
};

type EventUpdateData = Partial<Omit<Event, 'id' | 'created_at'>>;

export const useEvents = (limit = 10) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();

  // ensure slug uniqueness helper
  const ensureUniqueSlug = async (base: string) => {
    let candidate = base;
    let idx = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = sb as any;
    while (true) {
      const { data, error } = await client.from('events').select('id').eq('slug', candidate).limit(1);
      if (error) {
        console.warn('Erreur lors de la vérification du slug:', error);
        break;
      }
      if (!data || data.length === 0) return candidate;
      candidate = `${base}-${idx++}`;
    }
    return candidate;
  };


  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const client = sb;
      const query = client
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      const res = await query.limit(limit);
      const { data, error: fetchError } = res as { data: unknown[] | null; error: unknown };

      if (fetchError) {
        throw fetchError;
      }

      setEvents((data || []) as Event[]);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      notifyError('Erreur', 'Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  }, [limit, notifyError]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: EventInsertData) => {
    try {
      console.debug('📅 Creating event with data:', eventData);

      const insertData = {
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        image_url: eventData.image_url,
        // Support additional fields if present
        ...(eventData.slug ? { slug: eventData.slug } : {}),
        ...(eventData.seo_title ? { seo_title: eventData.seo_title } : {}),
        ...(eventData.seo_description ? { seo_description: eventData.seo_description } : {}),
        ...(eventData.content ? { content: eventData.content } : {}),
      };

      // If slug not provided, generate one server-side by sending the raw string; backend may have constraint
      // Ensure a slug exists and is unique before inserting
      try {
        if (!insertData.slug) {
          const baseSlug = (insertData.title || '').toString().slice(0, 220).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ensure = await ensureUniqueSlug(baseSlug as any);
          // @ts-ignore
          insertData.slug = ensure;
        }
      } catch (err) {
        console.warn('Erreur génération slug:', err);
      }

      const { data, error } = await sb
        .from('events')
        .insert([insertData as never])
        .select()
        .single();

      if (error) {
        console.error('Erreur createEvent:', error);
        throw error;
      }

      if (data) {
        setEvents(prev => [...prev, data as Event]);
      }
      notifySuccess('Succès', 'Événement créé avec succès');
      return data as Event | null;
    } catch (err: unknown) {
      console.error('Erreur lors de createEvent:', err);
      notifyError('Erreur', 'Échec de la création de l\'événement');
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: EventUpdateData) => {
    try {
      console.debug('📅 Updating event with data:', updates);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('📅 updateEvent executing as user:', currentUser?.id, 'targetEventId:', id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant update:', authErr);
      }

      const updatePayload = {
        ...(updates as any),
      };

      const { data, error } = await sb
        .from('events')
        .update(updatePayload as never)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur updateEvent:', error);
        throw error;
      }
      if (data) {
        setEvents(prev => prev.map(event => (event.id === id ? data as Event : event)));
      } else {
        console.warn('updateEvent: aucune ligne affectée pour id', id);
        throw new Error('Aucune ligne mise à jour — vérifiez les permissions (RLS) ou l\'identifiant');
      }
      notifySuccess('Succès', 'Événement mis à jour avec succès');
      return data as Event | null;
    } catch (err: unknown) {
      console.error('Erreur lors de updateEvent:', err);
      notifyError('Erreur', 'Échec de la mise à jour de l\'événement');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      console.debug('🗑️ deleteEvent called for id:', id);
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('🗑️ deleteEvent executing as user:', currentUser?.id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant delete:', authErr);
      }

      const { error, count } = await sb
        .from('events')
        .delete()
        .eq('id', id);

      console.debug('🗑️ deleteEvent response:', { error, count });

      if (error) {
        console.error('❌ deleteEvent RLS/query error:', error);
        throw error;
      }

      setEvents(prev => {
        const updated = prev.filter(event => event.id !== id);
        console.debug('🗑️ updateState: removed event id', id, '— remaining events:', updated.length);
        return updated;
      });
      
      notifySuccess('Succès', 'Événement supprimé avec succès');
    } catch (err: unknown) {
      console.error('❌ Erreur lors de deleteEvent:', err);
      notifyError('Erreur', 'Échec de la suppression de l\'événement');
      throw err;
    }
  };

  return { events, loading, error, createEvent, updateEvent, deleteEvent, refreshEvents: fetchEvents };
};
