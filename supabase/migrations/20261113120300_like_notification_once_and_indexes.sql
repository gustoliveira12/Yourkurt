-- Aviso de curtida uma vez por pessoa e post, e índices das limpezas.
--
-- Antes, descurtir apagava o aviso e curtir de novo criava outro, não lido:
-- alternar a curtida servia para acender a bolinha do autor várias vezes.
-- Agora o aviso fica quando a curtida é desfeita, e curtir de novo não cria
-- outro (índice único + on conflict do nothing, seguro com cliques simultâneos).

drop trigger if exists trg_reactions_cleanup_like on public.reactions;
drop function if exists public.cleanup_post_like_notification();

create unique index notifications_like_once_idx
  on public.notifications (user_id, actor_id, post_id)
  where type = 'like';

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
    values (v_author, new.user_id, 'like', new.id, 'reaction', new.post_id)
    on conflict (user_id, actor_id, post_id) where type = 'like' do nothing;
  end if;

  return new;
end;
$$;
revoke all on function public.notify_post_like() from public, anon, authenticated;

-- Sem a limpeza ao descurtir, os avisos de curtida de quem apaga a conta
-- precisam sair antes de o actor_id virar nulo (o FK é on delete set null).
-- Comentários já saem pela cascata em comments; aqui ficam junto por clareza.
create or replace function public.cleanup_actor_activity_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where actor_id = old.id
    and type in ('like', 'comment');
  return old;
end;
$$;
revoke all on function public.cleanup_actor_activity_notifications() from public, anon, authenticated;

create trigger trg_profiles_cleanup_actor_notifications
  before delete on public.profiles
  for each row execute function public.cleanup_actor_activity_notifications();

-- Apagar um post (cascata por post_id) e apagar um comentário (limpeza por
-- entity_id) sem varrer a tabela de notificações.
create index notifications_post_id_idx
  on public.notifications (post_id)
  where post_id is not null;

create index notifications_comment_entity_idx
  on public.notifications (entity_id)
  where type = 'comment';

-- A limpeza por ator também usa índice.
create index notifications_actor_activity_idx
  on public.notifications (actor_id)
  where type in ('like', 'comment');
