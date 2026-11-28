import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export type CommunityTheme =
  | "estudos"
  | "tecnologia"
  | "games"
  | "esportes"
  | "musica"
  | "carreira"
  | "avisos_espro";

export const COMMUNITY_THEMES: readonly { value: CommunityTheme; label: string }[] = [
  { value: "estudos", label: "Estudos" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "games", label: "Games" },
  { value: "esportes", label: "Esportes" },
  { value: "musica", label: "Música" },
  { value: "carreira", label: "Carreira" },
  { value: "avisos_espro", label: "Avisos do Espro" },
];

export function themeLabel(theme: CommunityTheme): string {
  return COMMUNITY_THEMES.find((item) => item.value === theme)?.label ?? theme;
}

export type CommunityStatus = "pending" | "approved" | "rejected";

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  header_url: string | null;
  theme: CommunityTheme;
  status: CommunityStatus;
  members_count: number;
  created_by: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export const COMMUNITY_COLUMNS =
  "id, name, slug, description, avatar_url, header_url, theme, status, members_count, created_by, rejection_reason, created_at";

// Os limites espelham as constraints da tabela `communities`.
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const NAME_MIN = 3;
export const NAME_MAX = 80;
export const SLUG_MIN = 3;
export const SLUG_MAX = 40;
export const DESCRIPTION_MAX = 500;

// Para busca: sem acento e sem diferença entre maiúsculas e minúsculas.
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    // O corte pode deixar um hífen na ponta.
    .replace(/-+$/g, "");
}

export function communityHref(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}

export type CommunityBadgeKind = "owner" | "moderator" | "admin";

export const BADGE_LABEL: Record<CommunityBadgeKind, string> = {
  owner: "Dono",
  moderator: "Moderador",
  admin: "Admin",
};

/** Etiquetas por comunidade e pessoa. A chave é `${community_id}:${user_id}`. */
export async function fetchCommunityBadges(
  supabase: SupabaseClient,
  communityIds: string[],
  userIds: string[],
): Promise<Map<string, CommunityBadgeKind>> {
  const badges = new Map<string, CommunityBadgeKind>();
  if (communityIds.length === 0 || userIds.length === 0) return badges;

  const { data, error } = await supabase.rpc("get_community_badges", {
    p_community_ids: communityIds,
    p_user_ids: userIds,
  });
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as { community_id: string; user_id: string; badge: CommunityBadgeKind }[]) {
    badges.set(`${row.community_id}:${row.user_id}`, row.badge);
  }
  return badges;
}
