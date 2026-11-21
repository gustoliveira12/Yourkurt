-- Preferências de notificação e restrição de edição das notificações.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Entra como um usuário, como o PostgREST faz com o JWT.
create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Usuários de teste: o trigger handle_new_user cria os perfis.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'ana@test.local', '{"name":"Ana","username":"ana_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'bia@test.local', '{"name":"Bia","username":"bia_t"}');

-- Uma notificação de Ana, para os testes de edição.
insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'follow',
        'aaaaaaaa-0000-0000-0000-000000000002', 'profile');

-- Ana, sem nenhuma escolha salva: tudo ligado.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
select results_eq(
  'select likes, comments, follows, follow_accepted from public.get_my_notification_preferences()',
  'values (true, true, true, true)',
  'sem escolha salva, todas as notificações ficam ligadas'
);

select public.set_my_notification_preferences(false, true, true, false);
select results_eq(
  'select likes, comments, follows, follow_accepted from public.get_my_notification_preferences()',
  'values (false, true, true, false)',
  'a escolha salva é devolvida'
);
select ok(
  public.export_my_data() ? 'notification_preferences',
  'a exportação de dados inclui as preferências de notificação'
);

-- Bia não vê a escolha de Ana nem lê a tabela.
reset role;
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
select results_eq(
  'select likes, comments, follows, follow_accepted from public.get_my_notification_preferences()',
  'values (true, true, true, true)',
  'cada pessoa vê só as próprias preferências'
);
select throws_ok(
  'select * from public.notification_preferences',
  '42501',
  null,
  'a tabela de preferências não é lida direto pela API'
);

-- A regra usada pelos triggers: pedido para seguir não pode ser desligado.
reset role;
select is(public.wants_notification('aaaaaaaa-0000-0000-0000-000000000001', 'like'), false,
  'curtida desligada por Ana não é desejada');
select is(public.wants_notification('aaaaaaaa-0000-0000-0000-000000000001', 'follow_request'), true,
  'pedido para seguir é sempre desejado');

-- Ana só consegue marcar a própria notificação como lida.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
select lives_ok(
  $$update public.notifications set read_at = now() where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'marcar como lida continua permitido'
);
select throws_ok(
  $$update public.notifications set type = 'like' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'mudar o tipo da notificação é proibido'
);
reset role;

select * from finish();
rollback;
