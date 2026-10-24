-- ==========================================
-- SEED.SQL - DADOS FALSOS PARA AMBIENTE LOCAL
-- ==========================================

-- 1. Criação de Usuários Falsos (Senha para todos: dev123)
-- Usamos gen_salt('bf') para gerar um hash seguro localmente sem vazar senhas reais.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES 
('11111111-1111-1111-1111-111111111111', 'dev1@yourkurt.test', crypt('dev123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Desenvolvedor 1"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222222', 'dev2@yourkurt.test', crypt('dev123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Desenvolvedor 2"}', 'authenticated', 'authenticated');

-- 2. Criação de Comunidades de Teste
INSERT INTO public.communities (id, name, slug, description, owner_id)
VALUES 
('33333333-3333-3333-3333-333333333333', 'Cybersec BR', 'cybersec-br', 'Comunidade de testes para validação do frontend.', '11111111-1111-1111-1111-111111111111');

-- 3. Criação de Posts de Teste (vinculados à comunidade)
INSERT INTO public.posts (id, user_id, community_id, content)
VALUES 
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Fala galera! Testando o feed da comunidade com o novo banco de dados limpo.'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', NULL, 'Este é um post normal no meu perfil, sem estar em nenhuma comunidade.');

-- 4. Criação de Mídia Falsa (Nova arquitetura com position_index)
INSERT INTO public.post_media (post_id, file_path, position_index)
VALUES 
('44444444-4444-4444-4444-444444444444', 'fake_images/imagem_teste_1.jpg', 0),
('44444444-4444-4444-4444-444444444444', 'fake_images/imagem_teste_2.jpg', 1);