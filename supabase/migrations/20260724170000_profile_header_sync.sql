alter table public.profiles
  add column if not exists header_url text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
  meta_username text;
  meta_bio text;
  meta_visibility text;
  meta_theme text;
  meta_receive_updates boolean;
  meta_header_url text;
begin
  meta_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  meta_username := nullif(lower(trim(new.raw_user_meta_data->>'username')), '');
  meta_bio := nullif(trim(new.raw_user_meta_data->>'bio'), '');
  meta_header_url := nullif(trim(new.raw_user_meta_data->>'header_url'), '');

  meta_visibility := case
    when new.raw_user_meta_data->>'profile_visibility' in ('public', 'private')
      then new.raw_user_meta_data->>'profile_visibility'
    else 'public'
  end;

  meta_theme := case
    when new.raw_user_meta_data->>'theme_preference' in ('system', 'light', 'dark')
      then new.raw_user_meta_data->>'theme_preference'
    else 'system'
  end;

  meta_receive_updates := case
    when lower(coalesce(new.raw_user_meta_data->>'receive_product_updates', '')) in ('true', 'false')
      then (new.raw_user_meta_data->>'receive_product_updates')::boolean
    else true
  end;

  insert into public.profiles (
    id,
    email,
    name,
    username,
    bio,
    profile_visibility,
    theme_preference,
    receive_product_updates,
    header_url
  )
  values (
    new.id,
    new.email,
    coalesce(meta_name, split_part(new.email, '@', 1), 'Novo usuário'),
    meta_username,
    meta_bio,
    meta_visibility,
    meta_theme,
    meta_receive_updates,
    meta_header_url
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    username = coalesce(excluded.username, public.profiles.username),
    bio = coalesce(excluded.bio, public.profiles.bio),
    profile_visibility = coalesce(excluded.profile_visibility, public.profiles.profile_visibility),
    theme_preference = coalesce(excluded.theme_preference, public.profiles.theme_preference),
    receive_product_updates = coalesce(excluded.receive_product_updates, public.profiles.receive_product_updates),
    header_url = coalesce(excluded.header_url, public.profiles.header_url),
    updated_at = now();

  return new;
end;
$$;

insert into public.profiles (
  id,
  email,
  name,
  username,
  bio,
  profile_visibility,
  theme_preference,
  receive_product_updates,
  header_url
)
select
  u.id,
  u.email,
  coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1), 'Novo usuário'),
  nullif(lower(trim(u.raw_user_meta_data->>'username')), ''),
  nullif(trim(u.raw_user_meta_data->>'bio'), ''),
  case
    when u.raw_user_meta_data->>'profile_visibility' in ('public', 'private')
      then u.raw_user_meta_data->>'profile_visibility'
    else 'public'
  end,
  case
    when u.raw_user_meta_data->>'theme_preference' in ('system', 'light', 'dark')
      then u.raw_user_meta_data->>'theme_preference'
    else 'system'
  end,
  case
    when lower(coalesce(u.raw_user_meta_data->>'receive_product_updates', '')) in ('true', 'false')
      then (u.raw_user_meta_data->>'receive_product_updates')::boolean
    else true
  end,
  nullif(trim(u.raw_user_meta_data->>'header_url'), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p
set
  email = coalesce(u.email, p.email),
  name = coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), p.name),
  username = coalesce(nullif(lower(trim(u.raw_user_meta_data->>'username')), ''), p.username),
  bio = coalesce(nullif(trim(u.raw_user_meta_data->>'bio'), ''), p.bio),
  profile_visibility = case
    when u.raw_user_meta_data->>'profile_visibility' in ('public', 'private')
      then u.raw_user_meta_data->>'profile_visibility'
    else p.profile_visibility
  end,
  theme_preference = case
    when u.raw_user_meta_data->>'theme_preference' in ('system', 'light', 'dark')
      then u.raw_user_meta_data->>'theme_preference'
    else p.theme_preference
  end,
  receive_product_updates = case
    when lower(coalesce(u.raw_user_meta_data->>'receive_product_updates', '')) in ('true', 'false')
      then (u.raw_user_meta_data->>'receive_product_updates')::boolean
    else p.receive_product_updates
  end,
  header_url = coalesce(nullif(trim(u.raw_user_meta_data->>'header_url'), ''), p.header_url),
  updated_at = now()
from auth.users u
where p.id = u.id;
