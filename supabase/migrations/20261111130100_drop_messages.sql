-- A funcionalidade de mensagens foi descartada (decisão 01 da documentação
-- técnica). A tabela nunca foi usada pelo frontend.
-- Policies e índices da tabela são removidos junto com ela.
drop table if exists public.messages;
