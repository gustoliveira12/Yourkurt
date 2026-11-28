-- Revisão dos pedidos de comunidade: aprovar, recusar, cancelar e avisar o criador.

-- A notificação de comunidade aponta para ela por uma coluna própria, para a
-- cascata apagar os avisos junto com a comunidade. O entity_id continua
-- guardando o mesmo id, como nos outros tipos.
alter table public.notifications
  add column community_id uuid references public.communities (id) on delete cascade;

create index notifications_community_id_idx
  on public.notifications (community_id)
  where community_id is not null;

-- O criador pode cancelar o pedido pendente e apagar o recusado. Comunidade
-- aprovada só sai pelo admin do site (communities_delete_admin).
create policy communities_delete_own_request on public.communities
for delete to authenticated
using (created_by = auth.uid() and status in ('pending', 'rejected'));

-- Aprova ou recusa um pedido pendente. Roda como definer para gravar a
-- notificação, que o usuário comum não pode inserir; a checagem de admin é
-- feita aqui dentro.
create or replace function public.review_community(
  p_community_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community public.communities%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_current_user_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- Nulo não é aprovar nem recusar: sem esta checagem ele cairia no ramo de
  -- recusa, sem motivo (not null é nulo e pularia a validação do motivo).
  if p_approve is null then
    raise exception 'invalid_decision';
  end if;

  -- Trava a linha para duas revisões simultâneas não passarem juntas.
  select * into v_community
  from public.communities
  where id = p_community_id
  for update;

  if not found or v_community.status <> 'pending' then
    raise exception 'community_not_pending';
  end if;

  if not p_approve and (v_reason is null or char_length(v_reason) not between 5 and 500) then
    raise exception 'rejection_reason_required';
  end if;

  update public.communities
  set status = case when p_approve then 'approved' else 'rejected' end::public.community_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = case when p_approve then null else v_reason end
  where id = p_community_id;

  -- Sem criador (conta excluída) não há a quem avisar. Estes tipos não passam
  -- por preferência: o criador sempre quer saber do resultado do pedido.
  if v_community.created_by is not null then
    insert into public.notifications (user_id, actor_id, type, entity_id, entity_type, community_id)
    values (
      v_community.created_by,
      auth.uid(),
      case when p_approve then 'community_approved' else 'community_rejected' end,
      p_community_id,
      'community',
      p_community_id
    );
  end if;
end;
$$;

revoke all on function public.review_community(uuid, boolean, text) from public, anon;
grant execute on function public.review_community(uuid, boolean, text) to authenticated;
