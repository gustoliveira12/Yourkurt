-- Revisão de pedidos de comunidade: aprovar, recusar, cancelar e avisar o criador.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Entra como um usuário, como o PostgREST faz com o JWT.
create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Roda um comando e devolve quantas linhas ele afetou (a RLS filtra sem erro).
create function pg_temp.rows_changed(p_sql text) returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Admin, Ana e Bia. O trigger de privilégios do perfil é desligado só para
-- tornar a admin, como faz o seed.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'adm@test.local', '{"name":"Adm","username":"adm_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'ana@test.local', '{"name":"Ana","username":"ana_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'bia@test.local', '{"name":"Bia","username":"bia_t"}');
alter table public.profiles disable trigger profiles_privilege_guard;
update public.profiles set is_admin = true where id = 'cccccccc-0000-0000-0000-000000000001';
alter table public.profiles enable trigger profiles_privilege_guard;

-- Ana pede três comunidades (o limite de pendentes): A (aprovada), B (recusada)
-- e C (cancelada). A quarta, D, só é pedida depois de A e B saírem da fila.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
-- Os inserts rodam sem troca de papel porque o id não é coluna liberada; o
-- trigger de guarda usa auth.uid(), então o criador continua sendo Ana.
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-00000000000a', 'Aprovada', 'aprovada', 'estudos');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-00000000000b', 'Recusada', 'recusada', 'games');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-00000000000c', 'Cancelada', 'cancelada', 'musica');

-- 1. Só admin revisa.
set local role authenticated;
select throws_ok(
  $$select public.review_community('dddddddd-0000-0000-0000-00000000000a', true)$$,
  '42501', 'not_admin', 'só admin revisa');
reset role;

-- 2. Aprovar muda o status, registra quem revisou e notifica o criador.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
select public.review_community('dddddddd-0000-0000-0000-00000000000a', true);
reset role;
select results_eq(
  $$select status::text, reviewed_by, reviewed_at is not null, rejection_reason
    from public.communities where id = 'dddddddd-0000-0000-0000-00000000000a'$$,
  $$values ('approved', 'cccccccc-0000-0000-0000-000000000001'::uuid, true, null::text)$$,
  'aprovar muda o status e registra quem revisou');
select is(
  (select count(*)::int from public.notifications
   where type = 'community_approved' and user_id = 'cccccccc-0000-0000-0000-000000000002'
     and actor_id = 'cccccccc-0000-0000-0000-000000000001'
     and entity_type = 'community' and entity_id = 'dddddddd-0000-0000-0000-00000000000a'
     and community_id = 'dddddddd-0000-0000-0000-00000000000a'),
  1, 'aprovar notifica o criador');

-- 3. Recusar exige motivo.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok(
  $$select public.review_community('dddddddd-0000-0000-0000-00000000000b', false, '  ')$$,
  'P0001', 'rejection_reason_required', 'recusar exige motivo');

-- 4. Recusar guarda o motivo aparado e notifica.
select public.review_community('dddddddd-0000-0000-0000-00000000000b', false, '  Fora do tema  ');
reset role;
select results_eq(
  $$select status::text, rejection_reason, reviewed_by
    from public.communities where id = 'dddddddd-0000-0000-0000-00000000000b'$$,
  $$values ('rejected', 'Fora do tema', 'cccccccc-0000-0000-0000-000000000001'::uuid)$$,
  'recusar guarda o motivo aparado');
select is(
  (select count(*)::int from public.notifications
   where type = 'community_rejected' and user_id = 'cccccccc-0000-0000-0000-000000000002'
     and community_id = 'dddddddd-0000-0000-0000-00000000000b'),
  1, 'recusar notifica o criador');

-- 5. Não revisa duas vezes.
set local role authenticated;
select throws_ok(
  $$select public.review_community('dddddddd-0000-0000-0000-00000000000a', true)$$,
  'P0001', 'community_not_pending', 'não revisa duas vezes');
reset role;

-- 6. O criador vê o próprio pedido recusado; outro usuário não.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
set local role authenticated;
select is((select count(*)::int from public.communities where id = 'dddddddd-0000-0000-0000-00000000000b'),
  1, 'criador vê o próprio pedido recusado');
reset role;
select pg_temp.login('cccccccc-0000-0000-0000-000000000003');
set local role authenticated;
select is((select count(*)::int from public.communities where id = 'dddddddd-0000-0000-0000-00000000000b'),
  0, 'outro usuário não vê o pedido recusado');
reset role;

-- 7. O criador cancela o pedido pendente e apaga o recusado.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
set local role authenticated;
select is(pg_temp.rows_changed($$delete from public.communities where id = 'dddddddd-0000-0000-0000-00000000000c'$$),
  1, 'criador cancela pedido pendente');

-- 8. Comunidade aprovada o criador não apaga.
select is(pg_temp.rows_changed($$delete from public.communities where id = 'dddddddd-0000-0000-0000-00000000000a'$$),
  0, 'criador não apaga comunidade aprovada');
reset role;

-- 9. Apagar a comunidade apaga as notificações dela (cascata da recusa).
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
set local role authenticated;
delete from public.communities where id = 'dddddddd-0000-0000-0000-00000000000b';
reset role;
select is((select count(*)::int from public.notifications
  where community_id = 'dddddddd-0000-0000-0000-00000000000b'),
  0, 'apagar a comunidade apaga as notificações dela');

-- 10. Motivo curto demais também é recusado.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-00000000000d', 'Curta', 'curta', 'games');
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok(
  $$select public.review_community('dddddddd-0000-0000-0000-00000000000d', false, 'abc')$$,
  'P0001', 'rejection_reason_required', 'motivo com menos de 5 caracteres é recusado');
reset role;

-- 11. Decisão nula não vira recusa sem motivo.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok(
  $$select public.review_community('dddddddd-0000-0000-0000-00000000000d', null, null)$$,
  'P0001', 'invalid_decision', 'decisão nula é recusada');
reset role;

select * from finish();
rollback;
