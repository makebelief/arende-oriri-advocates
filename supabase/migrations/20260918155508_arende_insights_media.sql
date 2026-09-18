-- ARENDE ORIRI & ASSOCIATES ADVOCATES — INSIGHTS & MEDIA CMS
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content text not null default '',
  type text not null default 'article' check (type in ('article','news','video')),
  status text not null default 'draft' check (status in ('draft','published')),
  cover_image text,
  video_url text,
  author text not null default 'Kevin Arende Oriri',
  tags text[] not null default '{}',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_idx on public.posts(status,published_at desc);
create index if not exists posts_type_idx on public.posts(type);
create index if not exists posts_featured_idx on public.posts(featured) where status='published';

alter table public.posts enable row level security;

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts for select to anon using (status='published');

drop policy if exists "Authenticated can read all posts" on public.posts;
create policy "Authenticated can read all posts" on public.posts for select to authenticated using (true);

drop policy if exists "Authenticated can create posts" on public.posts;
create policy "Authenticated can create posts" on public.posts for insert to authenticated with check (true);

drop policy if exists "Authenticated can update posts" on public.posts;
create policy "Authenticated can update posts" on public.posts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated can delete posts" on public.posts;
create policy "Authenticated can delete posts" on public.posts for delete to authenticated using (true);

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('cms-media','cms-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "CMS authenticated uploads" on storage.objects;
create policy "CMS authenticated uploads" on storage.objects for insert to authenticated with check (bucket_id='cms-media');

drop policy if exists "CMS authenticated updates" on storage.objects;
create policy "CMS authenticated updates" on storage.objects for update to authenticated using (bucket_id='cms-media') with check (bucket_id='cms-media');

drop policy if exists "CMS authenticated deletes" on storage.objects;
create policy "CMS authenticated deletes" on storage.objects for delete to authenticated using (bucket_id='cms-media');

-- SECURITY IMPORTANT:
-- In Supabase Authentication settings, disable public user sign-ups.
-- Create only the authorized CMS user(s) manually in Authentication > Users.
