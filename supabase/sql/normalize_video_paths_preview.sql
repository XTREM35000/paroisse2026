-- Preview candidate updates: show how we would prefix with 'videos/'
SELECT id, video_storage_path, 'videos/' || video_storage_path AS candidate
FROM videos
WHERE video_storage_path IS NOT NULL
  AND video_storage_path NOT LIKE '%/%'
LIMIT 200;

-- Apply update only when the candidate exists in storage.objects (requires DB privileges)
-- NOTE: depending on your Supabase setup access to storage.objects may be limited; prefer using the provided script.

-- UPDATE videos v
-- SET video_storage_path = 'videos/' || v.video_storage_path
-- WHERE v.video_storage_path IS NOT NULL
--   AND v.video_storage_path NOT LIKE '%/%'
--   AND EXISTS (
--     SELECT 1 FROM storage.objects o
--     WHERE o.bucket_id = 'paroisse-files'
--       AND o.name = 'videos/' || v.video_storage_path
--   );
