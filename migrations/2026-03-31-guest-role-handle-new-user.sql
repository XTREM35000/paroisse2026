-- Rôle invité (guest) et profil par défaut pour les nouveaux comptes.
-- Exécuter sur Supabase (SQL) après revue des colonnes obligatoires de public.profiles.

-- Table roles (optionnelle) : n’insère que si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    INSERT INTO public.roles (name, description) VALUES
      ('guest', 'Invité - accès limité à l''accueil uniquement')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Trigger auth : création du profil avec rôle guest par défaut (sauf métadonnée role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger si besoin (décommenter si vous gérez l’auth.users ici)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
