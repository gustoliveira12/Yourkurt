alter table public.profiles
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists theme_preference text not null default 'system',
  add column if not exists receive_product_updates boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_profile_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_profile_visibility_check
      check (profile_visibility in ('public', 'private'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_preference_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_preference_check
      check (theme_preference in ('system', 'light', 'dark'));
  end if;
end
$$;

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
begin
  meta_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  meta_username := nullif(lower(trim(new.raw_user_meta_data->>'username')), '');
  meta_bio := nullif(trim(new.raw_user_meta_data->>'bio'), '');

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
    receive_product_updates
  )
  values (
    new.id,
    new.email,
    coalesce(meta_name, split_part(new.email, '@', 1), 'Novo usuário'),
    meta_username,
    meta_bio,
    meta_visibility,
    meta_theme,
    meta_receive_updates
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
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (
  id,
  email,
  name,
  username,
  bio,
  profile_visibility,
  theme_preference,
  receive_product_updates
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
  end
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
  updated_at = now()
from auth.users u
where p.id = u.id;
