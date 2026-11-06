-- Seguidores (modelo Twitter): follower_id segue following_id, sem aprovação.

create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists idx_follows_following_id on public.follows (following_id);

alter table public.follows enable row level security;

revoke all on public.follows from anon;
grant select, insert, delete on public.follows to authenticated;

drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- Notificação para o usuário seguido (notifications só aceita insert via service_role,
-- por isso o trigger é SECURITY DEFINER).
create or replace function public.notify_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
  values (new.following_id, new.follower_id, 'follow', new.follower_id, 'profile');
  return new;
end;
$$;

revoke all on function public.notify_new_follow() from public, anon, authenticated;

drop trigger if exists trg_notify_new_follow on public.follows;
create trigger trg_notify_new_follow
  after insert on public.follows
  for each row execute function public.notify_new_follow();

-- Perfil público por username (profiles só permite ler o próprio perfil via RLS).
create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  name text,
  username text,
  bio text,
  location text,
  website text,
  birthday date,
  avatar_url text,
  header_url text,
  followers_count bigint,
  following_count bigint,
  i_follow boolean,
  follows_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.username, p.bio, p.location, p.website, p.birthday,
    p.avatar_url, p.header_url,
    (select count(*) from public.follows f where f.following_id = p.id),
    (select count(*) from public.follows f where f.follower_id = p.id),
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id),
    exists (select 1 from public.follows f where f.follower_id = p.id and f.following_id = auth.uid())
  from public.profiles p
  where lower(p.username) = lower(p_username)
    and auth.uid() is not null;
$$;

revoke all on function public.get_public_profile(text) from public, anon;
grant execute on function public.get_public_profile(text) to authenticated;
