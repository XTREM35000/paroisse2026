#!/usr/bin/env node
/* Backfill script: generate slugs for events missing slug */
import slugify from '../src/lib/slugify';
import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const sb = supabase as any;
  console.log('Fetching events with missing slug...');
  const { data: events, error } = await sb.from('events').select('id,title,slug').is('slug', null);
  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }
  if (!events || events.length === 0) {
    console.log('No events require slugs.');
    return;
  }

  for (const ev of events) {
    try {
      const base = slugify(ev.title || `event-${ev.id}`);
      let candidate = base;
      let idx = 1;
      while (true) {
        const { data: found } = await sb.from('events').select('id').eq('slug', candidate).limit(1);
        if (!found || found.length === 0) break;
        candidate = `${base}-${idx++}`;
      }
      const { error: upErr } = await sb.from('events').update({ slug: candidate }).eq('id', ev.id);
      if (upErr) {
        console.error('Error updating event', ev.id, upErr);
      } else {
        console.log('Updated event', ev.id, 'slug=', candidate);
      }
    } catch (e) {
      console.error('Exception processing event', ev.id, e);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
