-- Posts de comunidade sempre públicos, exclusão pelo admin do site e etiquetas
-- de membro (Dono, Moderador, Admin).

-- Decisão do produto (spec, decisão 2): post de comunidade é sempre público.
-- Se existir post de comunidade privado, a constraint falha de propósito em vez
-- de publicá-lo em silêncio.

alter table public.posts
  add constraint posts_community_always_public
  check (community_id is null or is_public);

-- Post de comunidade aparece para qualquer pessoa logada quando a comunidade
-- está aprovada (mesmo de perfil privado), e para admins do site sempre. O
-- status é filtrado aqui, sem depender da RLS de communities. Post fora de
-- comunidade segue a regra anterior.
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (
    case
      when community_id is not null then
        exists (
          select 1 from public.communities c
          where c.id = posts.community_id and c.status = 'approved'
        )
        or public.is_current_user_admin()
      else
        (is_public = true or user_id = auth.uid())
        and (author_team_page_id is not null or public.can_view_profile(user_id))
    end
  );

-- Admin do site modera posts de comunidade. Soma-se a posts_delete_own.
create policy "posts_delete_community_admin"
  on public.posts for delete
  to authenticated
  using (community_id is not null and public.is_current_user_admin());

-- Etiquetas por par comunidade/usuário, na prioridade owner > moderator > admin.
-- Security definer porque is_admin não é legível por outros usuários.
create or replace function public.get_community_badges(
  p_community_ids uuid[],
  p_user_ids uuid[]
)
returns table (community_id uuid, user_id uuid, badge text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  -- cardinality conta todos os elementos e array_ndims barra arrays
  -- multidimensionais (array_length só olhava a primeira dimensão).
  if cardinality(p_community_ids) > 200 or cardinality(p_user_ids) > 200
     or array_ndims(p_community_ids) > 1 or array_ndims(p_user_ids) > 1 then
    raise exception 'too_many_ids';
  end if;

  return query
  select distinct pairs.community_id, pairs.user_id,
    case
      when m.role = 'owner' then 'owner'
      when m.role = 'moderator' then 'moderator'
      else 'admin'
    end as badge
  from (
    select c.id as community_id, u.id as user_id
    from unnest(p_community_ids) as c(id)
    cross join unnest(p_user_ids) as u(id)
  ) pairs
  -- Só comunidades que existem e que quem pergunta pode ver: aprovada, ou o
  -- chamador é admin do site ou dono dela. Evita vazar dono de pendente e
  -- responder "é admin?" para ids inventados.
  join public.communities cm on cm.id = pairs.community_id
    and (cm.status = 'approved'
      or public.is_current_user_admin()
      or public.is_community_owner(cm.id))
  left join public.community_memberships m
    on m.community_id = pairs.community_id and m.user_id = pairs.user_id
  left join public.profiles p on p.id = pairs.user_id
  where m.role in ('owner', 'moderator')
     or coalesce(p.is_admin, false) or coalesce(p.is_super_admin, false);
end;
$$;

revoke execute on function public.get_community_badges(uuid[], uuid[]) from public, anon;
grant execute on function public.get_community_badges(uuid[], uuid[]) to authenticated;
