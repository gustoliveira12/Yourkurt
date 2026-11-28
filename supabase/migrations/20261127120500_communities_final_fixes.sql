-- Ajustes finais das comunidades (parte 1).

-- 1. Excluir a conta apaga tudo na hora: pedidos pendentes ou recusados não têm
--    outros membros nem posse a transferir, e sem isso ficariam órfãos (sem
--    criador) e um admin poderia aprovar uma comunidade sem dono. As aprovadas
--    seguem a regra de transferência de posse (created_by vira nulo).
create or replace function public.delete_unreviewed_communities_of_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.communities
  where created_by = old.id
    and status in ('pending', 'rejected');
  return old;
end;
$$;

revoke all on function public.delete_unreviewed_communities_of_profile() from public, anon, authenticated;

drop trigger if exists profiles_delete_unreviewed_communities on public.profiles;
create trigger profiles_delete_unreviewed_communities
before delete on public.profiles
for each row execute function public.delete_unreviewed_communities_of_profile();

-- 6. Post de comunidade não pode vir como post de página de time: as páginas de
--    time saem na parte 3 e os dois contextos não se misturam. O resto da
--    policy é idêntico à definição de 20261030140000.
drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (community_id is null or author_team_page_id is null)
    and (
      community_id is null
      or (
        exists (
          select 1
          from public.communities c
          where c.id = posts.community_id
            and c.status = 'approved'
        )
        and exists (
          select 1
          from public.community_memberships cm
          where cm.community_id = posts.community_id
            and cm.user_id = auth.uid()
        )
      )
    )
    and (
      author_team_page_id is null
      or exists (
        select 1
        from public.team_memberships tm
        where tm.team_page_id = posts.author_team_page_id
          and tm.user_id = auth.uid()
          and tm.can_post = true
      )
    )
  );
