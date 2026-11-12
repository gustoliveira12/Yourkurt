-- Restringe, coluna por coluna, o que usuários logados podem ler e gravar.
--
-- No PostgreSQL, um REVOKE de coluna não tem efeito enquanto existe GRANT na
-- tabela inteira. O baseline deu GRANT ALL em todas as tabelas, então o
-- "revoke select (email, is_admin)" de 20260728120000 nunca valeu: qualquer
-- usuário logado conseguia ler o e-mail de todos. Aqui o GRANT da tabela é
-- trocado por uma lista explícita de colunas.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Leitura: só os dados de perfil público. Ficam de fora email, is_admin,
-- is_super_admin, theme_preference e receive_product_updates. Para o próprio
-- usuário, o e-mail vem do Supabase Auth e as permissões vêm de
-- get_current_user_permissions().
revoke select on public.profiles from authenticated;
grant select (
  id, name, username, avatar_url, header_url, bio,
  location, website, birthday, profile_visibility, created_at, updated_at
) on public.profiles to authenticated;

-- Escrita: o perfil é criado pelo trigger handle_new_user, nunca pelo cliente.
-- O e-mail é sincronizado do Supabase Auth pelo mesmo trigger; editá-lo direto
-- em profiles permitia ocupar o e-mail de outra pessoa (a coluna é unique) e
-- impedir o cadastro dela.
revoke insert, update on public.profiles from authenticated;
grant update (
  name, username, avatar_url, header_url, bio, birthday, location, website,
  profile_visibility, theme_preference, receive_product_updates
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
-- A policy posts_update_own só confere o dono do post. Sem restrição de
-- coluna, o dono podia definir likes_count à vontade ou trocar
-- author_team_page_id e passar a "assinar" o post como qualquer equipe,
-- sem a checagem de can_post que existe no INSERT.
--
-- Quem não está logado (anon) também podia listar todos os posts pela API,
-- com a chave pública que vai no JavaScript do site. O app exige login em
-- todas as telas, então anon não precisa ler posts.
revoke select on public.posts from anon;
revoke insert, update on public.posts from authenticated;
grant insert (user_id, author_team_page_id, community_id, content, is_public)
  on public.posts to authenticated;
grant update (content, is_public) on public.posts to authenticated;

-- ---------------------------------------------------------------------------
-- comments e reactions
-- ---------------------------------------------------------------------------
-- created_at e id passam a ser sempre definidos pelo banco.
revoke insert, update on public.comments from authenticated;
grant insert (post_id, user_id, content) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;

revoke insert, update on public.reactions from authenticated;
grant insert (post_id, user_id, type) on public.reactions to authenticated;

-- ---------------------------------------------------------------------------
-- Privilégios padrão para objetos futuros
-- ---------------------------------------------------------------------------
-- O baseline faz toda tabela, sequência e função nova nascer com GRANT ALL
-- para anon. A partir daqui, objetos novos não dão nada a anon; cada migration
-- concede explicitamente o que precisa.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Storage: tipo e tamanho dos arquivos
-- ---------------------------------------------------------------------------
-- As policies de Storage só conferem a extensão do nome do arquivo, mas o
-- Content-Type vem do cliente. Limitar os tipos no bucket impede, por exemplo,
-- subir um HTML com nome .png.
update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
  file_size_limit = 5242880 -- 5 MB; o CreatePostbox já comprime para ~1 MB
where id = 'post-images';

update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
  file_size_limit = 10485760 -- 10 MB; avatar e capa ainda não são comprimidos
where id in ('avatars', 'headers');
