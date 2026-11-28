-- Posts de comunidade públicos, exclusão pelo admin e etiquetas de membro.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.rows_changed(p_sql text) returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Admin (a1), dono/Caio privado (c4), Bia (b3), moderador (d5), membro (e6),
-- admin que é dono (f7).
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'adm2@test.local', '{"name":"Adm","username":"adm_p"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'bia2@test.local', '{"name":"Bia","username":"bia_p"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'caio2@test.local', '{"name":"Caio","username":"caio_p","profile_visibility":"private"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'mod2@test.local', '{"name":"Mod","username":"mod_p"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'mem2@test.local', '{"name":"Mem","username":"mem_p"}'),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'adm3@test.local', '{"name":"Adm3","username":"adm3_p"}');
alter table public.profiles disable trigger profiles_privilege_guard;
update public.profiles set is_admin = true
  where id in ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000007');
alter table public.profiles enable trigger profiles_privilege_guard;

-- Comunidade aprovada (dono Caio) e outra pendente (dona Caio). Admin-dono
-- f7 é dono de uma terceira comunidade aprovada.
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000004');
insert into public.communities (id, name, slug, theme) values
  ('ffffffff-0000-0000-0000-000000000001', 'Aprovada', 'aprovada-p', 'estudos'),
  ('ffffffff-0000-0000-0000-000000000002', 'Pendente', 'pendente-p', 'games');
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000007');
insert into public.communities (id, name, slug, theme) values
  ('ffffffff-0000-0000-0000-000000000003', 'Do admin', 'do-admin-p', 'games');
update public.communities set status = 'approved'
  where id in ('ffffffff-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000003');
insert into public.community_memberships (community_id, user_id, role) values
  ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000005', 'moderator'),
  ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000006', 'member'),
  ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'member')
on conflict do nothing;

-- Caio posta na comunidade e no perfil.
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000004');
set local role authenticated;
insert into public.posts (user_id, community_id, content)
values ('eeeeeeee-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000001', 'na comunidade');
insert into public.posts (user_id, content)
values ('eeeeeeee-0000-0000-0000-000000000004', 'no perfil');

select throws_ok(
  $$insert into public.posts (user_id, community_id, content, is_public)
    values ('eeeeeeee-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000001', 'x', false)$$,
  '23514', null, 'post de comunidade não pode ser privado (insert)');
select throws_ok(
  $$update public.posts set is_public = false where content = 'na comunidade'$$,
  '23514', null, 'post de comunidade não pode ser privado (update)');
select throws_ok(
  $$insert into public.posts (user_id, community_id, content)
    values ('eeeeeeee-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000002', 'x')$$,
  '42501', null, 'ninguém posta em comunidade pendente, nem o dono');
reset role;

-- Bia, que não segue Caio.
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000003');
set local role authenticated;
select is((select count(*)::int from public.posts where content = 'na comunidade'), 1,
  'post de comunidade de perfil privado aparece para quem não segue');
select is((select count(*)::int from public.posts where content = 'no perfil'), 0,
  'post de perfil privado continua escondido');
select lives_ok(
  $$insert into public.reactions (user_id, post_id, type)
    values ('eeeeeeee-0000-0000-0000-000000000003', (select id from public.posts where content = 'na comunidade'), 'like');
    insert into public.comments (user_id, post_id, content)
    values ('eeeeeeee-0000-0000-0000-000000000003', (select id from public.posts where content = 'na comunidade'), 'oi')$$,
  'quem não segue curte e comenta post de comunidade');
select throws_ok(
  $$insert into public.posts (user_id, community_id, content)
    values ('eeeeeeee-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000001', 'x')$$,
  '42501', null, 'não membro não posta na comunidade');
select is(pg_temp.rows_changed($$delete from public.posts where content = 'na comunidade'$$), 0,
  'membro não apaga post alheio na comunidade');
reset role;

-- Post em comunidade pendente inserido sem RLS não aparece para outros.
insert into public.posts (user_id, community_id, content)
values ('eeeeeeee-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000002', 'pendente');
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000003');
set local role authenticated;
select is((select count(*)::int from public.posts where community_id = 'ffffffff-0000-0000-0000-000000000002'), 0,
  'post de comunidade pendente não aparece para outros');

