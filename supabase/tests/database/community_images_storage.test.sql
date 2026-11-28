-- Bucket de imagens das comunidades: quem pode enviar e quais extensões.
-- Rodar: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create function pg_temp.login(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'ana-img@test.local', '{"name":"Ana","username":"ana_img"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'bia-img@test.local', '{"name":"Bia","username":"bia_img"}');

-- Ana pede a comunidade e vira dona dela (trigger), mesmo pendente.
select pg_temp.login('cccccccc-0000-0000-0000-000000000012');
insert into public.communities (id, name, slug, theme)
values ('dddddddd-0000-0000-0000-0000000000a1', 'Ana Imagens', 'ana-imagens', 'estudos');

select is((select public from storage.buckets where id = 'community-images'), true, 'o bucket community-images existe e é público');
select is((select file_size_limit from storage.buckets where id = 'community-images'), 2097152::bigint, 'o limite é 2 MB');

-- storage.objects só é lido pelas policies; o papel authenticated entra aqui.
set local role authenticated;
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('community-images', 'dddddddd-0000-0000-0000-0000000000a1/avatar-1.png',
    'cccccccc-0000-0000-0000-000000000012', 'cccccccc-0000-0000-0000-000000000012')
$$, 'dono envia imagem na pasta da comunidade');

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('community-images', 'dddddddd-0000-0000-0000-0000000000a1/avatar-2.gif',
    'cccccccc-0000-0000-0000-000000000012', 'cccccccc-0000-0000-0000-000000000012')
$$, '42501', null, 'extensão fora da lista é recusada');

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('community-images', 'abc/x.png',
    'cccccccc-0000-0000-0000-000000000012', 'cccccccc-0000-0000-0000-000000000012')
$$, '42501', null, 'pasta que não é uuid é recusada sem erro de conversão');

reset role;
select pg_temp.login('cccccccc-0000-0000-0000-000000000013');
set local role authenticated;
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('community-images', 'dddddddd-0000-0000-0000-0000000000a1/header-1.png',
    'cccccccc-0000-0000-0000-000000000013', 'cccccccc-0000-0000-0000-000000000013')
$$, '42501', null, 'outro usuário não envia na pasta da comunidade');

select * from finish();
rollback;
