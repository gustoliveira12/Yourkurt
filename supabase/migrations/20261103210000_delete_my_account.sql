-- Permite que o usuário exclua a própria conta.

-- O log de auditoria deve sobreviver à exclusão de usuários: as referências
-- passam a ser anonimizadas (SET NULL) em vez de bloquear a exclusão.
alter table public.admin_audit_logs
  alter column actor_id drop not null,
  alter column target_user_id drop not null;

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_actor_id_fkey,
  drop constraint if exists admin_audit_logs_target_user_id_fkey;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles(id) on delete set null,
  add constraint admin_audit_logs_target_user_id_fkey
    foreign key (target_user_id) references public.profiles(id) on delete set null;

create or replace function public.delete_my_account()
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
     or exists (select 1 from public.communities where created_by = v_user_id) then
    raise exception 'owns_resources';
  end if;

  -- As demais tabelas removem os dados do usuário via ON DELETE CASCADE.
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
