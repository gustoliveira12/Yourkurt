-- 3) Policies de notifications e team_pages.
select tablename, policyname, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('notifications', 'team_pages');