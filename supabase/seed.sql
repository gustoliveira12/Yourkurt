-- ==========================================
-- SEED.SQL - DADOS FALSOS PARA AMBIENTE LOCAL
-- ==========================================
-- Roda no `supabase db reset`, depois das migrations. Nunca use em produção.
--
-- Usuários (senha de todos: dev123):
--   dev1@yourkurt.test  @dev1  super admin, perfil público
--   dev2@yourkurt.test  @dev2  usuário comum, perfil privado
--   dev3@yourkurt.test  @dev3  usuário comum, perfil público

-- 1. Usuários. O trigger handle_new_user cria os perfis a partir dos metadados.
--    Os campos de token vazios e a linha em auth.identities são exigidos pelo
--    Supabase Auth para o login com senha funcionar.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
 'dev1@yourkurt.test', crypt('dev123', gen_salt('bf')), now(),
 '{"provider": "email", "providers": ["email"]}',
 '{"name": "Desenvolvedor 1", "username": "dev1"}',
 now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
 'dev2@yourkurt.test', crypt('dev123', gen_salt('bf')), now(),
 '{"provider": "email", "providers": ["email"]}',
 '{"name": "Desenvolvedor 2", "username": "dev2", "profile_visibility": "private"}',
 now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated',
 'dev3@yourkurt.test', crypt('dev123', gen_salt('bf')), now(),
 '{"provider": "email", "providers": ["email"]}',
 '{"name": "Desenvolvedor 3", "username": "dev3"}',
 now(), now(), '', '', '', '');

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
FROM auth.users u
WHERE u.id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
               '66666666-6666-6666-6666-666666666666');

-- 2. dev1 vira super admin. O trigger profiles_privilege_guard só permite essa
--    troca para um super admin logado, então é desligado durante o seed.
ALTER TABLE public.profiles DISABLE TRIGGER profiles_privilege_guard;
UPDATE public.profiles
SET is_admin = true, is_super_admin = true
WHERE id = '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.profiles ENABLE TRIGGER profiles_privilege_guard;

-- 3. Comunidade já aprovada. O trigger communities_guard_changes força
--    status = 'pending' e created_by = auth.uid() (vazio no seed), então também
--    é desligado. O trigger communities_add_owner continua ligado e cria a
--    inscrição do dono.
ALTER TABLE public.communities DISABLE TRIGGER communities_guard_changes;
INSERT INTO public.communities (id, name, slug, description, status, created_by)
VALUES (
  '33333333-3333-3333-3333-333333333333', 'Cybersec BR', 'cybersec-br',
  'Comunidade de testes para validação do frontend.', 'approved',
  '11111111-1111-1111-1111-111111111111'
);
ALTER TABLE public.communities ENABLE TRIGGER communities_guard_changes;

-- 4. Posts de teste. Sem imagens: os arquivos não existiriam no Storage local.
INSERT INTO public.posts (id, user_id, community_id, content)
VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
 'Fala galera! Testando o feed da comunidade com o novo banco de dados limpo.'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', NULL,
 'Este é um post no perfil privado do dev2: só aparece para quem ele aprovou.');

-- 5. Seguidores. O trigger set_follow_status decide o status: seguir o dev2
--    (privado) vira pedido pendente.
--    dev1 <-> dev3: seguem um ao outro, então são amigos.
--    dev2  -> dev1: seguidor, mas não amigo (o dev1 só pediu para seguir o dev2).
--    dev1  -> dev2: pedido pendente, aparece nas notificações do dev2.
INSERT INTO public.follows (follower_id, following_id)
VALUES
('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
