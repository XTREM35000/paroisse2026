import React, { useEffect, useState } from 'react';
import BaseModal from './base-modal';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/database';
import { Button } from '@/components/ui/button';

interface EventDetailModalProps {
  slugOrId: string;
  open: boolean;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ slugOrId, open, onClose }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as unknown as any;
        const { data: bySlug, error: errBySlug } = await client
          .from('events')
          .select('*')
          .eq('slug', slugOrId)
          .maybeSingle();

        if (errBySlug) console.debug('fetch by slug:', errBySlug);
        let data = bySlug || null;

        if (!data) {
          const { data: byId, error: errById } = await client
            .from('events')
            .select('*')
            .eq('id', slugOrId)
            .maybeSingle();
          if (errById) console.debug('fetch by id fallback:', errById);
          data = byId || null;
        }

        if (!mounted) return;
        setEvent(data);
        if (data) {
          document.title = data.seo_title || data.title;
        }
      } catch (e) {
        if (!mounted) return;
        setError('Impossible de charger l\'événement');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEvent();
    return () => {
      mounted = false;
    };
  }, [slugOrId, open]);

  return (
    <BaseModal open={open} onClose={onClose}>
      <div className="max-w-3xl mx-auto p-6">
        {loading && <div>Chargement...</div>}
        {error && <div className="text-destructive">{error}</div>}
        {!loading && !error && !event && <div>Événement non trouvé</div>}

        {event && (
          <article>
            {event.image_url && (
              <div className="mb-4 rounded overflow-hidden bg-muted">
                <img src={event.image_url} alt={event.title} className="w-full h-56 object-cover" />
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">{new Date(event.start_date).toLocaleString('fr-FR')}</p>
            <div className="prose max-w-none">
              {event.content ? (
                <div dangerouslySetInnerHTML={{ __html: event.content }} />
              ) : (
                <p>{event.description}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </div>
          </article>
        )}
      </div>
    </BaseModal>
  );
};

export default EventDetailModal;
