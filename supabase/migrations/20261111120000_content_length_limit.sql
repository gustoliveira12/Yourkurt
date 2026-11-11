-- Aplica no banco o limite de 2.500 caracteres de posts e comentários,
-- que até agora existia apenas no maxLength dos textareas do frontend.
-- Manter em sincronia com MAX_CONTENT_LENGTH em frontend/lib/constants.ts.
--
-- NOT VALID + VALIDATE: a constraint passa a valer na hora para novas escritas
-- e a checagem das linhas existentes não bloqueia escritas na tabela.

alter table public.posts
  add constraint posts_content_length
  check (char_length(content) <= 2500) not valid;

alter table public.comments
  add constraint comments_content_length
  check (char_length(content) <= 2500) not valid;

alter table public.posts validate constraint posts_content_length;
alter table public.comments validate constraint comments_content_length;