-- Etiquetas.
select results_eq(
  $$select user_id, badge from public.get_community_badges(
      array['ffffffff-0000-0000-0000-000000000001'::uuid],
      array['eeeeeeee-0000-0000-0000-000000000004'::uuid, 'eeeeeeee-0000-0000-0000-000000000005'::uuid,
            'eeeeeeee-0000-0000-0000-000000000006'::uuid, 'eeeeeeee-0000-0000-0000-000000000001'::uuid])
    order by user_id$$,
  $$values ('eeeeeeee-0000-0000-0000-000000000001'::uuid, 'admin'),
           ('eeeeeeee-0000-0000-0000-000000000004'::uuid, 'owner'),
           ('eeeeeeee-0000-0000-0000-000000000005'::uuid, 'moderator')$$,
  'etiquetas: dono, moderador e admin; nada para o membro');
select results_eq(
  $$select badge from public.get_community_badges(
      array['ffffffff-0000-0000-0000-000000000003'::uuid],
      array['eeeeeeee-0000-0000-0000-000000000007'::uuid])$$,
  $$values ('owner')$$,
  'admin que é dono recebe Dono');
reset role;

-- Limites e visibilidade das etiquetas (como Bia, usuária comum).
select throws_ok(
  $$select * from public.get_community_badges(array['ffffffff-0000-0000-0000-000000000001'::uuid],
      (select array_agg(gen_random_uuid()) from generate_series(1, 201)))$$,
  'P0001', 'too_many_ids', '201 ids são recusados');
select throws_ok(
  $$select * from public.get_community_badges(array[array['ffffffff-0000-0000-0000-000000000001'::uuid]],
      array['eeeeeeee-0000-0000-0000-000000000004'::uuid])$$,
  'P0001', 'too_many_ids', 'array bidimensional é recusado');
select is((select count(*)::int from public.get_community_badges(
    array['ffffffff-0000-0000-0000-000000000002'::uuid],
    array['eeeeeeee-0000-0000-0000-000000000004'::uuid])), 0,
  'comunidade pendente não mostra etiquetas a usuário comum');
select is((select count(*)::int from public.get_community_badges(
    array['ffffffff-0000-0000-0000-0000000000ff'::uuid],
    array['eeeeeeee-0000-0000-0000-000000000001'::uuid])), 0,
  'comunidade inexistente não devolve linhas, nem admin');
select is((select count(*)::int from public.get_community_badges(
    array['ffffffff-0000-0000-0000-000000000001'::uuid],
    array['eeeeeeee-0000-0000-0000-000000000004'::uuid, 'eeeeeeee-0000-0000-0000-000000000004'::uuid])), 1,
  'ids de usuário repetidos dão uma só linha');
reset role;
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000004');
set local role authenticated;
select is((select badge from public.get_community_badges(
    array['ffffffff-0000-0000-0000-000000000002'::uuid],
    array['eeeeeeee-0000-0000-0000-000000000004'::uuid])), 'owner',
  'o dono vê a própria etiqueta numa comunidade pendente');
reset role;
-- Sem JWT (sem sub), a função devolve vazio.
select set_config('request.jwt.claims', '', true);
set local role authenticated;
select is((select count(*)::int from public.get_community_badges(
    array['ffffffff-0000-0000-0000-000000000001'::uuid],
    array['eeeeeeee-0000-0000-0000-000000000004'::uuid])), 0,
  'chamada sem usuário devolve vazio');
reset role;

-- Post de perfil de usuária pública, visível ao admin.
insert into public.posts (user_id, content)
values ('eeeeeeee-0000-0000-0000-000000000003', 'perfil da bia');

-- Admin apaga.
select pg_temp.login('eeeeeeee-0000-0000-0000-000000000001');
set local role authenticated;
select is((select count(*)::int from public.posts where content = 'perfil da bia'), 1,
  'o admin enxerga o post de perfil de um perfil público');
select is(pg_temp.rows_changed($$delete from public.posts where content = 'perfil da bia'$$), 0,
  'admin não apaga post de perfil alheio por essa regra');
select is(pg_temp.rows_changed($$delete from public.posts where content = 'na comunidade'$$), 1,
  'admin do site apaga post de comunidade');
reset role;

select * from finish();
rollback;
