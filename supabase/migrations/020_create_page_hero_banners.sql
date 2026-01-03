-- Migration: create table for per-page hero banners
create table if not exists public.page_hero_banners (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  image_url text,
  metadata jsonb,
  updated_at timestamptz default now()
);

-- Enable RLS and simple policies: public reads, authenticated writes
alter table public.page_hero_banners enable row level security;

create policy "public_select" on public.page_hero_banners for select using (true);

create policy "authenticated_insert" on public.page_hero_banners for insert with check (auth.role() = 'authenticated');
create policy "authenticated_update" on public.page_hero_banners for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated_delete" on public.page_hero_banners for delete using (auth.role() = 'authenticated');

-- Grant select to anon role if needed (depends on Supabase config)
-- grant select on public.page_hero_banners to anon;
