-- post_media: normalized media for posts (legacy posts.image_url/image_urls kept for now).
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 512),
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

create index post_media_post_id_idx on public.post_media (post_id);

alter table public.post_media enable row level security;

create policy post_media_select on public.post_media
for select using (
  exists (
    select 1 from public.posts p
    where p.id = post_media.post_id
      and (p.is_public = true or p.user_id = auth.uid())
  )
);

create policy post_media_insert_owner on public.post_media
for insert to authenticated
with check (
  exists (
    select 1 from public.posts p
    where p.id = post_media.post_id and p.user_id = auth.uid()
  )
);

create policy post_media_delete_owner on public.post_media
for delete to authenticated
using (
  exists (
    select 1 from public.posts p
    where p.id = post_media.post_id and p.user_id = auth.uid()
  )
);

-- Storage: RESTRICTIVE policies are ANDed with the existing permissive
-- ownership policies, so they can only narrow what is allowed.
drop policy if exists "image_extensions_insert" on storage.objects;
create policy "image_extensions_insert"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id not in ('post-images', 'avatars', 'headers')
  or right(lower(name), 4) in ('.jpg', '.png')
  or right(lower(name), 5) in ('.jpeg', '.webp')
);

drop policy if exists "image_extensions_update" on storage.objects;
create policy "image_extensions_update"
on storage.objects
as restrictive
for update
to authenticated
with check (
  bucket_id not in ('post-images', 'avatars', 'headers')
  or right(lower(name), 4) in ('.jpg', '.png')
  or right(lower(name), 5) in ('.jpeg', '.webp')
);
