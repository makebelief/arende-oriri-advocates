-- Arende CMS production hardening
-- Safe after base schema and publisher-lockdown migrations.

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  elsif new.status = 'draft' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before insert or update on public.posts
for each row execute function public.set_posts_updated_at();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='posts_title_length_chk') then
    alter table public.posts add constraint posts_title_length_chk check (char_length(title) between 1 and 180);
  end if;
  if not exists (select 1 from pg_constraint where conname='posts_excerpt_length_chk') then
    alter table public.posts add constraint posts_excerpt_length_chk check (char_length(excerpt) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname='posts_content_length_chk') then
    alter table public.posts add constraint posts_content_length_chk check (char_length(content) <= 500000);
  end if;
  if not exists (select 1 from pg_constraint where conname='posts_author_length_chk') then
    alter table public.posts add constraint posts_author_length_chk check (char_length(author) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname='posts_urls_length_chk') then
    alter table public.posts add constraint posts_urls_length_chk check (coalesce(char_length(cover_image),0) <= 2048 and coalesce(char_length(video_url),0) <= 2048);
  end if;
  if not exists (select 1 from pg_constraint where conname='posts_seo_length_chk') then
    alter table public.posts add constraint posts_seo_length_chk check (coalesce(char_length(seo_title),0) <= 180 and coalesce(char_length(seo_description),0) <= 500);
  end if;
end $$;

create index if not exists posts_public_listing_idx on public.posts(status,type,featured desc,published_at desc);

alter table public.posts enable row level security;
revoke insert, update, delete on public.posts from anon;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;

drop policy if exists "Authenticated can read all posts" on public.posts;
drop policy if exists "Authenticated can create posts" on public.posts;
drop policy if exists "Authenticated can update posts" on public.posts;
drop policy if exists "Authenticated can delete posts" on public.posts;
drop policy if exists "CMS publishers can read all posts" on public.posts;
drop policy if exists "CMS publishers can create posts" on public.posts;
drop policy if exists "CMS publishers can update posts" on public.posts;
drop policy if exists "CMS publishers can delete posts" on public.posts;

create policy "CMS publishers can read all posts" on public.posts for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role') = 'publisher');
create policy "CMS publishers can create posts" on public.posts for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role') = 'publisher');
create policy "CMS publishers can update posts" on public.posts for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role') = 'publisher')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role') = 'publisher');
create policy "CMS publishers can delete posts" on public.posts for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role') = 'publisher');

-- Configure bucket limits through storage.buckets; object mutations remain via Storage API.
update storage.buckets
set public=true,
    file_size_limit=10485760,
    allowed_mime_types=array['image/jpeg','image/png','image/webp']
where id='cms-media';

drop policy if exists "CMS authenticated uploads" on storage.objects;
drop policy if exists "CMS authenticated updates" on storage.objects;
drop policy if exists "CMS authenticated deletes" on storage.objects;
drop policy if exists "CMS publisher uploads" on storage.objects;
drop policy if exists "CMS publisher updates" on storage.objects;
drop policy if exists "CMS publisher deletes" on storage.objects;

create policy "CMS publisher uploads" on storage.objects for insert to authenticated
with check (bucket_id='cms-media' and (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role')='publisher'));
create policy "CMS publisher updates" on storage.objects for update to authenticated
using (bucket_id='cms-media' and (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role')='publisher'))
with check (bucket_id='cms-media' and (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role')='publisher'));
create policy "CMS publisher deletes" on storage.objects for delete to authenticated
using (bucket_id='cms-media' and (((select auth.jwt()) -> 'app_metadata' ->> 'cms_role')='publisher'));
