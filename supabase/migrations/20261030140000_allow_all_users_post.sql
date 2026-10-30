drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts
  for insert
  to authenticated
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
