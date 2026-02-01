// scripts/normalize-video-paths.ts
// Usage:
//  - Dry run: npx ts-node scripts/normalize-video-paths.ts --dry
//  - Apply   : npx ts-node scripts/normalize-video-paths.ts
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js';

/**
 * Ensure `fetch` is available at runtime (Node 18+ provides global fetch).
 * If not, try to dynamically import `node-fetch` at runtime.
 */
declare const fetch: typeof globalThis.fetch;
async function ensureFetchAvailable() {
  if (typeof fetch !== 'function') {
    try {
      const nf = await import('node-fetch');
      (globalThis as unknown as { fetch?: typeof fetch }).fetch = nf?.default ?? nf;
    } catch (e: unknown) {
      console.error('Fetch is not available in this Node runtime and node-fetch could not be loaded. Please use Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'paroisse-files';
const CANDIDATE_PREFIXES = ['videos/', 'public/', 'media/videos/', 'zips/', ''];

interface VideoRow {
  id: string;
  video_storage_path?: string | null;
  video_url?: string | null;
}

async function existsBySignedUrl(path: string) {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return false;
    const res = await fetch(data.signedUrl);
    return res.ok;
  } catch (e: unknown) {
    return false;
  }
}

async function tryFindPath(name: string) {
  // Try exact name and candidate prefixes
  for (const p of CANDIDATE_PREFIXES) {
    const candidate = p ? `${p}${name}` : name;
    if (await existsBySignedUrl(candidate)) return candidate;
  }

  // Try to list folders and match
  for (const p of ['videos', 'public', 'media/videos', '']) {
    try {
      const prefix = p || '';
      const res = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 }) as { data: { name: string }[] | null; error: unknown };
      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        const found = res.data.find(it => it.name === name || decodeURIComponent(it.name) === name);
        if (found) return prefix ? `${prefix}/${found.name}` : found.name;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

async function main() {
  const dry = process.argv.includes('--dry');

  await ensureFetchAvailable();

  console.log(dry ? '🔎 Dry run - no DB changes' : '⚙️ Running - changes will be applied');

  const { data: rows, error: fetchErr } = await supabase
    .from('videos')
    .select('id, video_storage_path, video_url')
    .order('created_at', { ascending: false });

  if (fetchErr) {
    console.error('Failed to fetch videos:', fetchErr);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No video rows found.');
    return;
  }

  interface ReportRow { id: string; before: string | null; found?: string; status: string }
  const report: ReportRow[] = [];
  for (const r of (rows as VideoRow[])) {
    const id = r.id;
    const path = r.video_storage_path;

    if (!path) {
      report.push({ id, before: null, status: 'no path' });
      continue;
    }

    if (path.includes('/')) {
      // Looks like a path already
      const exists = await existsBySignedUrl(path);
      report.push({ id, before: path, status: exists ? 'ok: exists' : 'missing (full path)' });
      continue;
    }

    const found = await tryFindPath(path);
    if (found) {
      report.push({ id, before: path, found, status: 'found' });
      if (!dry) {
        const { error: updateErr } = await supabase.from('videos').update({ video_storage_path: found }).eq('id', id);
        if (updateErr) console.error('Update failed for', id, updateErr);
      }
    } else {
      report.push({ id, before: path, status: 'missing' });
    }
  }

  console.table(report);
  console.log(dry ? 'Dry run complete - no DB changes applied.' : 'Done - DB updated where path found.');
}

main().catch((e) => { console.error('Fatal error', e); process.exit(1); });
