-- Tag "Dev" nas contas de teste. Só o super admin marca e desmarca (também em
-- produção); ninguém marca a si mesmo pelo cliente.

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

-- Leitura liberada para quem está logado, como as demais colunas públicas do
-- perfil. A coluna NÃO entra em nenhum grant de update: o trigger
-- profiles_privilege_guard só vigia is_admin/is_super_admin, então quem impede
-- a automarcação é a ausência do grant (erro 42501).
grant select (is_test_account) on public.profiles to authenticated;

-- A escrita passa por esta função (security definer, roda como dono da tabela,
-- por isso o grant de coluna não a afeta e o guard não precisa mudar).
create or replace function public.set_user_test_account(
  p_user_id uuid,
  p_is_test boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_current_user_super_admin() then
    raise exception 'not_super_admin' using errcode = '42501';
  end if;

  if p_is_test is null then
    raise exception 'invalid_value' using errcode = '22023';
  end if;

  update public.profiles
  set is_test_account = p_is_test
  where id = p_user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  insert into public.admin_audit_logs (actor_id, target_user_id, action, details)
  values (auth.uid(), p_user_id, 'set_test_account',
          jsonb_build_object('is_test_account', p_is_test));
end;
$$;

revoke execute on function public.set_user_test_account(uuid, boolean) from public, anon;
grant execute on function public.set_user_test_account(uuid, boolean) to authenticated;

-- O tipo de retorno muda, então a função é recriada. O resto fica idêntico à
-- definição de 20260807113000 (e os revoke/grant de 20261019120000).
drop function if exists public.list_manageable_users();

create function public.list_manageable_users()
returns table (
  id uuid,
  email text,
  name text,
  username text,
  is_admin boolean,
  is_super_admin boolean,
  created_at timestamptz,
  is_test_account boolean
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
    p.created_at,
    p.is_test_account
  from public.profiles p
  where public.is_current_user_super_admin()
  order by p.created_at desc;
$$;

revoke execute on function public.list_manageable_users() from public, anon;
grant execute on function public.list_manageable_users() to authenticated;
