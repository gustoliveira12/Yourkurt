-- Serializa as exclusões de conta para que dois últimos owners não passem
-- juntos pela checagem e deixem uma comunidade/página sem owner.
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

  perform pg_advisory_xact_lock(hashtext('delete_my_account'));

  perform public.check_my_account_deletable();

  -- As demais tabelas removem os dados do usuário via ON DELETE CASCADE.
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
