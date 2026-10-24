create or replace function public.prevent_community_membership_hijack()
returns trigger
language plpgsql
as $$
begin
  if old.user_id is distinct from new.user_id
     or old.community_id is distinct from new.community_id then
    raise exception 'Community membership identity cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_prevent_membership_hijack
on public.community_memberships;

create trigger tr_prevent_membership_hijack
before update on public.community_memberships
for each row
execute function public.prevent_community_membership_hijack();
