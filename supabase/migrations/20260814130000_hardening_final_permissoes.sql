-- ============================================================
-- YOURKURT - HARDENING FINAL DE PERMISSÕES
-- ============================================================

-- 1. Impedir alteração dos campos estruturais de team_pages.
--    id, created_by e created_at devem ser imutáveis.
create or replace function public.prevent_team_page_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.id is distinct from new.id
     or old.created_by is distinct from new.created_by
     or old.created_at is distinct from new.created_at then
    raise exception 'Os campos de identidade da equipe não podem ser alterados';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_team_page_identity_change
on public.team_pages;

create trigger prevent_team_page_identity_change
before update on public.team_pages
for each row
execute function public.prevent_team_page_identity_change();


-- 2. Impedir que o owner tenha seu role alterado.
--    Uma futura transferência de ownership deverá ser uma
--    operação específica e controlada.
create or replace function public.prevent_team_owner_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner'
     and new.role is distinct from old.role then
    raise exception 'O owner da equipe não pode ter o role alterado por esta operação';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_team_owner_role_change
on public.team_memberships;

create trigger prevent_team_owner_role_change
before update on public.team_memberships
for each row
execute function public.prevent_team_owner_role_change();


-- 3. Impedir que o owner seja removido pela policy normal.
--    A remoção do owner deverá ser tratada por uma operação
--    específica de transferência/exclusão da equipe.
drop policy if exists team_memberships_delete_manager
on public.team_memberships;

create policy team_memberships_delete_manager
on public.team_memberships
for delete
to authenticated
using (
  is_current_user_team_manager(team_page_id)
  and role <> 'owner'
);


-- 4. Remover SELECT desnecessário de usuários anônimos.
--    As policies atuais já restringem essas tabelas a authenticated.
revoke select on public.profiles from anon;
revoke select on public.team_pages from anon;
revoke select on public.team_memberships from anon;


-- 5. Remover DELETE desnecessário de profiles.
--    Não existe atualmente uma policy de DELETE para profiles.
revoke delete on public.profiles from authenticated;


-- 6. Funções internas de trigger não devem ser chamadas pelo cliente.
revoke execute on function public.handle_new_user()
from anon, authenticated;

revoke execute on function public.sync_post_likes_count()
from anon, authenticated;

revoke execute on function public.prevent_profile_privilege_flag_updates()
from anon, authenticated;

revoke execute on function public.prevent_team_page_identity_change()
from anon, authenticated;

revoke execute on function public.prevent_team_owner_role_change()
from anon, authenticated;


-- 7. Funções de consulta/autorização não precisam ser acessíveis
--    ao role anon.
revoke execute on function public.get_current_user_permissions()
from anon;

revoke execute on function public.is_current_user_admin()
from anon;

revoke execute on function public.is_current_user_super_admin()
from anon;

revoke execute on function public.is_current_user_team_manager(uuid)
from anon;

revoke execute on function public.list_manageable_users()
from anon;

revoke execute on function public.set_team_member_permissions(uuid, uuid, boolean, text)
from anon;

revoke execute on function public.set_user_admin_permissions(uuid, boolean, boolean)
from anon;