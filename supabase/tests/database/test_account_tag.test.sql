-- Tag "Dev" das contas de teste: só o super admin marca, qualquer logado lê.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Super admin, admin comum e usuária comum. O trigger de privilégios é
-- desligado só para criar os papéis, como faz o seed.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'sup@test.local', '{"name":"Sup","username":"sup_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'adm2@test.local', '{"name":"Adm","username":"adm2_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'ana2@test.local', '{"name":"Ana","username":"ana2_t"}');
alter table public.profiles disable trigger profiles_privilege_guard;
update public.profiles set is_admin = true, is_super_admin = true where id = 'eeeeeeee-0000-0000-0000-000000000001';
update public.profiles set is_admin = true where id = 'eeeeeeee-0000-0000-0000-000000000002';
alter table public.profiles enable trigger profiles_privilege_guard;

-- 1. Usuário comum não marca a própria conta (a coluna fica fora do grant de update).
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$update public.profiles set is_test_account = true where id = 'eeeeeeee-0000-0000-0000-000000000003'$$,
  '42501', null, 'usuário não marca a própria conta');

-- 2. Qualquer logado lê a coluna.
select lives_ok(
  $$select is_test_account from public.profiles$$, 'qualquer logado lê a coluna');

-- 3. Usuária comum e admin comum não usam a função.
select throws_ok(
  $$select public.set_user_test_account('eeeeeeee-0000-0000-0000-000000000003', true)$$,
  '42501', 'not_super_admin', 'usuário comum não marca pela função');
reset role;
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok(
  $$select public.set_user_test_account('eeeeeeee-0000-0000-0000-000000000003', true)$$,
  '42501', 'not_super_admin', 'admin comum não marca');
reset role;

-- 4. Super admin marca e desmarca.
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000001');
set local role authenticated;
select public.set_user_test_account('eeeeeeee-0000-0000-0000-000000000003', true);
select is((select is_test_account from public.profiles where id = 'eeeeeeee-0000-0000-0000-000000000003'),
  true, 'super admin marca');
select is((select count(*)::int from public.admin_audit_logs
  where action = 'set_test_account' and target_user_id = 'eeeeeeee-0000-0000-0000-000000000003'),
  1, 'a marcação é registrada');
select is((select details->>'is_test_account' from public.admin_audit_logs
  where action = 'set_test_account' and target_user_id = 'eeeeeeee-0000-0000-0000-000000000003'),
  'true', 'o registro guarda o valor');
select is((select is_test_account from public.list_manageable_users()
  where id = 'eeeeeeee-0000-0000-0000-000000000003'),
  true, 'list_manageable_users devolve a coluna');
select public.set_user_test_account('eeeeeeee-0000-0000-0000-000000000003', false);
select is((select is_test_account from public.profiles where id = 'eeeeeeee-0000-0000-0000-000000000003'),
  false, 'super admin desmarca');

-- 5. Perfil inexistente.
select throws_ok(
  $$select public.set_user_test_account('eeeeeeee-0000-0000-0000-0000000000ff', true)$$,
  'P0002', 'user_not_found', 'perfil inexistente');
reset role;

select * from finish();
rollback;
