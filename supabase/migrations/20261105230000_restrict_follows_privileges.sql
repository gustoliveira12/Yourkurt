revoke all on public.follows from public, anon, authenticated;
grant select, insert, delete on public.follows to authenticated;
