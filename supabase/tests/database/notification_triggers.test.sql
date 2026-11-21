-- Avisos de curtida, comentário e seguir, respeitando as preferências.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Entra como um usuário, como o PostgREST faz com o JWT.
create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Avisos de um tipo recebidos por uma pessoa.
create function pg_temp.count_notifications(p_user uuid, p_type text) returns bigint language sql as $$
  select count(*) from public.notifications where user_id = p_user and type = p_type;
$$;

-- Avisos de um tipo recebidos por uma pessoa e feitos por outra.
create function pg_temp.count_from(p_user uuid, p_actor uuid, p_type text) returns bigint language sql as $$
  select count(*) from public.notifications where user_id = p_user and actor_id = p_actor and type = p_type;
$$;

-- Ana e Bia têm perfil público; Caio, privado.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'ana@test.local', '{"name":"Ana","username":"ana_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'bia@test.local', '{"name":"Bia","username":"bia_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'caio@test.local', '{"name":"Caio","username":"caio_t","profile_visibility":"private"}');

insert into public.posts (id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Post da Ana');

-- Curtida
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
insert into public.reactions (post_id, user_id, type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'like');
reset role;
select results_eq(
  $$select actor_id, post_id from public.notifications
    where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and type = 'like'$$,
  $$values ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-0000-0000-0000-000000000001'::uuid)$$,
  'curtir o post de outra pessoa avisa o autor, apontando para o post'
);

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
delete from public.reactions
where post_id = 'bbbbbbbb-0000-0000-0000-000000000001' and user_id = 'aaaaaaaa-0000-0000-0000-000000000002';
reset role;
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000001', 'like'), 1::bigint,
  'descurtir mantém o aviso: cada pessoa avisa uma vez por post');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
insert into public.reactions (post_id, user_id, type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'like');
reset role;
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000001', 'like'), 1::bigint,
  'curtir de novo não cria outro aviso');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
insert into public.reactions (post_id, user_id, type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'like');
reset role;
select is(pg_temp.count_from('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'like'), 0::bigint,
  'curtir o próprio post não gera aviso');

-- Comentário
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
insert into public.comments (post_id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Comentário da Bia');
reset role;
select results_eq(
  $$select entity_id, post_id from public.notifications
    where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and type = 'comment'$$,
  $$select id, post_id from public.comments where content = 'Comentário da Bia'$$,
  'comentar o post de outra pessoa avisa o autor'
);

-- Preferências desligadas
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
select public.set_my_notification_preferences(false, true, false, true);
reset role;

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003');
set local role authenticated;
insert into public.reactions (post_id, user_id, type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'like');
reset role;
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
insert into public.follows (follower_id, following_id)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001');
reset role;
select is(pg_temp.count_from('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'like'), 0::bigint,
  'com curtidas desligadas, curtir não gera aviso');
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000001', 'follow'), 0::bigint,
  'com novos seguidores desligados, seguir não gera aviso');

-- Pedido para seguir não pode ser desligado.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003');
set local role authenticated;
select public.set_my_notification_preferences(true, true, false, true);
reset role;

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
select public.set_my_notification_preferences(true, true, true, false);
insert into public.follows (follower_id, following_id)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
reset role;
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000003', 'follow_request'), 1::bigint,
  'pedido para seguir chega mesmo com novos seguidores desligados');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003');
set local role authenticated;
select public.accept_follow_request('aaaaaaaa-0000-0000-0000-000000000002');
reset role;
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000002', 'follow_accepted'), 0::bigint,
  'com pedido aceito desligado, aceitar não avisa quem pediu');

-- Limpeza
delete from public.comments where content = 'Comentário da Bia';
select is(pg_temp.count_notifications('aaaaaaaa-0000-0000-0000-000000000001', 'comment'), 0::bigint,
  'apagar o comentário apaga o aviso');

insert into public.comments (post_id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Outro comentário');
delete from public.posts where id = 'bbbbbbbb-0000-0000-0000-000000000001';
select is(
  (select count(*) from public.notifications where post_id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0::bigint,
  'apagar o post apaga os avisos ligados a ele'
);

-- Quem curtiu e comentou apaga a conta: não sobra aviso sem autor.
insert into public.posts (id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Outro post da Ana');
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
select public.set_my_notification_preferences(true, true, true, true);
reset role;
insert into public.reactions (post_id, user_id, type)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'like');
insert into public.comments (post_id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Comentário antes de sair');
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000002';
select is(
  (select count(*) from public.notifications
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and type in ('like', 'comment')),
  0::bigint,
  'quem apaga a conta leva junto os avisos de curtida e comentário'
);

-- Índices das limpezas em cascata.
select has_index('public', 'notifications', 'notifications_post_id_idx',
  'apagar um post acha os avisos dele pelo índice');
select has_index('public', 'notifications', 'notifications_comment_entity_idx',
  'apagar um comentário acha o aviso dele pelo índice');

select * from finish();
rollback;
