create table if not exists public.team_pages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  avatar_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_memberships (
  id uuid default gen_random_uuid() primary key,
  team_page_id uuid not null references public.team_pages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  can_post boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_page_id, user_id),
  constraint team_memberships_role_check check (role in ('owner', 'admin', 'editor', 'member'))
);

create index if not exists idx_team_memberships_user_id on public.team_memberships (user_id);
create index if not exists idx_team_memberships_team_page_id on public.team_memberships (team_page_id);

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select profiles.is_admin
    from public.profiles
    where profiles.id = auth.uid()
  ), false);
$$;

create or replace function public.get_current_user_permissions()
returns table (is_admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_user_admin() as is_admin;
$$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.get_current_user_permissions() to authenticated;

alter table if exists public.posts
  add column if not exists author_team_page_id uuid references public.team_pages(id) on delete set null;

alter table public.team_pages enable row level security;
alter table public.team_memberships enable row level security;

drop policy if exists "team_pages_select_authenticated" on public.team_pages;
create policy "team_pages_select_authenticated"
  on public.team_pages
  for select
  to authenticated
  using (true);

drop policy if exists "team_pages_insert_owner" on public.team_pages;
create policy "team_pages_insert_owner"
  on public.team_pages
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and public.is_current_user_admin()
  );

drop policy if exists "team_memberships_select_own" on public.team_memberships;
create policy "team_memberships_select_own"
  on public.team_memberships
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "team_memberships_insert_owner" on public.team_memberships;
create policy "team_memberships_insert_owner"
  on public.team_memberships
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_current_user_admin()
    and role = 'owner'
    and can_post = true
    and exists (
      select 1
      from public.team_pages page
      where page.id = team_page_id
        and page.created_by = auth.uid()
    )
  );

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_current_user_admin()
    and (
      author_team_page_id is null
      or exists (
        select 1
        from public.team_memberships membership
        where membership.team_page_id = author_team_page_id
          and membership.user_id = auth.uid()
          and membership.can_post = true
      )
    )
  );

drop policy if exists "posts_select_all_public" on public.posts;
create policy "posts_select_all_public"
  on public.posts
  for select
  using (
    is_public = true
    or auth.uid() = user_id
  );
