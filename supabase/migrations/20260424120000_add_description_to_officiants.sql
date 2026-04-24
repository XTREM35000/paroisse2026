-- Add officiants.description (keep existing bio untouched)
alter table public.officiants
add column if not exists description text;

