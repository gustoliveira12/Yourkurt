-- Base das comunidades: pedidos, papéis, nome travado, contagem e posse.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

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

-- Admin, Ana, Bia e Caio. O trigger de privilégios do perfil é desligado só
-- para tornar a admin, como faz o seed.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'adm@test.local', '{"name":"Adm","username":"adm_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'ana@test.local', '{"name":"Ana","username":"ana_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'bia@test.local', '{"name":"Bia","username":"bia_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'caio@test.local', '{"name":"Caio","username":"caio_t"}');
alter table public.profiles disable trigger profiles_privilege_guard;
update public.profiles set is_admin = true where id = 'cccccccc-0000-0000-0000-000000000001';
alter table public.profiles enable trigger profiles_privilege_guard;

-- 1. O pedido sempre nasce pendente e com o criador como dono. O insert com
--    status vem de um papel sem restrição de coluna, só para provar o trigger.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
insert into public.communities (id, name, slug, theme, status)
values ('dddddddd-0000-0000-0000-000000000001', 'Ana Um', 'ana-um', 'estudos', 'approved');
select is((select status::text from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  'pending', 'criar comunidade sempre nasce pendente');
select is((select created_by from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  'cccccccc-0000-0000-0000-000000000002'::uuid, 'o criador fica em created_by');
select is((select role from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000002'),
  'owner', 'o criador entra como dono');

-- 2. Limite de 3 pedidos pendentes por pessoa.
set local role authenticated;
insert into public.communities (name, slug, theme) values ('Ana Dois', 'ana-dois', 'estudos');
insert into public.communities (name, slug, theme) values ('Ana Tres', 'ana-tres', 'games');
select throws_ok(
  $$insert into public.communities (name, slug, theme) values ('Ana Quatro', 'ana-quatro', 'games')$$,
  'P0001', 'too_many_pending_requests', 'quarto pedido pendente é recusado');
reset role;

-- 3 e 4. Slug reservado e descrição longa.
select pg_temp.login('cccccccc-0000-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$insert into public.communities (name, slug, theme) values ('Oficial', 'yourkurt', 'estudos')$$,
  'P0001', 'reserved_slug', 'slug yourkurt é reservado');
select throws_ok(
  $$insert into public.communities (name, slug, theme, description)
    values ('Longa', 'longa', 'estudos', repeat('x', 501))$$,
  '23514', null, 'descrição acima de 500 caracteres é recusada');
reset role;

-- 5. O papel admin deixou de existir.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
select throws_ok(
  $$update public.community_memberships set role = 'admin'
    where community_id = 'dddddddd-0000-0000-0000-000000000001'$$,
  '23514', null, 'papel admin não existe mais');
reset role;

-- 6. Aprovada, o nome e o slug ficam travados para o dono. A aprovação roda
--    sem restrição de coluna: ela fica para uma função própria depois.
update public.communities set status = 'approved' where id = 'dddddddd-0000-0000-0000-000000000001';
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok(
  $$update public.communities set name = 'Outro nome' where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  'P0001', 'community_name_locked', 'dono não muda nome depois de aprovada');
select lives_ok(
  $$update public.communities set description = 'Nova descrição' where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  'dono muda a descrição');

-- 7. Status e contagem não são colunas liberadas.
select throws_ok(
  $$update public.communities set status = 'approved' where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  '42501', null, 'dono não muda status');
select throws_ok(
  $$update public.communities set members_count = 99 where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  '42501', null, 'dono não muda members_count');
reset role;

-- 8. A contagem acompanha entradas e saídas.
select pg_temp.login('cccccccc-0000-0000-0000-000000000003');
set local role authenticated;
insert into public.community_memberships (community_id, user_id)
values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003');
reset role;
select pg_temp.login('cccccccc-0000-0000-0000-000000000004');
set local role authenticated;
insert into public.community_memberships (community_id, user_id)
values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000004');
reset role;
select is((select members_count from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  3, 'members_count conta o dono e os dois que entraram');

-- 9. Membro comum não altera papéis (sem policy de update para ele).
select pg_temp.login('cccccccc-0000-0000-0000-000000000003');
set local role authenticated;
select is(pg_temp.rows_changed($$update public.community_memberships set role = 'moderator'
  where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000003'$$),
  0, 'membro comum não atualiza nenhuma linha');
reset role;
select is((select role from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000003'),
  'member', 'o papel do membro continua member');

-- Bia sai e a contagem desce.
set local role authenticated;
delete from public.community_memberships
where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000003';
reset role;
select is((select members_count from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  2, 'members_count desce quando alguém sai');

-- 10. O dono não sai da própria comunidade.
select pg_temp.login('cccccccc-0000-0000-0000-000000000002');
set local role authenticated;
select is(pg_temp.rows_changed($$delete from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000002'$$),
  0, 'dono não sai da própria comunidade');
reset role;

-- 11. Ana exclui a conta: o moderador mais antigo assume.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
set local role authenticated;
update public.community_memberships set role = 'moderator'
where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000004';
reset role;
-- A exclusão de conta não tem usuário logado.
select set_config('request.jwt.claims', '', true);
delete from auth.users where id = 'cccccccc-0000-0000-0000-000000000002';
select is((select role from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000001' and user_id = 'cccccccc-0000-0000-0000-000000000004'),
  'owner', 'o moderador vira dono quando o dono exclui a conta');
select is((select created_by from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  null, 'created_by fica nulo');
select ok(exists (select 1 from public.communities where id = 'dddddddd-0000-0000-0000-000000000001'),
  'a comunidade continua existindo');

-- 12. Sem moderador, a posse vai para o membro mais antigo.
-- O id fixo exige o papel sem restrição de coluna, como no primeiro caso.
select pg_temp.login('cccccccc-0000-0000-0000-000000000003');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-000000000002', 'Bia Um', 'bia-um', 'tecnologia');
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
update public.communities set status = 'approved' where id = 'dddddddd-0000-0000-0000-000000000002';
select pg_temp.login('cccccccc-0000-0000-0000-000000000004');
set local role authenticated;
insert into public.community_memberships (community_id, user_id)
values ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004');
reset role;
select set_config('request.jwt.claims', '', true);
delete from auth.users where id = 'cccccccc-0000-0000-0000-000000000003';
select is((select role from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000002' and user_id = 'cccccccc-0000-0000-0000-000000000004'),
  'owner', 'sem moderador, o membro mais antigo vira dono');

-- 13. Sem ninguém, a comunidade fica sem dono.
delete from auth.users where id = 'cccccccc-0000-0000-0000-000000000004';
select ok(exists (select 1 from public.communities where id = 'dddddddd-0000-0000-0000-000000000002'),
  'sem ninguém, a comunidade continua existindo');
select is((select count(*)::int from public.community_memberships
  where community_id = 'dddddddd-0000-0000-0000-000000000002'),
  0, 'e fica sem dono nem membros');

-- 14. Dan cria um pedido e tenta pegar o slug reservado por update.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'dan@test.local', '{"name":"Dan","username":"dan_t"}');
select pg_temp.login('cccccccc-0000-0000-0000-000000000005');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-000000000003', 'Dan Um', 'dan-um', 'games');
set local role authenticated;
select throws_ok(
  $$update public.communities set slug = 'yourkurt' where id = 'dddddddd-0000-0000-0000-000000000003'$$,
  'P0001', 'reserved_slug', 'dono não pega o slug reservado por update');

-- 15. Dono único de comunidade pode excluir a conta (a posse se transfere).
select lives_ok($$select public.check_my_account_deletable()$$,
  'dono único de comunidade não é bloqueado na exclusão da conta');
reset role;

-- 16. Revisor que exclui a própria conta: reviewed_by vira nulo sem erro.
select pg_temp.login('cccccccc-0000-0000-0000-000000000001');
update public.communities
set reviewed_by = 'cccccccc-0000-0000-0000-000000000001', reviewed_at = now()
where id = 'dddddddd-0000-0000-0000-000000000003';
select lives_ok($$delete from auth.users where id = 'cccccccc-0000-0000-0000-000000000001'$$,
  'revisor exclui a conta logado como ele mesmo');
select is((select reviewed_by from public.communities where id = 'dddddddd-0000-0000-0000-000000000003'),
  null, 'reviewed_by fica nulo');

select * from finish();
rollback;
