create or replace function public.is_current_user_team_manager(p_team_page_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_pages page
    where page.id = p_team_page_id
      and page.created_by = auth.uid()
  )
  or exists (
    select 1
    from public.team_memberships membership
    where membership.team_page_id = p_team_page_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_current_user_team_manager(uuid) to authenticated;

drop policy if exists "team_pages_update_owner_or_manager" on public.team_pages;
create policy "team_pages_update_owner_or_manager"
  on public.team_pages
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.team_memberships membership
      where membership.team_page_id = id
        and membership.user_id = auth.uid()
        and membership.role in ('owner', 'admin')
    )
  )
  with check (
    created_by = old.created_by
    and (
      created_by = auth.uid()
      or exists (
        select 1
        from public.team_memberships membership
        where membership.team_page_id = id
          and membership.user_id = auth.uid()
          and membership.role in ('owner', 'admin')
      )
    )
  );

drop policy if exists "team_memberships_select_own_or_manager" on public.team_memberships;
create policy "team_memberships_select_own_or_manager"
  on public.team_memberships
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_current_user_team_manager(team_page_id)
  );

drop policy if exists "team_memberships_update_manager" on public.team_memberships;
create policy "team_memberships_update_manager"
  on public.team_memberships
  for update
  to authenticated
  using (public.is_current_user_team_manager(team_page_id))
  with check (
    public.is_current_user_team_manager(team_page_id)
    and team_page_id = old.team_page_id
    and user_id = old.user_id
    and (
      role = old.role
      or role in ('owner', 'admin', 'editor', 'member')
    )
    and can_post is not null
  );

drop policy if exists "team_memberships_delete_manager" on public.team_memberships;
create policy "team_memberships_delete_manager"
  on public.team_memberships
  for delete
  to authenticated
  using (public.is_current_user_team_manager(team_page_id));

create or replace function public.set_team_member_permissions(
  p_team_page_id uuid,
  p_user_id uuid,
  p_can_post boolean,
  p_role text default null
)
returns public.team_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_role text;
  updated_row public.team_memberships;
begin
  if not public.is_current_user_team_manager(p_team_page_id) then
    raise exception 'Você não pode gerenciar permissões desta equipe.';
  end if;

  if p_role is not null and p_role not in ('owner', 'admin', 'editor', 'member') then
    raise exception 'Role inválida para a equipe.';
  end if;

  normalized_role := coalesce(p_role, (
    select membership.role
    from public.team_memberships membership
    where membership.team_page_id = p_team_page_id
      and membership.user_id = p_user_id
  ));

  if normalized_role is null then
    raise exception 'Membro não encontrado nesta equipe.';
  end if;

  update public.team_memberships
  set
    role = normalized_role,
    can_post = p_can_post
  where team_page_id = p_team_page_id
    and user_id = p_user_id
  returning * into updated_row;

  if updated_row is null then
    raise exception 'Membro não encontrado nesta equipe.';
  end if;

  return updated_row;
end;
$$;

grant execute on function public.set_team_member_permissions(uuid, uuid, boolean, text) to authenticated;
