-- Présence chat : colonne utilisée par usePresence (heartbeat + realtime)

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Dernière activité déclarée de l''utilisateur (présence)';

COMMIT;
