-- 1. Table pour tracker les métadonnées des archives
CREATE TABLE IF NOT EXISTS shared_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    media_type TEXT CHECK (media_type IN ('videos', 'images', 'documents'))
);

-- Index utile
CREATE INDEX IF NOT EXISTS idx_shared_archives_created_at ON shared_archives(created_at DESC);

-- 2. Activer RLS
ALTER TABLE shared_archives ENABLE ROW LEVEL SECURITY;

-- Admins full access (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access to shared_archives' AND tablename = 'shared_archives') THEN
    EXECUTE $q$CREATE POLICY "Admins full access to shared_archives" ON shared_archives FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );$q$;
  END IF;
END
$$;

-- Authenticated users can view (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view shared_archives' AND tablename = 'shared_archives') THEN
    EXECUTE $q$CREATE POLICY "Authenticated users can view shared_archives" ON shared_archives FOR SELECT USING (auth.role() = 'authenticated');$q$;
  END IF;
END
$$;

-- Notes & manual steps (apply in Supabase Storage policies UI for bucket 'paroisse-files'):
-- 1) Create a storage policy to allow admins to INSERT objects into 'paroisse-files' (optionally restrict to .zip extension); example condition: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') AND bucket_id = 'paroisse-files'
-- 2) Allow SELECT on storage.objects for public downloads if that's your desired policy (or configure signed URLs via your server).
-- 3) After running this migration, create the folder prefixes 'zips/videos', 'zips/images', 'zips/documents' in your bucket (or upload one sample file) to make them discoverable in the UI.
