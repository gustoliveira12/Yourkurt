-- ============================================================
-- Yourkurt
-- Proteção das colunas sensíveis de profiles
-- ============================================================

-- Remove o UPDATE amplo de authenticated.
revoke update
on public.profiles
from authenticated;


-- Permite que o usuário altere somente os campos do próprio
-- perfil que são editáveis.
grant update (
  name,
  username,
  avatar_url,
  bio,
  email,
  birthday,
  location,
  website,
  profile_visibility,
  theme_preference,
  receive_product_updates,
  header_url
)
on public.profiles
to authenticated;