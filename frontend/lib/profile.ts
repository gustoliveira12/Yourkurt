// Endereço do perfil público de um usuário. A página /u/<username>
// redireciona para /perfil quando é o próprio usuário. O endereço antigo
// /perfil/<username> redireciona para este.
export function profileHref(username?: string | null) {
  return username ? `/u/${encodeURIComponent(username)}` : null;
}
