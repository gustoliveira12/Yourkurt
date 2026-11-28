-- Bucket das imagens das comunidades (avatar e capa).
-- Caminho: community-images/<community_id>/<avatar|header>-<timestamp>.<ext>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-images', 'community-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- A pasta é o id da comunidade. Uma pasta que não é uuid (ex.: "abc") não pode
-- estourar erro de conversão dentro da policy; ela só nega o acesso.
create or replace function public.can_manage_community_files(p_folder text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  begin
    v_id := p_folder::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return public.is_community_owner(v_id) or public.is_current_user_admin();
end;
$$;

revoke all on function public.can_manage_community_files(text) from public, anon;
grant execute on function public.can_manage_community_files(text) to authenticated;

drop policy if exists "community_images_public_read" on storage.objects;
create policy "community_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'community-images');

drop policy if exists "community_images_manage_insert" on storage.objects;
create policy "community_images_manage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and public.can_manage_community_files((storage.foldername(name))[1])
);

drop policy if exists "community_images_manage_update" on storage.objects;
create policy "community_images_manage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-images'
  and public.can_manage_community_files((storage.foldername(name))[1])
)
with check (
  bucket_id = 'community-images'
  and public.can_manage_community_files((storage.foldername(name))[1])
);

drop policy if exists "community_images_manage_delete" on storage.objects;
create policy "community_images_manage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-images'
  and public.can_manage_community_files((storage.foldername(name))[1])
);

-- Restritivas: recriadas com o novo bucket, mantendo os que já estavam.
drop policy if exists "image_extensions_insert" on storage.objects;
create policy "image_extensions_insert"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id not in ('post-images', 'avatars', 'headers', 'community-images')
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
  bucket_id not in ('post-images', 'avatars', 'headers', 'community-images')
  or right(lower(name), 4) in ('.jpg', '.png')
  or right(lower(name), 5) in ('.jpeg', '.webp')
);
