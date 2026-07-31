alter table if exists public.posts
  add column if not exists image_urls text[] not null default '{}'::text[];

update public.posts
set image_urls = case
  when image_url is not null and image_url <> '' then array[image_url]
  else '{}'::text[]
end
where image_urls is null or cardinality(image_urls) = 0;
