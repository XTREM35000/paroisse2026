-- 1. Créer les tables
-- (exécuter les CREATE TABLE ci-dessus)

-- 2. Créer les triggers
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'display_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- 3. Créer le trigger pour ajouter le developer aux nouvelles paroisses
-- (exécuter le trigger ci-dessus)

-- 4. Exécuter la création du developer (via Edge Function ou appel SQL)
-- Option: Appel direct avec service_role
SELECT public.handle_first_launch_developer();