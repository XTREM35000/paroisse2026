// scripts/copy-files-between-buckets.ts
// Usage:
//  - Dry run: npx ts-node scripts/copy-files-between-buckets.ts --dry --pattern=Paroisse01
//  - Apply   : npx ts-node scripts/copy-files-between-buckets.ts --from=video-files --to=paroisse-files --pattern=1769984630459
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseArg(name: string) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return undefined;
  return arg.split('=')[1];
}

const dry = process.argv.includes('--dry');
const fromBucket = parseArg('from') || 'video-files';
const toBucket = parseArg('to') || 'paroisse-files';
const pattern = parseArg('pattern') || parseArg('names') || '';
const targetPrefix = parseArg('prefix') || '';

console.log(dry ? '🔎 Dry run - will not modify storage' : '⚙️ Running - will copy objects');
console.log(`From: ${fromBucket} -> To: ${toBucket} (pattern: "${pattern}")`);

async function listAllObjects(bucket: string): Promise<{ name: string }[]> {
  // naive pagination; increase limit if needed
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  if (error) throw error;
  return (data ?? []) as { name: string }[];
}

function matchesPattern(name: string) {
  if (!pattern) return true;
  // comma-separated patterns
  const parts = pattern.split(',').map(p => p.trim()).filter(Boolean);
  return parts.some(p => name.includes(p));
}

function normalizeDestination(name: string) {
  return targetPrefix ? `${targetPrefix.replace(/\/$/, '')}/${name}` : name;
}

function guessContentType(name: string) {
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  return undefined;
}

interface CopyResult {
  name: string;
  ok: boolean;
  dest?: string;
  dry?: boolean;
  reason?: string;
  err?: unknown;
}

async function copyObject(name: string): Promise<CopyResult> {
  console.log(`Processing: ${name}`);

  // Try direct download
  const dl = await supabase.storage.from(fromBucket).download(name);
  if (dl.error || !dl.data) {
    console.error(`  ❌ Download failed for ${name}:`, dl.error || 'no data');
    return { name, ok: false, reason: 'download failed', err: dl.error };
  }

  // Convert to Buffer
  const arrayBuffer = await dl.data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dest = normalizeDestination(name);
  if (dry) {
    console.log(`  (dry) would upload to ${toBucket}/${dest}`);
    return { name, ok: true, dest, dry: true };
  }

  const contentType = guessContentType(name);
  const up = await supabase.storage.from(toBucket).upload(dest, buffer, { contentType });
  if (up.error) {
    console.error(`  ❌ Upload failed for ${name}:`, up.error);
    return { name, ok: false, reason: 'upload failed', err: up.error };
  }

  console.log(`  ✅ Copied to ${toBucket}/${dest}`);
  return { name, ok: true, dest };
}

async function main() {
  const objects = await listAllObjects(fromBucket);
  const candidates = objects.map(o => o.name).filter(matchesPattern);

  if (candidates.length === 0) {
    console.log('No objects matched the pattern.');
    return;
  }

  console.log(`Found ${candidates.length} candidate(s):`, candidates);

  const results: CopyResult[] = [];
  for (const name of candidates) {
    try {
      const r = await copyObject(name);
      results.push(r);
    } catch (e: unknown) {
      console.error('Unexpected error for', name, e);
      results.push({ name, ok: false, err: e });
    }
  }

  console.table(results.map((r: CopyResult) => ({ name: r.name, ok: !!r.ok, dest: r.dest ?? null, reason: r.reason ?? null })));

}

main().catch(e => { console.error('Fatal', e); process.exit(1); });
