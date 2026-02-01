/*
  Script de test minimal pour téléverser un zip dans Supabase Storage et créer une entrée dans shared_archives.
  Usage: SUPABASE_URL + SUPABASE_KEY dans env, puis: ts-node scripts/test-zip-upload.ts ./path/to/archive.zip videos
*/

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const bucket = 'paroisse-files';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node scripts/test-zip-upload.ts <zip-path> <mediaType>');
    process.exit(1);
  }
  const [zipPath, mediaType] = args;
  if (!fs.existsSync(zipPath)) {
    console.error('File not found', zipPath);
    process.exit(1);
  }

  const file = fs.readFileSync(zipPath);
  const fileName = path.basename(zipPath);
  const dest = `zips/${mediaType}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(dest, file);
  if (error) {
    console.error('Upload error', error);
    process.exit(1);
  }

  const { error: insertError } = await supabase.from('shared_archives').insert({ file_name: fileName, file_path: dest, file_size: file.length, media_type: mediaType });
  if (insertError) {
    console.error('Insert metadata error', insertError);
    process.exit(1);
  }

  console.log('Uploaded and metadata inserted successfully');
}

main().catch((err) => { console.error(err); process.exit(1); });
