insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'post-images');

drop policy if exists "post_images_auth_insert_own" on storage.objects;
create policy "post_images_auth_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_images_auth_update_own" on storage.objects;
create policy "post_images_auth_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_images_auth_delete_own" on storage.objects;
create policy "post_images_auth_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
