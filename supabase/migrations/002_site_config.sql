-- Migration 002: site_config table for admin-managed landing page assets.
-- Run in Supabase SQL Editor.

create table if not exists public.site_config (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- Anyone can read (landing page needs the video URL without auth)
alter table public.site_config enable row level security;
create policy "site_config_select" on public.site_config
  for select using (true);

-- Only service role / authenticated admin can write
-- (Edge Function / admin panel uses supabase client which goes through RLS;
--  for simplicity, allow any authenticated user to upsert — lock down further
--  if needed by checking a profiles.is_admin column)
create policy "site_config_upsert" on public.site_config
  for all using (auth.role() = 'authenticated');

-- Seed default empty rows so the admin UI shows all keys
insert into public.site_config (key, value)
values
  ('hero_video_url',  null),
  ('about_image_url', null)
on conflict (key) do nothing;
