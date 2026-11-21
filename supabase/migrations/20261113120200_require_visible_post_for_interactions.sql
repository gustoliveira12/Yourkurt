-- Curtir e comentar só posts que a pessoa pode ver.
--
-- As policies de insert só conferiam auth.uid() = user_id: quem soubesse o id
-- de um post de perfil privado conseguia curtir e comentar nele. Com os avisos
-- de curtida e comentário, isso viraria uma forma de um estranho mandar
-- notificações para o dono de um perfil privado.
--
-- O select em posts dentro da policy passa pela RLS de posts, então só
-- enxerga os posts visíveis para quem chama.

drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own"
  on public.reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id)
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id)
  );
