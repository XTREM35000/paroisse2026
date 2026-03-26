-- Fix: Supabase managed Postgres disallows setting `session_replication_role`
-- for non-superuser roles, which caused RESET to fail.
-- We redefine `public.reset_all_data()` without using `session_replication_role`.

CREATE OR REPLACE FUNCTION public.reset_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  t text;
  dev_user_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Truncate known content tables if present (CASCADE to keep FKs consistent)
  FOREACH t IN ARRAY ARRAY[
    'public.videos',
    'public.events',
    'public.gallery_images',
    'public.homilies',
    'public.announcements',
    'public.donations',
    'public.chat_messages',
    'public.comments',
    'public.likes',
    'public.favorites',
    'public.notifications',
    'public.prayer_intentions',
    'public.tutoriels',
    'public.receipts',
    'public.backups',
    'public.audit_logs',
    'public.header_config',
    'public.footer_config',
    'public.page_hero_banners',
    'public.homepage_sections',
    'public.about_page_sections',
    'public.directory',
    'public.documents'
  ]
  LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE %s CASCADE', t);
    END IF;
  END LOOP;

  -- Keep only developer profile + SYSTEM parish
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id <> dev_user_id;
  END IF;

  IF to_regclass('public.paroisses') IS NOT NULL THEN
    DELETE FROM public.paroisses WHERE slug <> 'system';
  END IF;

  -- Remove any auth users except developer (may fail on hosted Supabase; keep defensive)
  BEGIN
    DELETE FROM auth.users WHERE id <> dev_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reset_all_data: could not delete from auth.users: %', SQLERRM;
  END;

  -- Ensure SYSTEM + developer exist after cleanup
  PERFORM public.ensure_developer_account();
END;
$$;

-- Keep grants consistent with existing migrations
GRANT EXECUTE ON FUNCTION public.reset_all_data() TO anon;
GRANT EXECUTE ON FUNCTION public.reset_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_all_data() TO service_role;

