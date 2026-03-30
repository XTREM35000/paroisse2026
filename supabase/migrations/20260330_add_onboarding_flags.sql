-- Ajouter les colonnes de tracking pour l'onboarding
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_seen_role_manager BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_seen_officiant_manager BOOLEAN DEFAULT false;
