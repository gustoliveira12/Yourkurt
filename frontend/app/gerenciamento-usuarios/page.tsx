"use client";

import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { createClient } from "@/lib/supabase/client";
import {
  ChatIcon,
  GearSixIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string;
};

type RoleFilter = "all" | "user" | "admin" | "super_admin";
type SortBy = "created_desc" | "created_asc" | "name_asc" | "role_desc";

const NAV_ITEMS = [
  { label: "Feed", to: "/", icon: HouseIcon },
  { label: "Perfil", to: "/perfil", icon: UserIcon },
  { label: "Amigos", to: "/friends", icon: UsersIcon },
  { label: "Comunidade", to: "/communities", icon: UsersFourIcon },
  { label: "Mensagens", to: "/messages", icon: ChatIcon },
  { label: "Configurações", to: "/settings", icon: GearSixIcon },
];

const PROFILE_LINKS = [
  { text: "Feed", redirect: "/", icon: HouseIcon },
  { text: "Perfil", redirect: "/perfil", icon: UserIcon },
  { text: "Amigos", redirect: "/friends", icon: UsersIcon },
  { text: "Comunidade", redirect: "/communities", icon: UsersFourIcon },
  { text: "Mensagens", redirect: "/messages", icon: ChatIcon },
  { text: "Configurações", redirect: "/settings", icon: GearSixIcon },
];

