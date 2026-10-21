-- ============================================================
-- Yourkurt - Impede escalada de privilégio para owner de equipe
--
-- Problema (apontado na revisão do PR): um admin da equipe podia
-- se promover a 'owner' (por UPDATE direto ou pela RPC
-- set_team_member_permissions). Como o role 'owner' era imutável
-- e não removível, o criador da página não conseguiria mais
-- rebaixar nem remover esse membro.
--
-- Regras novas:
--   * Só o criador da página (team_pages.created_by) concede ou
--     revoga o role 'owner' de outros membros.
--   * O role do criador nunca pode ser alterado.
--   * Só o criador remove um owner, e nunca a si mesmo.
--   * Sem usuário autenticado (SQL Editor, service_role,
--     migrations), a manutenção direta continua permitida.
--
-- Idempotente.
-- ============================================================

create or replace function public.prevent_team_owner_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Manutenção direta, sem usuário autenticado.
  if auth.uid() is null then
    return new;
  end if;

  select page.created_by
    into v_creator
  from public.team_pages page
  where page.id = old.team_page_id;

  -- O criador da página nunca perde o role de owner.
  if old.user_id = v_creator then
    raise exception 'O role do criador da equipe não pode ser alterado';
  end if;

  -- Conceder ou revogar owner: somente o criador da página.
  if (old.role = 'owner' or new.role = 'owner')
     and auth.uid() is distinct from v_creator then
    raise exception 'Somente o criador da equipe pode conceder ou revogar o role de owner';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_team_owner_role_change()
  from public, anon, authenticated;

drop trigger if exists prevent_team_owner_role_change on public.team_memberships;
create trigger prevent_team_owner_role_change
  before update on public.team_memberships
  for each row
  execute function public.prevent_team_owner_role_change();


-- Remoção de memberships: gerentes removem quem não é owner;
-- owners só podem ser removidos pelo criador da página, que
-- não pode remover a si mesmo.
drop policy if exists team_memberships_delete_manager on public.team_memberships;
create policy team_memberships_delete_manager
  on public.team_memberships
  for delete
  to authenticated
  using (
    public.is_current_user_team_manager(team_page_id)
    and (
      role <> 'owner'
      or (
        user_id <> auth.uid()
        and exists (
          select 1
          from public.team_pages page
          where page.id = team_memberships.team_page_id
            and page.created_by = auth.uid()
        )
      )
    )
  );
