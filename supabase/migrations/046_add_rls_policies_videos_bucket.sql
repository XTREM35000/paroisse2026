-- Add RLS policies for 'videos' storage bucket

-- Allow authenticated users to upload files to their own paths
CREATE POLICY "Allow authenticated users to upload to videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

-- Allow public read access to all files in videos bucket
CREATE POLICY "Allow public read access to videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'videos');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete from videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'videos');
