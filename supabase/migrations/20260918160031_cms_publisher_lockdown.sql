-- Arende CMS publisher authorization hardening.
-- Only users carrying app_metadata.cms_role = publisher may manage CMS content.

drop policy if exists "Authenticated can read all posts" on public.posts;
drop policy if exists "Authenticated can create posts" on public.posts;
drop policy if exists "Authenticated can update posts" on public.posts;
drop policy if exists "Authenticated can delete posts" on public.posts;

drop policy if exists "CMS publishers can read all posts" on public.posts;
drop policy if exists "CMS publishers can create posts" on public.posts;
drop policy if exists "CMS publishers can update posts" on public.posts;
drop policy if exists "CMS publishers can delete posts" on public.posts;

create policy "CMS publishers can read all posts"
on public.posts
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

create policy "CMS publishers can create posts"
on public.posts
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

create policy "CMS publishers can update posts"
on public.posts
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

create policy "CMS publishers can delete posts"
on public.posts
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

drop policy if exists "CMS authenticated uploads" on storage.objects;
drop policy if exists "CMS authenticated updates" on storage.objects;
drop policy if exists "CMS authenticated deletes" on storage.objects;

drop policy if exists "CMS publisher uploads" on storage.objects;
drop policy if exists "CMS publisher updates" on storage.objects;
drop policy if exists "CMS publisher deletes" on storage.objects;

create policy "CMS publisher uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cms-media'
  and (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

create policy "CMS publisher updates"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cms-media'
  and (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
)
with check (
  bucket_id = 'cms-media'
  and (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);

create policy "CMS publisher deletes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cms-media'
  and (auth.jwt() -> 'app_metadata' ->> 'cms_role') = 'publisher'
);
