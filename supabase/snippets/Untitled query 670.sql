-- 1) Funções que o anon ainda consegue executar. Esperado: nenhuma linha.
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and has_function_privilege('anon', p.oid, 'EXECUTE');