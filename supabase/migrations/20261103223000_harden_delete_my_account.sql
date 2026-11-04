-- Reforça a exclusão de conta: senha validada no banco, bloqueio do último owner
-- e checagem prévia para que o cliente limpe o Storage com segurança.

drop function if exists public.delete_my_account();

-- Valida os bloqueios sem apagar nada; o cliente chama antes de limpar o Storage.
create or replace function public.check_my_account_deletable()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if public.is_current_user_super_admin() then
    raise exception 'super_admin_cannot_delete';
  end if;

  if exists (select 1 from public.team_pages where created_by = v_user_id)
     or exists (select 1 from public.communities where created_by = v_user_id)
     or exists (
       select 1 from public.community_memberships m
       where m.user_id = v_user_id
         and m.role = 'owner'
         and not exists (
           select 1 from public.community_memberships o
           where o.community_id = m.community_id
             and o.role = 'owner'
             and o.user_id <> v_user_id
         )
     )
     or exists (
       select 1 from public.team_memberships m
       where m.user_id = v_user_id
         and m.role = 'owner'
         and not exists (
           select 1 from public.team_memberships o
           where o.team_page_id = m.team_page_id
             and o.role = 'owner'
             and o.user_id <> v_user_id
         )
     ) then
    raise exception 'owns_resources';
  end if;
end;
$$;

revoke all on function public.check_my_account_deletable() from public, anon;
grant execute on function public.check_my_account_deletable() to authenticated;

-- A senha é validada aqui dentro para que a exclusão não possa ser feita
-- chamando a RPC diretamente a partir de uma sessão já aberta.
create or replace function public.delete_my_account(p_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from auth.users
    where id = v_user_id
      and encrypted_password is not null
      and encrypted_password = crypt(coalesce(p_password, ''), encrypted_password)
  ) then
    raise exception 'invalid_password';
  end if;

  perform public.check_my_account_deletable();

  -- As demais tabelas removem os dados do usuário via ON DELETE CASCADE.
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
