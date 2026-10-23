alter table public.communities
  add constraint communities_slug_not_reserved_create
  check (slug <> 'create');

revoke all privileges
  on table public.communities, public.community_memberships
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.communities, public.community_memberships
  to authenticated;

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      (
        community_id is null
        and public.is_current_user_admin()
      )
      or (
        community_id is not null
        and exists (
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

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
  on public.posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
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
  )
  with check (
    auth.uid() = user_id
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
  );
