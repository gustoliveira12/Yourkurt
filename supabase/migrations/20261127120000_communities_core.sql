-- Base das comunidades (parte 1): tema, papéis, limites, contagem de membros
-- e posse que sobrevive à exclusão da conta do dono.

-- Tema fixo da comunidade, escolhido no pedido de criação.
create type public.community_theme as enum (
  'estudos', 'tecnologia', 'games', 'esportes', 'musica', 'carreira', 'avisos_espro'
);

-- O default só existe para a tabela aceitar a coluna nova. Ela está vazia em
-- produção, então o valor não vira dado real e o default é removido em seguida.
alter table public.communities
  add column theme public.community_theme not null default 'estudos';
alter table public.communities alter column theme drop default;

alter table public.communities
  add column members_count integer not null default 0,
  add column rejection_reason text,
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz;

-- Backfill: a contagem passa a ser mantida por trigger, então parte do valor real.
update public.communities c
set members_count = (
  select count(*) from public.community_memberships m where m.community_id = c.id
);

-- Limites de tamanho no banco, para valerem mesmo fora do frontend.
alter table public.communities
  add constraint communities_description_length check (char_length(description) <= 500),
  add constraint communities_slug_length check (char_length(slug) between 3 and 40),
  add constraint communities_rejection_reason_length
    check (rejection_reason is null or char_length(rejection_reason) between 5 and 500);

-- Quem criou a comunidade pode excluir a conta sem apagá-la: created_by fica
-- nulo e a posse passa a outra pessoa (trigger mais abaixo). A FK aponta para
-- profiles para o frontend poder embutir o criador por esse nome.
alter table public.communities drop constraint communities_created_by_fkey;
alter table public.communities alter column created_by drop not null;
alter table public.communities
  add constraint communities_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- O papel "admin" da comunidade deixa de existir; admin é só do site.
alter table public.community_memberships drop constraint community_memberships_role_check;
alter table public.community_memberships
  add constraint community_memberships_role_check
  check (role in ('owner', 'moderator', 'member'));

-- Quem gerencia a comunidade: dono ou moderador.
create or replace function public.is_community_manager(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_memberships
    where community_id = p_community_id
      and user_id = auth.uid()
      and role in ('owner', 'moderator')
  );
$$;

-- Regras de escrita em communities que as colunas liberadas não cobrem.
create or replace function public.guard_community_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- O pedido sempre nasce pendente, em nome de quem está logado e sem dados
    -- de revisão nem contagem herdados do payload.
    new.status := 'pending';
    new.created_by := auth.uid();
    new.members_count := 0;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_reason := null;

    if not public.is_current_user_admin() then
      -- yourkurt é do site: fica para a comunidade oficial, criada por admin.
      if new.slug = 'yourkurt' then
        raise exception 'reserved_slug';
      end if;
      -- Freio contra spam de pedidos para a moderação.
      if (select count(*) from public.communities
          where created_by = auth.uid() and status = 'pending') >= 3 then
        raise exception 'too_many_pending_requests';
      end if;
    end if;
    return new;
  end if;

  if not public.is_current_user_admin() then
    if new.status is distinct from old.status then
      raise exception 'Only admins can change community status';
    end if;
    -- A única troca permitida é para nulo: é o set null da exclusão de conta.
    if new.created_by is not null and new.created_by is distinct from old.created_by then
      raise exception 'created_by is immutable';
    end if;
    -- reviewed_by também pode virar nulo: é o set null quando o revisor exclui a conta.
    if (new.reviewed_by is not null and new.reviewed_by is distinct from old.reviewed_by)
       or new.reviewed_at is distinct from old.reviewed_at
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Only admins can change community review data';
    end if;
    -- O slug reservado também não entra por update (pendente ou recusada).
    if new.slug = 'yourkurt' and new.slug is distinct from old.slug then
      raise exception 'reserved_slug';
    end if;
    -- Depois de aprovada, o nome e o slug aparecem em links e menções.
    if old.status = 'approved'
       and (new.name is distinct from old.name or new.slug is distinct from old.slug) then
      raise exception 'community_name_locked';
    end if;
  end if;
  return new;
