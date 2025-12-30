-- Migration: créer profil automatiquement lors de la création d'un utilisateur auth
-- Exécuter dans Supabase SQL Editor ou via psql connecté à la base.

-- Fonction qui insère un profil quand une nouvelle ligne est ajoutée dans auth.users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Essayer d'insérer le profil ; ne pas faire échouer la création d'utilisateur si insertion rate
  begin
    insert into public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
    values (
      new.id,
      new.email,
      -- user_metadata may be stored in user_metadata or raw_user_meta depending on Supabase version
      coalesce(new.user_metadata ->> 'full_name', new.raw_user_meta ->> 'full_name'),
      coalesce(new.user_metadata ->> 'avatar_url', null),
      'membre',
      now(),
      now()
    )
    on conflict (id) do update set updated_at = now();
  exception when others then
    -- Log a notice for debugging, but don't raise to caller (avoids breaking signup)
    raise notice 'handle_auth_user_created: failed to insert profile for user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Trigger qui appelle la fonction après insertion dans auth.users
drop trigger if exists trigger_auth_user_created on auth.users;
create trigger trigger_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

-- Notes:
-- - Exécutez cette migration dans Supabase SQL Editor.
-- - Si vous avez RLS/politiques, assurez-vous que le rôle qui exécute la fonction a le droit d'insérer dans public.profiles.
-- - Tester avec `select * from auth.users order by created_at desc limit 5;` et `select * from public.profiles order by created_at desc limit 5;`
