-- Preferências de notificação por tipo de aviso.
--
-- As preferências ficam numa tabela sem acesso direto pela API: só as funções
-- get_my_notification_preferences e set_my_notification_preferences leem e
-- gravam, sempre a linha de quem chama. Sem linha, tudo fica ligado.
-- Os triggers que criam notificações consultam wants_notification antes de
-- criar, para que desligar um tipo valha no banco e não só na tela.

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  likes boolean not null default true,
  comments boolean not null default true,
  follows boolean not null default true,
  follow_accepted boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;

-- Pedido para seguir (follow_request) não pode ser desligado: num perfil
-- privado, é por ele que o dono aprova quem pode segui-lo. Tipos sem
-- preferência própria também devolvem true.
create or replace function public.wants_notification(p_user_id uuid, p_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case p_type
      when 'like' then np.likes
      when 'comment' then np.comments
      when 'follow' then np.follows
      when 'follow_accepted' then np.follow_accepted
    end
    from public.notification_preferences np
    where np.user_id = p_user_id
  ), true);
$$;
revoke all on function public.wants_notification(uuid, text) from public, anon, authenticated;

create or replace function public.get_my_notification_preferences()
returns table (likes boolean, comments boolean, follows boolean, follow_accepted boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(np.likes, true),
    coalesce(np.comments, true),
    coalesce(np.follows, true),
    coalesce(np.follow_accepted, true)
  from (select auth.uid() as uid) me
  left join public.notification_preferences np on np.user_id = me.uid
  where me.uid is not null;
$$;
revoke all on function public.get_my_notification_preferences() from public, anon;
grant execute on function public.get_my_notification_preferences() to authenticated;

create or replace function public.set_my_notification_preferences(
  p_likes boolean,
  p_comments boolean,
  p_follows boolean,
  p_follow_accepted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.notification_preferences (user_id, likes, comments, follows, follow_accepted)
  values (auth.uid(), p_likes, p_comments, p_follows, p_follow_accepted)
  on conflict (user_id) do update
  set likes = excluded.likes,
      comments = excluded.comments,
      follows = excluded.follows,
      follow_accepted = excluded.follow_accepted,
      updated_at = now();
end;
$$;
revoke all on function public.set_my_notification_preferences(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_my_notification_preferences(boolean, boolean, boolean, boolean) to authenticated;

-- Avisos de curtida e comentário apontam para o post; apagar o post apaga os
-- avisos ligados a ele.
alter table public.notifications
  add column post_id uuid references public.posts (id) on delete cascade;

-- Contagem de não lidas da bolinha do sino.
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- O app só precisa marcar como lida. Antes, a pessoa podia mudar qualquer
-- coluna das próprias notificações (tipo, autor, alvo) pela API.
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Exportação de dados (LGPD): passa a incluir as preferências de notificação.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (
      select to_jsonb(p) - 'is_admin' - 'is_super_admin'
      from public.profiles p where p.id = auth.uid()
    ),
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', po.id,
        'content', po.content,
        'created_at', po.created_at,
        'author_team_page_id', po.author_team_page_id,
        'community_id', po.community_id,
        'media', (
          select coalesce(jsonb_agg(pm.storage_path order by pm.position_index), '[]'::jsonb)
          from public.post_media pm where pm.post_id = po.id
        )
      ) order by po.created_at)
      from public.posts po where po.user_id = auth.uid()
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'post_id', c.post_id, 'content', c.content, 'created_at', c.created_at
      ) order by c.created_at)
      from public.comments c where c.user_id = auth.uid()
    ), '[]'::jsonb),
    'reactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'post_id', r.post_id, 'type', r.type, 'created_at', r.created_at
      ) order by r.created_at)
      from public.reactions r where r.user_id = auth.uid()
    ), '[]'::jsonb),
    'following', coalesce((
      select jsonb_agg(jsonb_build_object(
        'username', p.username, 'status', f.status, 'created_at', f.created_at
      ) order by f.created_at)
      from public.follows f join public.profiles p on p.id = f.following_id
      where f.follower_id = auth.uid()
    ), '[]'::jsonb),
    'followers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'username', p.username, 'status', f.status, 'created_at', f.created_at
      ) order by f.created_at)
      from public.follows f join public.profiles p on p.id = f.follower_id
      where f.following_id = auth.uid()
    ), '[]'::jsonb),
    'notifications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', n.type, 'created_at', n.created_at, 'read_at', n.read_at
      ) order by n.created_at)
      from public.notifications n where n.user_id = auth.uid()
    ), '[]'::jsonb),
    'notification_preferences', (
      select to_jsonb(np) from public.get_my_notification_preferences() np
    ),
    'team_memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'team', t.name, 'role', tm.role, 'can_post', tm.can_post, 'created_at', tm.created_at
      ))
      from public.team_memberships tm join public.team_pages t on t.id = tm.team_page_id
      where tm.user_id = auth.uid()
    ), '[]'::jsonb),
    'community_memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'community', c.name, 'role', cm.role, 'joined_at', cm.joined_at
      ))
      from public.community_memberships cm join public.communities c on c.id = cm.community_id
      where cm.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