end;
$$;

-- members_count: mantido por trigger, pois ninguém altera essa coluna direto.
create or replace function public.sync_community_members_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set members_count = members_count + 1
    where id = new.community_id;
  else
    -- Se a comunidade foi apagada em cascata, não há linha para atualizar.
    update public.communities set members_count = greatest(members_count - 1, 0)
    where id = old.community_id;
  end if;
  return null;
end;
$$;

create trigger community_memberships_sync_count
after insert or delete on public.community_memberships
for each row execute function public.sync_community_members_count();

-- Posse: quando o dono sai (hoje, só ao excluir a conta), a comunidade passa
-- ao moderador mais antigo e, sem moderador, ao membro mais antigo. Sem
-- ninguém, fica sem dono até o site intervir.
create or replace function public.transfer_community_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> 'owner' then
    return null;
  end if;
  -- Na exclusão em cascata da própria comunidade não há mais a quem passar.
  if not exists (select 1 from public.communities where id = old.community_id) then
    return null;
  end if;

  update public.community_memberships
  set role = 'owner'
  where id = (
    select id from public.community_memberships
    where community_id = old.community_id
    order by (role = 'moderator') desc, joined_at, id
    limit 1
  );
  return null;
end;
$$;

create trigger community_memberships_transfer_ownership
after delete on public.community_memberships
for each row execute function public.transfer_community_ownership();

-- Privilégios por coluna: quem escreve direto só mexe no conteúdo da
-- comunidade. Status, contagem e revisão ficam com triggers e funções.
revoke insert, update on public.communities from authenticated;
grant insert (name, slug, description, theme, avatar_url, header_url)
  on public.communities to authenticated;
grant update (name, slug, description, theme, avatar_url, header_url)
  on public.communities to authenticated;

-- Só o dono edita a comunidade (em qualquer status); moderador não.
drop policy communities_update_manager on public.communities;
create policy communities_update_owner on public.communities
for update to authenticated
using (public.is_community_owner(id))
with check (public.is_community_owner(id));

-- Papéis só mudam pelo admin do site por enquanto; promover moderador pelo
-- dono fica para uma parte seguinte.
drop policy community_memberships_update on public.community_memberships;
create policy community_memberships_update_admin on public.community_memberships
for update to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Cada um sai por conta própria, menos o dono. Moderador expulsar membro
-- fica para a parte 4.
drop policy community_memberships_delete on public.community_memberships;
create policy community_memberships_delete on public.community_memberships
for delete to authenticated
using (
  (user_id = auth.uid() and role <> 'owner')
  or public.is_current_user_admin()
);

-- Índice do feed da comunidade: filtra por comunidade e ordena por data.
drop index public.posts_community_id_idx;
create index posts_community_created_idx
  on public.posts (community_id, created_at desc, id desc)
  where community_id is not null;

-- Excluir a conta não é bloqueado por comunidades: a posse passa a outra pessoa
-- (trigger acima). Só os bloqueios de páginas de time continuam, até os times
-- saírem numa parte seguinte. Mesmos grants da definição anterior.
create or replace function public.check_my_account_deletable()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if public.is_current_user_super_admin() then
    raise exception 'super_admin_cannot_delete';
  end if;

  if exists (select 1 from public.team_pages where created_by = v_user_id)
     or exists (
       select 1 from public.team_memberships m
       where m.user_id = v_user_id
         and m.role = 'owner'
         and not exists (
           select 1 from public.team_memberships o
           where o.team_page_id = m.team_page_id
             and o.role = 'owner'
             and o.user_id <> v_user_id
         )
     ) then
    raise exception 'owns_resources';
  end if;
end;
$$;

revoke all on function public.check_my_account_deletable() from public, anon;
grant execute on function public.check_my_account_deletable() to authenticated;
