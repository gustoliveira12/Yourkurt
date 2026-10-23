-- Migra URLs legadas de posts.image_urls e posts.image_url para public.post_media
-- com lock transacional, preservando ordem e removendo colunas legadas ao final.
begin;

lock table public.posts in exclusive mode;

insert into public.post_media (
  id,
  post_id,
  storage_path,
  position_index,
  media_type
)
select
  gen_random_uuid() as id,
  src.post_id,
  src.storage_path,
  src.position_index,
  'image'::text as media_type
from (
  -- Fonte 1: image_urls (array) com ordem preservada
  select
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
    ) as storage_path,
    greatest(u.ordinality - 1, 0)::integer as position_index
  from public.posts p
  cross join lateral unnest(coalesce(p.image_urls, '{}'::text[]))
    with ordinality as u(url, ordinality)

  union

  -- Fonte 2: image_url (coluna legada única), também avaliada mesmo com image_urls preenchido
  select
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
    ) as storage_path,
    0::integer as position_index
  from public.posts p
  where p.image_url is not null
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

alter table public.posts
  drop column image_url,
  drop column image_urls;

commit;