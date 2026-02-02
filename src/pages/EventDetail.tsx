import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/database';

const EventDetail = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as unknown as any;
        // Try slug first
        const { data: bySlug, error: errBySlug } = await client
          .from('events')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (errBySlug) {
          console.error('Erreur fetch event by slug:', errBySlug);
        }

        let data = bySlug || null;

        // Fallback to id if slug lookup returned nothing
        if (!data && slug) {
          const { data: byId, error: errById } = await client
            .from('events')
            .select('*')
            .eq('id', slug)
            .maybeSingle();

          if (errById) console.error('Erreur fetch event by id fallback:', errById);
          data = byId || null;
        }

        setEvent(data);
        if (data) {
          document.title = data.seo_title || data.title;
          const metaDesc = document.querySelector("meta[name='description']");
          if (metaDesc) metaDesc.setAttribute('content', data.seo_description || data.description || '');
        }
      } catch (e) {
        console.error('Exception fetch event detail:', e);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  if (loading) return <Layout><div className="p-8">Chargement...</div></Layout>;
  if (!event) return <Layout><div className="p-8">Événement non trouvé</div></Layout>;

  return (
    <Layout>
      <main className="max-w-4xl mx-auto p-6">
        {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover rounded-lg mb-6" />}
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{new Date(event.start_date).toLocaleString('fr-FR')}</p>
        <div className="prose max-w-none">
          {/* Render content (raw) */}
          {event.content ? <div dangerouslySetInnerHTML={{ __html: event.content }} /> : <p>{event.description}</p>}
        </div>
      </main>
    </Layout>
  );
};

export default EventDetail;
