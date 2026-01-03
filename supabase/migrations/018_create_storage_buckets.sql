-- =====================================================
-- Configuration des buckets de stockage pour Supabase
-- =====================================================

-- 1. Créer le bucket directory-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('directory-images', 'directory-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurer les RLS policies pour directory-images
DROP POLICY IF EXISTS "Public access to directory-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to directory-images" ON storage.objects;

-- 3. Policy pour lire les images (public)
CREATE POLICY "Public access to directory-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'directory-images');

-- 4. Policy pour uploader (admins seulement)
CREATE POLICY "Admin can upload to directory-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 5. Policy pour supprimer (admins seulement)
CREATE POLICY "Admin can delete from directory-images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 6. Policy pour mettre à jour (admins seulement)
CREATE POLICY "Admin can update directory-images"
  ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
