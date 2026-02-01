-- Idempotent policies to allow admin uploads and admin inserts for shared_archives
-- Run this in Supabase SQL Editor as a single query.

-- 1) Allow admins to INSERT objects into storage.objects for the bucket 'paroisse-files'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'allow_admins_insert_paroisse_files'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    EXECUTE $q$
      CREATE POLICY "allow_admins_insert_paroisse_files" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'paroisse-files' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    $q$;
  END IF;
END
$$;

-- 2) Allow admins to INSERT rows into public.shared_archives
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'allow_admins_insert_shared_archives'
      AND schemaname = 'public'
      AND tablename = 'shared_archives'
  ) THEN
    EXECUTE $q$
      CREATE POLICY "allow_admins_insert_shared_archives" ON public.shared_archives
      FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    $q$;
  END IF;
END
$$;

-- Notes:
-- - If you already created a policy with a different name, adjust the policyname check above accordingly.
-- - After running, test by uploading as an admin in the app.
-- - If problems persist, check the actual role assigned to your profile and the execution user (auth.uid()).