export default function SuperAdminPage() {
  const { profile, loading: loadingProfile } = useCurrentProfile();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_desc");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all"
          ? true
          : roleFilter === "super_admin"
            ? user.is_super_admin
            : roleFilter === "admin"
              ? user.is_admin && !user.is_super_admin
              : !user.is_admin && !user.is_super_admin;

      if (!matchesRole) return false;

      if (!normalizedQuery) return true;

      const stack = [
        user.name ?? "",
        user.username ?? "",
        user.email ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return stack.includes(normalizedQuery);
    });
  }, [users, searchTerm, roleFilter]);

  const visibleUsers = useMemo(() => {
    const sorted = [...filteredUsers];

    if (sortBy === "created_asc") {
      sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      return sorted;
    }

    if (sortBy === "name_asc") {
      sorted.sort((a, b) => {
        const aName = (a.name ?? a.username ?? "").toLowerCase();
        const bName = (b.name ?? b.username ?? "").toLowerCase();
        return aName.localeCompare(bName, "pt-BR");
      });
      return sorted;
    }

    if (sortBy === "role_desc") {
      const score = (user: ManagedUser) =>
        user.is_super_admin ? 3 : user.is_admin ? 2 : 1;

      sorted.sort((a, b) => score(b) - score(a));
      return sorted;
    }

    sorted.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted;
  }, [filteredUsers, sortBy]);

  useEffect(() => {
    async function loadUsers() {
      if (!profile?.isSuperAdmin) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }

      setLoadingUsers(true);
      setStatusMessage("");

      const supabase = createClient();
      const { data, error } = await supabase.rpc("list_manageable_users");

      if (error) {
        setStatusMessage(error.message || "Erro ao carregar usuários.");
        setUsers([]);
        setLoadingUsers(false);
        return;
      }

      setUsers((data as ManagedUser[]) ?? []);
      setLoadingUsers(false);
    }

    void loadUsers();
  }, [profile?.isSuperAdmin]);

  async function updatePermissions(user: ManagedUser, next: { isAdmin: boolean; isSuperAdmin: boolean }) {
    if (!profile?.isSuperAdmin || busyUserId) return;

    setBusyUserId(user.id);
    setStatusMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_user_admin_permissions", {
      p_target_user_id: user.id,
      p_is_admin: next.isAdmin,
      p_is_super_admin: next.isSuperAdmin,
    });

    if (error) {
      setStatusMessage(error.message || "Erro ao atualizar permissões.");
      setBusyUserId(null);
      return;
    }

    const updated = data as ManagedUser;

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              is_admin: updated.is_admin,
              is_super_admin: updated.is_super_admin,
            }
          : item,
      ),
    );

    setStatusMessage("Permissões atualizadas com sucesso.");
    setBusyUserId(null);
  }

  if (loadingProfile) {
    return <div className="p-8 text-subtitle">Carregando...</div>;
  }

  if (!profile?.isSuperAdmin) {
    return (
      <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
        <PageAside items={NAV_ITEMS} />
        <MobileHeader />

        <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
          <ProfileSidebar
            alt="Foto de perfil"
            size={1}
            prop={PROFILE_LINKS}
            name={profile?.name ?? "Usuario"}
            at={profile?.username ?? "usuario"}
            src={profile?.avatarUrl ?? null}
            headerUrl={profile?.headerUrl}
          />

          <section className="w-full max-w-3xl px-3 md:px-4 pb-24 sm:pb-10">
            <div className="rounded-2xl border border-border-base bg-background-raised p-6">
              <h1 className="text-2xl font-black text-foreground">Acesso restrito</h1>
              <p className="mt-2 text-subtitle">
                Este painel é exclusivo para administradores autorizados.
              </p>
              <Link
                href="/settings"
                className="inline-flex mt-4 rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background"
              >
                Voltar para Configurações
              </Link>
            </div>
          </section>
        </main>

        <MobileNav />
      </div>
    );
  }

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />

      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          prop={PROFILE_LINKS}
          name={profile.name}
          at={profile.username}
          src={profile.avatarUrl ?? null}
          headerUrl={profile.headerUrl}
        />

        <section className="w-full max-w-5xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-2xl border border-border-base bg-background-raised p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Gerenciamento de Usuários</h1>
                <p className="mt-1 text-subtitle">
                  Gestão de usuários, papéis administrativos e permissões críticas.
                </p>
              </div>
              <span className="hidden md:inline-flex rounded-full border border-border-base px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                Administração
              </span>
            </div>

            {statusMessage && (
              <p className="mt-4 rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
                {statusMessage}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-border-base bg-background p-3 md:p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border-base bg-background-raised px-3 py-2 w-full md:max-w-md">
                <MagnifyingGlassIcon size={16} className="text-subtitle" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, @username ou email"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtitle"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="role-filter" className="text-xs font-bold uppercase tracking-wider text-subtitle">
                    Papel
                  </label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                    className="rounded-md border border-border-base bg-background-raised px-2 py-2 text-sm text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="user">Usuário</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort-by" className="text-xs font-bold uppercase tracking-wider text-subtitle">
                    Ordenar
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="rounded-md border border-border-base bg-background-raised px-2 py-2 text-sm text-foreground"
                  >
                    <option value="created_desc">Mais novos</option>
                    <option value="created_asc">Mais antigos</option>
                    <option value="name_asc">Nome A-Z</option>
                    <option value="role_desc">Papel (alto para baixo)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setSortBy("created_desc");
                  }}
                  className="rounded-md border border-border-base px-2 py-2 text-xs font-semibold text-foreground hover:bg-background"
                >
                  Limpar
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-subtitle">
              Mostrando {visibleUsers.length} de {users.length} usuário(s).
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-border-base">
              {loadingUsers ? (
                <div className="p-4 text-sm text-subtitle">Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div className="p-4 text-sm text-subtitle">Nenhum usuário encontrado.</div>
              ) : visibleUsers.length === 0 ? (
                <div className="p-4 text-sm text-subtitle">Nenhum usuário corresponde aos filtros atuais.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-background">
                    <tr className="text-left text-subtitle">
                      <th className="px-4 py-3 font-bold">Usuário</th>
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">Admin</th>
                      <th className="px-4 py-3 font-bold">Super Admin</th>
                      <th className="px-4 py-3 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((user) => {
                      const isBusy = busyUserId === user.id;

                      return (
                        <tr key={user.id} className="border-t border-border-base">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{user.name ?? "Sem nome"}</span>
                              <span className="text-subtitle">@{user.username ?? "usuario"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-subtitle">{user.email ?? "-"}</td>
                          <td className="px-4 py-3">
                            {user.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                                <ShieldCheckIcon size={12} weight="fill" />
                                Sim
                              </span>
                            ) : (
                              <span className="text-subtitle">Não</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.is_super_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                                <ShieldCheckIcon size={12} weight="fill" />
                                Sim
                              </span>
                            ) : (
                              <span className="text-subtitle">Não</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={isBusy || user.is_admin}
                                onClick={() => void updatePermissions(user, { isAdmin: true, isSuperAdmin: user.is_super_admin })}
                                className="rounded-md border border-border-base px-2 py-1 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50"
                              >
                                Tornar Admin
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || !user.is_admin}
                                onClick={() => void updatePermissions(user, { isAdmin: false, isSuperAdmin: false })}
                                className="rounded-md border border-border-base px-2 py-1 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50"
                              >
                                Remover Admin
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || user.is_super_admin}
                                onClick={() => void updatePermissions(user, { isAdmin: true, isSuperAdmin: true })}
                                className="rounded-md border border-border-base px-2 py-1 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50"
                              >
                                Tornar Super Admin
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
