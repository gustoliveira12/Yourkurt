-- 2) Grants do anon nas tabelas. Esperado: só "posts" com SELECT.
select table_name, string_agg(privilege_type, ',') as privs
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name;