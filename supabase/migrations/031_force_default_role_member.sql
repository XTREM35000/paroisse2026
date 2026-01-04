-- Ensure profiles inserted have sensible default role and promote first profile to admin
create or replace function public.ensure_profile_role()
returns trigger as $$
begin
  if new.role is null then
    new.role := 'membre';
  end if;

  -- If this is the first profile in the table, make it admin (useful for initial setup)
  if (select count(*) from public.profiles) = 0 then
    new.role := 'admin';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_ensure_profile_role on public.profiles;
create trigger trigger_ensure_profile_role
before insert on public.profiles
for each row execute function public.ensure_profile_role();
