-- Ajustes finais das comunidades: exclusão de conta e post de time.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Admin, Ana e Bia.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-1111-0000-0000-000000000001', 'authenticated', 'authenticated', 'adm@ff.local', '{"name":"Adm","username":"adm_ff"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-1111-0000-0000-000000000002', 'authenticated', 'authenticated', 'ana@ff.local', '{"name":"Ana","username":"ana_ff"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-1111-0000-0000-000000000003', 'authenticated', 'authenticated', 'bia@ff.local', '{"name":"Bia","username":"bia_ff"}');
alter table public.profiles disable trigger profiles_privilege_guard;
update public.profiles set is_admin = true where id = 'cccccccc-1111-0000-0000-000000000001';
alter table public.profiles enable trigger profiles_privilege_guard;

-- Ana pede três comunidades: uma fica pendente, uma é recusada, uma é aprovada.
select pg_temp.login('cccccccc-1111-0000-0000-000000000002');
insert into public.communities (id, name, slug, theme) values
  ('dddddddd-1111-0000-0000-000000000001', 'Pendente', 'pendente-ff', 'games'),
  ('dddddddd-1111-0000-0000-000000000002', 'Recusada', 'recusada-ff', 'games'),
  ('dddddddd-1111-0000-0000-000000000003', 'Aprovada', 'aprovada-ff', 'games');

select pg_temp.login('cccccccc-1111-0000-0000-000000000001');
select public.review_community('dddddddd-1111-0000-0000-000000000002', false, 'fora do tema');
select public.review_community('dddddddd-1111-0000-0000-000000000003', true);

-- Bia entra na aprovada para receber a posse.
insert into public.community_memberships (community_id, user_id, role)
values ('dddddddd-1111-0000-0000-000000000003', 'cccccccc-1111-0000-0000-000000000003', 'member');

select is((select count(*)::int from public.community_memberships
  where community_id in ('dddddddd-1111-0000-0000-000000000001', 'dddddddd-1111-0000-0000-000000000002')),
  2, 'antes: os pedidos pendente e recusado têm o dono como membro');

-- 5. Post de comunidade com autoria de página de time é recusado.
insert into public.team_pages (id, name, slug, created_by)
values ('99999999-1111-0000-0000-000000000001', 'Time', 'time-ff', 'cccccccc-1111-0000-0000-000000000003');
insert into public.team_memberships (team_page_id, user_id, role, can_post)
values ('99999999-1111-0000-0000-000000000001', 'cccccccc-1111-0000-0000-000000000003', 'owner', true);

select pg_temp.login('cccccccc-1111-0000-0000-000000000003');
set local role authenticated;
select throws_ok(
  $$insert into public.posts (user_id, community_id, author_team_page_id, content)
    values ('cccccccc-1111-0000-0000-000000000003', 'dddddddd-1111-0000-0000-000000000003', '99999999-1111-0000-0000-000000000001', 'x')$$,
  '42501', null, 'post de comunidade com autoria de página de time é recusado');
select lives_ok(
  $$insert into public.posts (user_id, community_id, content)
    values ('cccccccc-1111-0000-0000-000000000003', 'dddddddd-1111-0000-0000-000000000003', 'ok')$$,
  'post de comunidade comum continua permitido');
select lives_ok(
  $$insert into public.posts (user_id, author_team_page_id, content)
    values ('cccccccc-1111-0000-0000-000000000003', '99999999-1111-0000-0000-000000000001', 'do time')$$,
  'post de página de time fora de comunidade continua permitido');
reset role;

-- 1. Excluir a conta da Ana apaga o pedido pendente e o recusado, e mantém a aprovada.
delete from auth.users where id = 'cccccccc-1111-0000-0000-000000000002';

select is((select count(*)::int from public.communities
  where id in ('dddddddd-1111-0000-0000-000000000001', 'dddddddd-1111-0000-0000-000000000002')),
  0, 'excluir a conta apaga os pedidos pendente e recusado');
select is((select count(*)::int from public.community_memberships
  where community_id in ('dddddddd-1111-0000-0000-000000000001', 'dddddddd-1111-0000-0000-000000000002')),
  0, 'e as filiações desses pedidos');
select is((select count(*)::int from public.communities where id = 'dddddddd-1111-0000-0000-000000000003'),
  1, 'a comunidade aprovada continua existindo');
select is((select created_by from public.communities where id = 'dddddddd-1111-0000-0000-000000000003'),
  null::uuid, 'e fica sem criador');
select is((select role from public.community_memberships
  where community_id = 'dddddddd-1111-0000-0000-000000000003' and user_id = 'cccccccc-1111-0000-0000-000000000003'),
  'owner', 'e a posse passa para a Bia');

select * from finish();
rollback;
