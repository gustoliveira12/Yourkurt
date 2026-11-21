-- Avisos de curtida e comentário, e preferências nos avisos de seguir.
--
-- Os avisos são criados por triggers, como os de seguir; o frontend não cria
-- notificações. Ninguém recebe aviso da própria ação, e cada tipo respeita a
-- preferência do destinatário (wants_notification). Num post de página de
-- equipe, o aviso vai para quem publicou (posts.user_id).

-- Curtida: avisa o autor do post. O aviso aponta para a curtida (entity_id),
-- para a limpeza achá-lo mesmo depois que a conta de quem curtiu sai (nesse
-- caso o actor_id já virou nulo), e para o post (post_id), que é para onde o
-- clique leva.
create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if new.type <> 'like' then
    return new;
  end if;

  select user_id into v_author from public.posts where id = new.post_id;

  if v_author is not null
     and v_author <> new.user_id
     and public.wants_notification(v_author, 'like') then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type, post_id)
    values (v_author, new.user_id, 'like', new.id, 'reaction', new.post_id);
  end if;

  return new;
end;
$$;
revoke all on function public.notify_post_like() from public, anon, authenticated;

create trigger trg_reactions_notify_like
  after insert on public.reactions
  for each row execute function public.notify_post_like();

-- Descurtir apaga o aviso, para curtir e descurtir várias vezes não acumular
-- avisos. Também roda quando a conta de quem curtiu é apagada (cascata).
create or replace function public.cleanup_post_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.type = 'like' then
    delete from public.notifications
    where type = 'like'
      and entity_id = old.id;
  end if;
  return old;
end;
$$;
revoke all on function public.cleanup_post_like_notification() from public, anon, authenticated;

create trigger trg_reactions_cleanup_like
  after delete on public.reactions
  for each row execute function public.cleanup_post_like_notification();

-- Comentário: avisa o autor do post. O aviso aponta para o comentário
-- (entity_id) e para o post (post_id), que é para onde o clique leva.
create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  select user_id into v_author from public.posts where id = new.post_id;

  if v_author is not null
     and v_author <> new.user_id
     and public.wants_notification(v_author, 'comment') then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type, post_id)
    values (v_author, new.user_id, 'comment', new.id, 'comment', new.post_id);
  end if;

  return new;
end;
$$;
revoke all on function public.notify_post_comment() from public, anon, authenticated;

create trigger trg_comments_notify
  after insert on public.comments
  for each row execute function public.notify_post_comment();

-- Comentário apagado (inclusive em cascata, quando a conta do autor sai):
-- o aviso dele some.
create or replace function public.cleanup_post_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where type = 'comment'
    and entity_id = old.id;
  return old;
end;
$$;
revoke all on function public.cleanup_post_comment_notification() from public, anon, authenticated;

create trigger trg_comments_cleanup_notification
  after delete on public.comments
  for each row execute function public.cleanup_post_comment_notification();

-- Seguir: "começou a seguir" respeita a preferência; o pedido para seguir
-- sempre chega, porque é por ele que o dono de um perfil privado aprova.
create or replace function public.notify_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending'
     or public.wants_notification(new.following_id, 'follow') then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
    values (
      new.following_id,
      new.follower_id,
      case new.status when 'pending' then 'follow_request' else 'follow' end,
      new.follower_id,
      'profile'
    );
  end if;
  return new;
end;
$$;
revoke all on function public.notify_new_follow() from public, anon, authenticated;

-- Igual à versão de 20261111140000, mas o aviso "aceitou seu pedido"
-- respeita a preferência de quem pediu.
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

  -- ...e quem pediu fica sabendo que foi aceito, se quiser.
  if public.wants_notification(p_follower_id, 'follow_accepted') then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type)
    values (p_follower_id, auth.uid(), 'follow_accepted', auth.uid(), 'profile');
  end if;
end;
$$;
revoke all on function public.accept_follow_request(uuid) from public, anon;
grant execute on function public.accept_follow_request(uuid) to authenticated;
