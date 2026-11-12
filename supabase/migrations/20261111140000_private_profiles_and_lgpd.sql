-- Perfil privado de verdade e ajustes de LGPD.
--
-- Perfil privado: dados pessoais (bio, aniversário, localização, site) e posts
-- só aparecem para o dono e para seguidores aprovados. Seguir um perfil
-- privado vira um pedido que o dono aceita ou recusa.
--
-- Para os outros usuários, o aniversário aparece só com dia e mês.

-- ===========================================================================
-- 1. Sincronização com o Supabase Auth
-- ===========================================================================
-- handle_new_user também rodava em todo UPDATE de auth.users e sobrescrevia o
-- perfil com os metadados do cadastro. Como trocar avatar ou capa chama
-- auth.updateUser, isso desfazia nome, @ e bio editados, tornava o perfil
-- público de novo e religava "receber novidades". Agora o cadastro cria o
-- perfil, e a atualização só sincroniza o e-mail.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id, email, name, username, bio,
    profile_visibility, theme_preference, receive_product_updates, header_url
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(meta->>'name'), ''), split_part(new.email, '@', 1), 'Novo usuário'),
    nullif(lower(trim(meta->>'username')), ''),
    nullif(trim(meta->>'bio'), ''),
    case when meta->>'profile_visibility' in ('public', 'private')
      then meta->>'profile_visibility' else 'public' end,
    case when meta->>'theme_preference' in ('system', 'light', 'dark')
      then meta->>'theme_preference' else 'system' end,
    -- Consentimento só vale se a pessoa marcou: na dúvida, não recebe.
    coalesce(lower(meta->>'receive_product_updates') = 'true', false),
    nullif(trim(meta->>'header_url'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email, updated_at = now()
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ===========================================================================
-- 2. "Receber novidades": desmarcado por padrão
-- ===========================================================================
-- A caixa vinha marcada no cadastro, então o "sim" de quem já se cadastrou não
-- é um consentimento válido. Como nenhuma novidade foi enviada até hoje, todos
-- voltam para "não"; quem quiser recebe marcando de novo.
alter table public.profiles alter column receive_product_updates set default false;
update public.profiles set receive_product_updates = false where receive_product_updates;

-- ===========================================================================
-- 3. Pedidos para seguir
-- ===========================================================================
alter table public.follows
  add column if not exists status text not null default 'accepted'
  constraint follows_status_check check (status in ('pending', 'accepted'));

-- O banco decide o status: pedido para perfis privados, direto para públicos.
create or replace function public.set_follow_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.status := case
    when exists (
      select 1 from public.profiles p
      where p.id = new.following_id and p.profile_visibility = 'private'
    ) then 'pending'
    else 'accepted'
  end;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.set_follow_status() from public, anon, authenticated;

drop trigger if exists trg_follows_set_status on public.follows;
create trigger trg_follows_set_status
  before insert on public.follows
  for each row execute function public.set_follow_status();

-- O cliente informa só o par; status e created_at vêm do banco.
revoke insert on public.follows from authenticated;
grant insert (follower_id, following_id) on public.follows to authenticated;

-- Pedidos pendentes só são visíveis para as duas pessoas envolvidas.
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_visible"
  on public.follows for select
  to authenticated
  using (
    status = 'accepted'
    or follower_id = auth.uid()
    or following_id = auth.uid()
  );

-- Quem segue deixa de seguir (ou cancela o pedido); quem é seguido recusa o
-- pedido ou remove o seguidor.
drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_involved"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

-- Notificação: "quer seguir você" para pedidos, "começou a seguir" para os demais.
create or replace function public.notify_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
  values (
    new.following_id,
    new.follower_id,
    case new.status when 'pending' then 'follow_request' else 'follow' end,
    new.follower_id,
    'profile'
  );
  return new;
end;
$$;
revoke all on function public.notify_new_follow() from public, anon, authenticated;

-- Pedido cancelado ou recusado: a notificação do pedido some.
create or replace function public.cleanup_follow_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' then
    delete from public.notifications
    where user_id = old.following_id
      and actor_id = old.follower_id
      and type = 'follow_request';
  end if;
  return old;
end;
$$;
revoke all on function public.cleanup_follow_request_notification() from public, anon, authenticated;

drop trigger if exists trg_follows_cleanup_request on public.follows;
create trigger trg_follows_cleanup_request
  after delete on public.follows
  for each row execute function public.cleanup_follow_request_notification();

create or replace function public.accept_follow_request(p_follower_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.follows
  set status = 'accepted'
  where follower_id = p_follower_id
    and following_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'follow_request_not_found';
  end if;

  -- O pedido vira "começou a seguir você" na lista de quem aceitou...
  update public.notifications
  set type = 'follow', read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and actor_id = p_follower_id
    and type = 'follow_request';

  -- ...e quem pediu fica sabendo que foi aceito.
  insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
  values (p_follower_id, auth.uid(), 'follow_accepted', auth.uid(), 'profile');
end;
$$;
revoke all on function public.accept_follow_request(uuid) from public, anon;
grant execute on function public.accept_follow_request(uuid) to authenticated;

-- Perfil que deixa de ser privado: os pedidos pendentes são aceitos.
create or replace function public.accept_pending_follows_on_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.follows
  set status = 'accepted'
  where following_id = new.id and status = 'pending';

  update public.notifications
  set type = 'follow'
  where user_id = new.id and type = 'follow_request';

  return new;
end;
$$;
revoke all on function public.accept_pending_follows_on_public() from public, anon, authenticated;

drop trigger if exists trg_profiles_accept_pending_follows on public.profiles;
create trigger trg_profiles_accept_pending_follows
  after update of profile_visibility on public.profiles
  for each row
  when (old.profile_visibility = 'private' and new.profile_visibility = 'public')
  execute function public.accept_pending_follows_on_public();

-- ===========================================================================
-- 4. Quem pode ver o conteúdo de um perfil
-- ===========================================================================
create or replace function public.can_view_profile(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = p_owner and p.profile_visibility = 'public'
    )
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = p_owner
        and f.status = 'accepted'
    )
  );
$$;
revoke all on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

-- Posts de perfis privados só para o dono e seguidores aprovados.
-- Posts publicados em nome de uma equipe seguem visíveis: são da equipe.
drop policy if exists "posts_select_all_public" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (
    (is_public = true or user_id = auth.uid())
    and (author_team_page_id is not null or public.can_view_profile(user_id))
  );

-- Comentários e curtidas acompanham a visibilidade do post. A subconsulta em
-- posts já passa pela policy acima. (A mídia, em post_media, já fazia isso.)
drop policy if exists "comments_select_related" on public.comments;
drop policy if exists "comments_select_visible" on public.comments;
create policy "comments_select_visible"
  on public.comments for select
  to authenticated
  using (exists (select 1 from public.posts p where p.id = comments.post_id));

drop policy if exists "reactions_select_all" on public.reactions;
drop policy if exists "reactions_select_visible" on public.reactions;
create policy "reactions_select_visible"
  on public.reactions for select
  to authenticated
  using (exists (select 1 from public.posts p where p.id = reactions.post_id));

-- ===========================================================================
-- 5. Dados pessoais do perfil
-- ===========================================================================
-- Bio, aniversário, localização e site saem da leitura direta da tabela: um
-- GRANT de coluna vale para todas as linhas e não sabe se o perfil é privado.
-- O próprio usuário lê tudo por get_my_profile(); os outros, por
-- get_public_profile(), que aplica as regras de privacidade.
revoke select on public.profiles from authenticated;
grant select (
  id, name, username, avatar_url, header_url, profile_visibility, created_at, updated_at
) on public.profiles to authenticated;

create or replace function public.get_my_profile()
returns table (
  id uuid,
  name text,
  username text,
  bio text,
  location text,
  website text,
  birthday date,
  avatar_url text,
  header_url text,
  profile_visibility text,
  receive_product_updates boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.username, p.bio, p.location, p.website, p.birthday,
         p.avatar_url, p.header_url, p.profile_visibility, p.receive_product_updates
  from public.profiles p
  where p.id = auth.uid();
$$;
revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- O tipo de retorno muda, então a função é recriada.
drop function if exists public.get_public_profile(text);
create function public.get_public_profile(p_username text)
returns table (
  id uuid,
  name text,
  username text,
  avatar_url text,
  header_url text,
  is_private boolean,
  can_view boolean,
  bio text,
  location text,
  website text,
  birthday_day_month text,
  followers_count bigint,
  following_count bigint,
  follow_status text,
  follows_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select p.*, public.can_view_profile(p.id) as visible
    from public.profiles p
    where lower(p.username) = lower(p_username)
      and auth.uid() is not null
  )
  select
    t.id, t.name, t.username, t.avatar_url, t.header_url,
    t.profile_visibility = 'private',
    t.visible,
    case when t.visible then t.bio end,
    case when t.visible then t.location end,
    case when t.visible then t.website end,
    -- Só dia e mês ("MM-DD"): o ano revela a idade.
    case when t.visible then to_char(t.birthday, 'MM-DD') end,
    (select count(*) from public.follows f where f.following_id = t.id and f.status = 'accepted'),
    (select count(*) from public.follows f where f.follower_id = t.id and f.status = 'accepted'),
    coalesce(
      (select f.status from public.follows f
       where f.follower_id = auth.uid() and f.following_id = t.id),
      'none'
    ),
    exists (
      select 1 from public.follows f
      where f.follower_id = t.id and f.following_id = auth.uid() and f.status = 'accepted'
    )
  from target t;
$$;
revoke all on function public.get_public_profile(text) from public, anon;
grant execute on function public.get_public_profile(text) to authenticated;

-- ===========================================================================
-- 6. Direito de acesso e portabilidade (LGPD, art. 18)
-- ===========================================================================
-- Devolve, em JSON, todos os dados pessoais da pessoa logada.
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
