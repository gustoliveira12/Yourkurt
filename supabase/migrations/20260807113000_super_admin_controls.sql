alter table if exists public.profiles
  add column if not exists is_super_admin boolean not null default false;

create table if not exists public.admin_audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_actor_id on public.admin_audit_logs (actor_id);
create index if not exists idx_admin_audit_logs_target_user_id on public.admin_audit_logs (target_user_id);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs (created_at desc);

create or replace function public.is_current_user_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select profiles.is_super_admin
    from public.profiles
    where profiles.id = auth.uid()
  ), false);
$$;

drop function if exists public.get_current_user_permissions();

create or replace function public.get_current_user_permissions()
returns table (is_admin boolean, is_super_admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_current_user_admin() as is_admin,
    public.is_current_user_super_admin() as is_super_admin;
$$;

grant execute on function public.is_current_user_super_admin() to authenticated;
grant execute on function public.get_current_user_permissions() to authenticated;

alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_audit_logs from anon;
revoke all on public.admin_audit_logs from authenticated;

drop policy if exists "admin_audit_logs_select_super_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_select_super_admin"
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_current_user_super_admin());

create or replace function public.list_manageable_users()
returns table (
  id uuid,
  email text,
  name text,
  username text,
  is_admin boolean,
  is_super_admin boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.name,
    p.username,
    p.is_admin,
    p.is_super_admin,
    p.created_at
  from public.profiles p
  where public.is_current_user_super_admin()
  order by p.created_at desc;
$$;

grant execute on function public.list_manageable_users() to authenticated;

create or replace function public.set_user_admin_permissions(
  p_target_user_id uuid,
  p_is_admin boolean,
  p_is_super_admin boolean default false
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  previous_state jsonb;
  updated_row public.profiles;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super admins can change admin permissions';
  end if;

  if actor_id = p_target_user_id and p_is_super_admin = false then
    raise exception 'Super admin cannot remove own super admin permission';
  end if;

  select jsonb_build_object(
    'is_admin', p.is_admin,
    'is_super_admin', p.is_super_admin
  )
  into previous_state
  from public.profiles p
  where p.id = p_target_user_id;

  if previous_state is null then
    raise exception 'Target user not found';
  end if;

  update public.profiles
  set
    is_admin = p_is_admin,
    is_super_admin = p_is_super_admin,
    updated_at = now()
  where id = p_target_user_id
  returning * into updated_row;

  insert into public.admin_audit_logs (actor_id, target_user_id, action, details)
  values (
    actor_id,
    p_target_user_id,
    'update_permissions',
    jsonb_build_object(
      'before', previous_state,
      'after', jsonb_build_object(
        'is_admin', p_is_admin,
        'is_super_admin', p_is_super_admin
      )
    )
  );

  return updated_row;
end;
$$;

grant execute on function public.set_user_admin_permissions(uuid, boolean, boolean) to authenticated;
