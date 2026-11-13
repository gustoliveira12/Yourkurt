import {
  type Icon,
  BellIcon,
  GearSixIcon,
  HouseIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";

export type NavItem = {
  to: string;
  icon: Icon;
  label: string;
  exact?: boolean;
  /** Fica fora da barra inferior do celular (o cabeçalho já tem o atalho). */
  desktopOnly?: boolean;
};

// Lista única de links do menu principal (lateral no computador e barra
// inferior no celular). Antes, cada página tinha a própria cópia.
export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", to: "/", icon: HouseIcon },
  { label: "Perfil", to: "/perfil", icon: UserIcon },
  { label: "Amigos", to: "/friends", icon: UsersIcon },
  { label: "Comunidade", to: "/communities", icon: UsersFourIcon },
  { label: "Configurações", to: "/settings", icon: GearSixIcon },
  { label: "Notificações", to: "/notificacoes", icon: BellIcon, desktopOnly: true },
];

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isPathActive(pathname: string, to: string, exact?: boolean): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(to);
  if (target === "/") return current === "/";
  if (exact) return current === target;
  return current === target || current.startsWith(`${target}/`);
}
