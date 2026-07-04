drop policy if exists "notifications_insert_system" on public.notifications;

create policy "notifications_insert_system"
on public.notifications
for insert
to service_role
with check (true);
