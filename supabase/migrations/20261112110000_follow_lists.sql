-- Amigos, seguidores e seguindo da pessoa logada.
--
-- Amigo = quem você segue e segue você de volta, com os dois seguimentos
-- aceitos (decisão 02 da documentação técnica). Não há tabela de amizade:
-- a amizade é derivada de follows.
--
-- p_kind:
--   'friends'   amigos (seguimento mútuo, os dois aceitos)
--   'followers' quem segue você (só aceitos; pedidos ficam nas notificações)
--   'following' quem você segue (aceitos e pedidos pendentes)
--
-- total_count repete, em cada linha, o total da lista (antes do limite), para
-- a tela mostrar "6 de 14" sem uma segunda consulta.
create or replace function public.get_my_follow_lists(p_kind text, p_limit int default 100)
returns table (
  id uuid,
  name text,
  username text,
  avatar_url text,
  follow_status text,  -- seu seguimento para a pessoa: 'accepted' ou 'pending' (só em 'following')
  is_friend boolean,   -- seguimento mútuo e aceito
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as id
  ),
  i_follow as (
    select f.following_id as person_id, f.status
    from public.follows f, me
    where f.follower_id = me.id
  ),
  follows_me as (
    select f.follower_id as person_id
    from public.follows f, me
    where f.following_id = me.id and f.status = 'accepted'
  ),
  list as (
    select person_id, status from i_follow
    where p_kind = 'following'
    union all
    select person_id, 'accepted' from follows_me
    where p_kind = 'followers'
    union all
    select i.person_id, 'accepted' from i_follow i
    join follows_me fm on fm.person_id = i.person_id
    where p_kind = 'friends' and i.status = 'accepted'
  )
  select
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    list.status,
    exists (
      select 1 from i_follow i
      join follows_me fm on fm.person_id = i.person_id
      where i.person_id = p.id and i.status = 'accepted'
    ),
    count(*) over ()
  from list
  join public.profiles p on p.id = list.person_id
  where (select id from me) is not null
    and p_kind in ('friends', 'followers', 'following')
  order by lower(p.name), p.id
  limit greatest(least(coalesce(p_limit, 100), 500), 0);
$$;

revoke all on function public.get_my_follow_lists(text, int) from public, anon;
grant execute on function public.get_my_follow_lists(text, int) to authenticated;
