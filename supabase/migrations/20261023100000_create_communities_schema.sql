-- Communities: domain independent from team_pages / team_memberships.

create type public.community_status as enum ('pending', 'approved', 'rejected');

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  avatar_url text,
  header_url text,
  status public.community_status not null default 'pending',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index community_memberships_user_idx on public.community_memberships (user_id);
create index communities_status_idx on public.communities (status);

alter table public.posts
  add column community_id uuid references public.communities (id) on delete cascade;
create index posts_community_id_idx on public.posts (community_id);

-- Helpers (security definer avoid RLS recursion on community_memberships)
create or replace function public.is_community_manager(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_memberships
    where community_id = p_community_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_community_owner(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_memberships
    where community_id = p_community_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.touch_communities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger communities_touch_updated_at
before update on public.communities
for each row execute function public.touch_communities_updated_at();

-- Only site admins may change status; creator/owner may not self-approve.
create or replace function public.guard_community_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.created_by := auth.uid();
    return new;
  end if;

  if not public.is_current_user_admin() then
    if new.status is distinct from old.status then
      raise exception 'Only admins can change community status';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'created_by is immutable';
    end if;
  end if;
  return new;
end;
$$;

create trigger communities_guard_changes
before insert or update on public.communities
for each row execute function public.guard_community_changes();

-- Creator becomes owner automatically.
create or replace function public.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_memberships (community_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger communities_add_owner
after insert on public.communities
for each row execute function public.add_community_owner();

alter table public.communities enable row level security;
alter table public.community_memberships enable row level security;

-- communities
create policy communities_select on public.communities
for select using (
  status = 'approved'
  or created_by = auth.uid()
  or public.is_current_user_admin()
);

create policy communities_insert on public.communities
for insert to authenticated
with check (auth.uid() is not null);

create policy communities_update_admin on public.communities
for update to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy communities_update_manager on public.communities
for update to authenticated
using (status = 'approved' and public.is_community_manager(id))
with check (status = 'approved' and public.is_community_manager(id));

create policy communities_delete_admin on public.communities
for delete to authenticated
using (public.is_current_user_admin());

-- community_memberships
create policy community_memberships_select on public.community_memberships
for select using (
  user_id = auth.uid()
  or public.is_current_user_admin()
  or exists (
    select 1 from public.communities c
    where c.id = community_id and c.status = 'approved'
  )
);

-- Users join approved communities only as plain members.
create policy community_memberships_insert on public.community_memberships
for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1 from public.communities c
    where c.id = community_id and c.status = 'approved'
  )
);

-- Owners manage any row (including other owners / promotion to owner).
-- Admins manage only admin/moderator/member rows and cannot promote to owner.
create policy community_memberships_update on public.community_memberships
for update to authenticated
using (
  public.is_community_owner(community_id)
  or (public.is_community_manager(community_id) and role <> 'owner')
)
with check (
  public.is_community_owner(community_id)
  or (public.is_community_manager(community_id) and role <> 'owner')
);

create policy community_memberships_delete on public.community_memberships
for delete to authenticated
using (
  (user_id = auth.uid() and role <> 'owner')
  or public.is_community_owner(community_id)
  or (public.is_community_manager(community_id) and role <> 'owner')
  or public.is_current_user_admin()
);
