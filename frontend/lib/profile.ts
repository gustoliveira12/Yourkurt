// Endereço do perfil público de um usuário. A página /perfil/<username>
// redireciona para /perfil quando é o próprio usuário.
export function profileHref(username?: string | null) {
  return username ? `/perfil/${encodeURIComponent(username)}` : null;
}
