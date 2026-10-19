-- Só age se a tabela já existir. Em banco novo, o baseline cria a tabela depois;
-- a policy final é garantida na migration 20261019120000_security_reconcile_hardening.
do $$
begin
  if to_regclass('public.notifications') is not null then
    drop policy if exists "notifications_insert_system" on public.notifications;

    create policy "notifications_insert_system"
      on public.notifications
      for insert
      to service_role
      with check (true);
  end if;
end
$$;
