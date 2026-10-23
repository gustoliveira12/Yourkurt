-- Migra URLs legadas de posts.image_urls e posts.image_url para public.post_media
-- Extraindo o storage_path relativo ao bucket "post-images".

insert into public.post_media (id, post_id, storage_path, media_type)
select
  gen_random_uuid() as id,
  src.post_id,
  src.storage_path,
  'image'::text as media_type
from (
  -- Fonte 1: image_urls (array)
  select distinct
    p.id as post_id,
    nullif(
      split_part(
        split_part(
          split_part(u.url, 'post-images/', 2),
          '?',
          1
        ),
        '#',
        1
      ),
      ''
    ) as storage_path
  from public.posts p
  cross join lateral unnest(coalesce(p.image_urls, '{}'::text[])) as u(url)

  union

  -- Fonte 2: image_url (coluna legada única), somente quando image_urls estiver vazio
  select distinct
    p.id as post_id,
    nullif(
      split_part(
        split_part(
          split_part(p.image_url, 'post-images/', 2),
          '?',
          1
        ),
        '#',
        1
      ),
      ''
    ) as storage_path
  from public.posts p
  where coalesce(cardinality(p.image_urls), 0) = 0
    and p.image_url is not null
    and btrim(p.image_url) <> ''
) as src
where src.storage_path is not null
  and not exists (
    select 1
    from public.post_media pm
    where pm.post_id = src.post_id
      and pm.storage_path = src.storage_path
      and pm.media_type = 'image'
  );