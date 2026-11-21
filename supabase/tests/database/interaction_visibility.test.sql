-- Curtir e comentar só posts que a pessoa pode ver.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

-- Entra como um usuário, como o PostgREST faz com o JWT.
create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

-- Caio tem perfil privado; Bia não o segue.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'bia@test.local', '{"name":"Bia","username":"bia_t"}'),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'caio@test.local', '{"name":"Caio","username":"caio_t","profile_visibility":"private"}');

insert into public.posts (id, user_id, content)
values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 'Post do Caio');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok(
  $$insert into public.reactions (post_id, user_id, type)
    values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'like')$$,
  '42501',
  null,
  'quem não pode ver o post de um perfil privado não curte'
);
select throws_ok(
  $$insert into public.comments (post_id, user_id, content)
    values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Oi')$$,
  '42501',
  null,
  'quem não pode ver o post de um perfil privado não comenta'
);

-- Bia pede para seguir e Caio aceita: agora ela vê o post.
insert into public.follows (follower_id, following_id)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
reset role;
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003');
set local role authenticated;
select public.accept_follow_request('aaaaaaaa-0000-0000-0000-000000000002');
reset role;

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
set local role authenticated;
select lives_ok(
  $$insert into public.reactions (post_id, user_id, type)
    values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'like')$$,
  'seguidora aprovada curte o post do perfil privado'
);
select lives_ok(
  $$insert into public.comments (post_id, user_id, content)
    values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Oi')$$,
  'seguidora aprovada comenta o post do perfil privado'
);
reset role;

select * from finish();
rollback;
