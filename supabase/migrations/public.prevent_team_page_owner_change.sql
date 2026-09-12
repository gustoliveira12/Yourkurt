-- ============================================================
-- Yourkurt
-- Correção de RLS e integridade das Team Pages / Memberships
-- ============================================================


-- ============================================================
-- 1. TEAM PAGES
-- Impede alteração direta do proprietário da página.
-- Transferência de propriedade, se necessária no futuro,
-- deverá ser feita por uma função controlada.
-- ============================================================

create or replace function public.prevent_team_page_owner_change()
returns trigger
language plpgsql
as $$
begin
  if old.created_by is distinct from new.created_by then
    raise exception 'The team page owner cannot be changed directly';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_team_page_owner_change
on public.team_pages;

create trigger prevent_team_page_owner_change
before update on public.team_pages
for each row
execute function public.prevent_team_page_owner_change();


-- ============================================================
-- 2. TEAM MEMBERSHIPS
-- Impede trocar o usuário ou a Team Page de uma membership.
-- Role e can_post continuam podendo ser alterados pelo
-- mecanismo de gerenciamento autorizado.
-- ============================================================

create or replace function public.prevent_team_membership_identity_change()
returns trigger
language plpgsql
as $$
begin
  if old.team_page_id is distinct from new.team_page_id then
    raise exception 'The team membership team_page_id cannot be changed';
  end if;

  if old.user_id is distinct from new.user_id then
    raise exception 'The team membership user_id cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_team_membership_identity_change
on public.team_memberships;

create trigger prevent_team_membership_identity_change
before update on public.team_memberships
for each row
execute function public.prevent_team_membership_identity_change();


-- ============================================================
-- 3. TEAM PAGES UPDATE
-- Remove a policy antiga e substitui por uma regra baseada
-- na função centralizada de gerente.
-- ============================================================

drop policy if exists team_pages_update_owner_or_manager
on public.team_pages;

create policy team_pages_update_owner_or_manager
on public.team_pages
for update
to authenticated
using (
  public.is_current_user_team_manager(id)
)
with check (
  public.is_current_user_team_manager(id)
);


-- ============================================================
-- 4. TEAM MEMBERSHIPS UPDATE
-- A identidade da membership é protegida pelo trigger acima.
-- A RLS decide quem pode modificar a membership.
-- ============================================================

drop policy if exists team_memberships_update_manager
on public.team_memberships;

create policy team_memberships_update_manager
on public.team_memberships
for update
to authenticated
using (
  public.is_current_user_team_manager(team_page_id)
)
with check (
  public.is_current_user_team_manager(team_page_id)
);


-- ============================================================
-- 5. PROFILES
-- Somente authenticated deve utilizar a policy de alteração
-- de perfil.
-- ============================================================

drop policy if exists profiles_update_own
on public.profiles;

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);


-- ============================================================
-- 6. POSTS
-- Somente authenticated deve utilizar UPDATE/DELETE próprios.
-- ============================================================

drop policy if exists posts_update_own
on public.posts;

create policy posts_update_own
on public.posts
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


drop policy if exists posts_delete_own
on public.posts;

create policy posts_delete_own
on public.posts
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 7. PROTEÇÃO DOS PRIVILÉGIOS
-- Super admin sempre precisa continuar sendo admin.
-- Isso protege também alterações feitas fora da RPC.
-- ============================================================

create or replace function public.prevent_profile_privilege_flag_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Super admin sem admin não é um estado permitido.
  if new.is_super_admin = true
     and new.is_admin = false then
    raise exception 'Super admin status requires admin status';
  end if;


  -- Alterações nos privilégios só podem ser feitas por
  -- um super admin.
  if (old.is_admin is distinct from new.is_admin)
     or
     (old.is_super_admin is distinct from new.is_super_admin) then

    if auth.uid() is null
       or not public.is_current_user_super_admin() then
      raise exception 'Only super admins can change privilege flags';
    end if;

  end if;

  return new;
end;
$$;


-- ============================================================
-- 8. FUNÇÕES ADMINISTRATIVAS
-- Usuários anônimos não precisam executar essas funções.
-- ============================================================

revoke execute
on function public.list_manageable_users()
from anon;

revoke execute
on function public.set_user_admin_permissions(
  uuid,
  boolean,
  boolean
)
from anon;

revoke execute
on function public.set_team_member_permissions(
  uuid,
  uuid,
  boolean,
  text
)
from anon;