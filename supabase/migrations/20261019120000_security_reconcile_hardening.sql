-- ============================================================
-- Yourkurt - Reconciliação e endurecimento de segurança
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- Objetivo: deixar o banco como as migrations de hardening
-- anteriores pretendiam, mas que não tiveram efeito:
--   * revoke ... from anon/authenticated NÃO remove o EXECUTE
--     herdado de PUBLIC; aqui revogamos de PUBLIC também.
--   * policy de team_pages comparava o id da membership com
--     ela mesma.
--   * prevent_profile_privilege_flag_updates na versão antiga.
--   * grants totais do anon em tabelas que o app não expõe.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Funções de trigger: ninguém precisa chamá-las via API.
--    (O EXECUTE é verificado só ao criar o trigger, não ao disparar.)
-- ------------------------------------------------------------
do $$
declare
  sig text;
begin
  foreach sig in array array[
    'public.handle_new_user()',
    'public.sync_post_likes_count()',
    'public.prevent_profile_privilege_flag_updates()',
    'public.prevent_team_page_identity_change()',
    'public.prevent_team_owner_role_change()',
    'public.prevent_team_membership_identity_change()',
    'public.prevent_team_pages_created_by_update()'
  ] loop
    if to_regprocedure(sig) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', sig);
    end if;
  end loop;
end
$$;


-- ------------------------------------------------------------
-- 2. Funções usadas pelo app e pelas policies: só authenticated.
-- ------------------------------------------------------------
do $$
declare
  sig text;
begin
  foreach sig in array array[
    'public.get_current_user_permissions()',
    'public.is_current_user_admin()',
    'public.is_current_user_super_admin()',
    'public.is_current_user_team_manager(uuid)',
    'public.list_manageable_users()',
    'public.set_team_member_permissions(uuid, uuid, boolean, text)',
    'public.set_user_admin_permissions(uuid, boolean, boolean)'
  ] loop
    if to_regprocedure(sig) is not null then
      execute format('revoke execute on function %s from public, anon', sig);
      execute format('grant execute on function %s to authenticated', sig);
    end if;
  end loop;
end
$$;


-- ------------------------------------------------------------
-- 3. Função sem search_path fixo (aviso do advisor do Supabase).
-- ------------------------------------------------------------
alter function public.prevent_team_membership_identity_change()
  set search_path = public;


-- ------------------------------------------------------------
-- 4. Função/trigger redundante criada por um arquivo antigo.
--    team_pages_created_by_immutable já protege created_by.
-- ------------------------------------------------------------
drop trigger if exists prevent_team_page_owner_change on public.team_pages;
drop function if exists public.prevent_team_page_owner_change();


-- ------------------------------------------------------------
-- 5. Policy de team_pages: gerente da equipe pode editar.
--    (A versão antiga comparava membership.team_page_id com
--    membership.id, então só o criador conseguia editar.)
-- ------------------------------------------------------------
drop policy if exists team_pages_update_owner_or_manager on public.team_pages;
create policy team_pages_update_owner_or_manager
  on public.team_pages
  for update
  to authenticated
  using (public.is_current_user_team_manager(id))
  with check (public.is_current_user_team_manager(id));


-- ------------------------------------------------------------
-- 6. Policy duplicada: a _or_manager já cobre a leitura própria.
-- ------------------------------------------------------------
drop policy if exists team_memberships_select_own on public.team_memberships;


-- ------------------------------------------------------------
-- 7. Super admin sempre precisa ser admin e só super admin
--    altera flags de privilégio.
-- ------------------------------------------------------------
create or replace function public.prevent_profile_privilege_flag_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin = true
     and new.is_admin = false then
    raise exception 'Super admin status requires admin status';
  end if;

  if (old.is_admin is distinct from new.is_admin)
     or (old.is_super_admin is distinct from new.is_super_admin) then
    if auth.uid() is null
       or not public.is_current_user_super_admin() then
      raise exception 'Only super admins can change privilege flags';
    end if;
  end if;

  return new;
end;
$$;


-- ------------------------------------------------------------
-- 8. profiles: INSERT sem as colunas de privilégio.
--    O perfil é criado pelo trigger handle_new_user (que roda
--    como owner); o cliente não deve poder inserir is_admin /
--    is_super_admin.
-- ------------------------------------------------------------
revoke insert on public.profiles from authenticated;
grant insert (
  id,
  email,
  name,
  username,
  bio,
  birthday,
  location,
  website,
  avatar_url,
  header_url,
  profile_visibility,
  theme_preference,
  receive_product_updates,
  created_at,
  updated_at
) on public.profiles to authenticated;


-- ------------------------------------------------------------
-- 9. anon: o middleware já manda deslogados para /login, então
--    estas tabelas não precisam de nenhum acesso anônimo.
--    (posts continua com SELECT para anon, como está hoje.)
--    Se um dia comentários/reações públicos forem desejados:
--    grant select on public.comments, public.reactions to anon;
-- ------------------------------------------------------------
revoke all on public.comments      from anon;
revoke all on public.friendships   from anon;
revoke all on public.messages      from anon;
revoke all on public.notifications from anon;
revoke all on public.reactions     from anon;


-- ------------------------------------------------------------
-- 10. Privilégios que a API nunca deve ter em nenhuma tabela
--     (TRUNCATE ignora RLS).
-- ------------------------------------------------------------
revoke truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;
