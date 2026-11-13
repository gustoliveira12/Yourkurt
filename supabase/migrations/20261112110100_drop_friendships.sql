-- Amizade passou a ser derivada de follows (seguimento mútuo e aceito), então a
-- tabela friendships, com pedido e aceite próprios, deixa de existir.
-- Ela estava vazia em produção em 2026-11-12. Também resolve a falha da
-- revisão 03: qualquer pessoa criava uma amizade "aceita" sem consentimento.
-- Policies e índices da tabela saem junto com ela.
drop table if exists public.friendships;
