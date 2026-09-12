"use client";

import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { createClient } from "@/lib/supabase/client";
import {
  BellIcon,
  ChatIcon,
  MegaphoneIcon,
  LockOpenIcon,
  GearSixIcon,
  HouseIcon,
  LockKeyIcon,
  SignOutIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type TeamPageItem = {
  id: string;
  name: string;
  slug: string;
};

type TeamPageMember = {
  id: string;
  user_id: string;
  role: string;
  can_post: boolean;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type TeamPageMembersMap = Record<string, TeamPageMember[]>;

const NAV_ITEMS = [
  {
    label: "Feed",
    to: "/",
    icon: HouseIcon,
  },
  {
    label: "Perfil",
    to: "/perfil",
    icon: UserIcon,
  },
  {
    label: "Amigos",
    to: "/friends",
    icon: UsersIcon,
  },
  {
    label: "Comunidade",
    to: "/communities",
    icon: UsersFourIcon,
  },
  {
    label: "Mensagens",
    to: "/messages",
    icon: ChatIcon,
  },
  {
    label: "Configurações",
    to: "/settings",
    icon: GearSixIcon,
  },
];

const PROFILE_LINKS = [
  {
    text: "Feed",
    redirect: "/",
    icon: HouseIcon,
  },
  {
    text: "Perfil",
    redirect: "/perfil",
    icon: UserIcon,
  },
  {
    text: "Amigos",
    redirect: "/friends",
    icon: UsersIcon,
  },
  {
    text: "Comunidade",
    redirect: "/communities",
    icon: UsersFourIcon,
  },
  {
    text: "Mensagens",
    redirect: "/messages",
    icon: ChatIcon,
  },
  {
    text: "Configurações",
    redirect: "/settings",
    icon: GearSixIcon,
  },
];

function SettingsCard({
  title,
  subtitle,
  icon,
  actionText,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actionText: string;
}) {
  return (
    <div className="rounded-xl border border-border-base bg-background-raised p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
          {icon}
        </span>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-subtitle">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        className="rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background"
      >
        {actionText}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile } = useCurrentProfile();
  const [hasMounted, setHasMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [teamAvatarUrl, setTeamAvatarUrl] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamPages, setTeamPages] = useState<TeamPageItem[]>([]);
  const [teamMembersByPage, setTeamMembersByPage] = useState<TeamPageMembersMap>({});

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    async function loadTeamPages() {
      if (!profile?.id || !profile.isAdmin) {
        setTeamPages([]);
        setTeamMembersByPage({});
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("team_memberships")
        .select("team_pages(id, name, slug), role, can_post")
        .eq("user_id", profile.id);

      if (!data) {
        setTeamPages([]);
        setTeamMembersByPage({});
        return;
      }

      const mapped: TeamPageItem[] = [];

      data.forEach((row) => {
        const rawTeam = Array.isArray(row.team_pages)
          ? row.team_pages[0]
          : row.team_pages;

        if (!rawTeam) return;

        if (row.role !== "owner" && row.role !== "admin") {
          return;
        }

        mapped.push({
          id: rawTeam.id,
          name: rawTeam.name,
          slug: rawTeam.slug,
        });
      });

      setTeamPages(mapped);
    }

    void loadTeamPages();
  }, [profile?.id, profile?.isAdmin]);

  useEffect(() => {
    async function loadTeamMembers() {
      if (!profile?.id || !profile.isAdmin || teamPages.length === 0) {
        setTeamMembersByPage({});
        return;
      }

      const supabase = createClient();
      const teamPageIds = teamPages.map((page) => page.id);

      const { data, error } = await supabase
        .from("team_memberships")
        .select("id, team_page_id, user_id, role, can_post")
        .in("team_page_id", teamPageIds);

      if (error || !data) {
        setTeamMembersByPage({});
        return;
      }

      const userIds = [...new Set(data.map((row) => row.user_id))];

      const profilesById = new Map<string, { name: string | null; username: string | null; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url")
          .in("id", userIds);

        (profilesData ?? []).forEach((row) => {
          profilesById.set(row.id, {
            name: row.name,
            username: row.username,
            avatar_url: row.avatar_url,
          });
        });
      }

      const nextMembersByPage: TeamPageMembersMap = {};

      data.forEach((row) => {
        const profileInfo = profilesById.get(row.user_id);

        const item: TeamPageMember = {
          id: row.id,
          user_id: row.user_id,
          role: row.role,
          can_post: Boolean(row.can_post),
          name: profileInfo?.name ?? null,
          username: profileInfo?.username ?? null,
          avatar_url: profileInfo?.avatar_url ?? null,
        };

        if (!nextMembersByPage[row.team_page_id]) {
          nextMembersByPage[row.team_page_id] = [];
        }

        nextMembersByPage[row.team_page_id].push(item);
      });

      setTeamMembersByPage(nextMembersByPage);
    }

    void loadTeamMembers();
  }, [profile?.id, profile?.isAdmin, teamPages]);

  const canManageTeamPages = hasMounted && Boolean(profile?.isAdmin);

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleCreateTeamPage() {
    if (!profile?.id || !profile.isAdmin || isCreatingTeam) return;

    const cleanName = teamName.trim();
    const cleanSlug = normalizeSlug(teamSlug || teamName);

    if (!cleanName || !cleanSlug) {
      setTeamMessage("Informe um nome valido para a equipe.");
      return;
    }

    setIsCreatingTeam(true);
    setTeamMessage("");

    try {
      const supabase = createClient();
      const { data: pageData, error: pageError } = await supabase
        .from("team_pages")
        .insert({
          name: cleanName,
          slug: cleanSlug,
          avatar_url: teamAvatarUrl.trim() || null,
          created_by: profile.id,
        })
        .select("id, name, slug")
        .single();

      if (pageError || !pageData) {
        throw new Error(pageError?.message || "Nao foi possivel criar a equipe.");
      }

      const { error: membershipError } = await supabase.from("team_memberships").insert({
        team_page_id: pageData.id,
        user_id: profile.id,
        role: "owner",
        can_post: true,
      });

      if (membershipError) {
        throw new Error(membershipError.message || "Nao foi possivel vincular voce a equipe.");
      }

      setTeamPages((prev) => [...prev, pageData]);
      setTeamName("");
      setTeamSlug("");
      setTeamAvatarUrl("");
      setTeamMessage("Equipe criada. Agora voce ja pode postar em nome dela.");
    } catch (error) {
      setTeamMessage(error instanceof Error ? error.message : "Erro ao criar equipe.");
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function handleTeamMemberPermissionChange(
    teamPageId: string,
    member: TeamPageMember,
    nextValues: { can_post?: boolean; role?: string },
  ) {
    const nextCanPost = nextValues.can_post ?? member.can_post;
    const nextRole = nextValues.role ?? member.role;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("set_team_member_permissions", {
        p_team_page_id: teamPageId,
        p_user_id: member.user_id,
        p_can_post: nextCanPost,
        p_role: nextRole,
      });

      if (error) {
        throw new Error(error.message || "Nao foi possivel atualizar permissões do membro.");
      }

      const updated = data as { id: string; user_id: string; role: string; can_post: boolean } | null;

      if (!updated) {
        throw new Error("Resposta vazia da atualização de permissões.");
      }

      setTeamMembersByPage((prev) => ({
        ...prev,
        [teamPageId]: (prev[teamPageId] ?? []).map((item) =>
          item.id === member.id
            ? {
                ...item,
                role: updated.role,
                can_post: Boolean(updated.can_post),
              }
            : item,
        ),
      }));

      setTeamMessage("Permissões do membro atualizadas com sucesso.");
    } catch (error) {
      setTeamMessage(
        error instanceof Error ? error.message : "Erro ao atualizar permissões do membro.",
      );
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setLogoutError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Erro ao sair da conta.",
      );
    } finally {
      setIsSigningOut(false);
    }
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
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />

        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-2xl bg-background-raised border border-border-base p-6 md:p-8 flex flex-col gap-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  Configurações
                </h1>
                <p className="text-subtitle mt-1">
                  Ajuste preferências da sua conta e personalize sua experiência.
                </p>
              </div>
              <span className="hidden md:inline-flex text-xs uppercase font-bold tracking-wider text-foreground-brand bg-background px-3 py-2 rounded-full">
                Conta
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Aparência
              </h2>
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Privacidade e Segurança
              </h2>
              <SettingsCard
                title="Privacidade do perfil"
                subtitle="Controle quem pode ver suas publicações e informações pessoais."
                actionText="Gerenciar"
                icon={<ShieldCheckIcon size={18} weight="fill" />}
              />
              <SettingsCard
                title="Senha e autenticação"
                subtitle="Atualize sua senha e fortaleça sua segurança de acesso."
                actionText="Atualizar"
                icon={<LockKeyIcon size={18} weight="fill" />}
              />
              <SettingsCard
                title="Notificações"
                subtitle="Defina quando e como você deseja ser notificado."
                actionText="Configurar"
                icon={<BellIcon size={18} weight="fill" />}
              />

              {profile?.isSuperAdmin && (
                <Link
                  href="/gerenciamento-usuarios"
                  className="rounded-xl border border-border-base bg-background-raised p-4 flex items-start justify-between gap-4 hover:bg-background transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
                      <LockOpenIcon size={18} weight="fill" />
                    </span>
                    <div className="flex flex-col">
                      <h3 className="text-base font-semibold text-foreground">Gerenciamento de Usuários</h3>
                      <p className="text-sm text-subtitle">
                        Gerencie permissões de usuários e ações administrativas críticas.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground">
                    Abrir
                  </span>
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Equipes e Paginas
              </h2>

              <div className="rounded-xl border border-border-base bg-background-raised p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
                    <MegaphoneIcon size={18} weight="fill" />
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-foreground">Criar equipe para publicacoes</h3>
                    <p className="text-sm text-subtitle">
                      Crie uma pagina (ex.: marketing) e publique no nome dela.
                    </p>
                  </div>
                </div>

                {!canManageTeamPages && (
                  <p className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-subtitle">
                    Sua conta e de usuario comum. Apenas administradores podem criar equipes e publicar.
                  </p>
                )}

                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nome da equipe"
                    disabled={!canManageTeamPages}
                    className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    value={teamSlug}
                    onChange={(e) => setTeamSlug(e.target.value)}
                    placeholder="Slug (ex.: time-marketing)"
                    disabled={!canManageTeamPages}
                    className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <input
                  value={teamAvatarUrl}
                  onChange={(e) => setTeamAvatarUrl(e.target.value)}
                  placeholder="URL do avatar da pagina (opcional)"
                  disabled={!canManageTeamPages}
                  className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCreateTeamPage}
                    disabled={isCreatingTeam || !canManageTeamPages}
                    className="rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-70"
                  >
                    {isCreatingTeam ? "Criando..." : "Criar equipe"}
                  </button>

                  <span className="text-xs text-subtitle">{teamPages.length} equipe(s) com permissao de postagem</span>
                </div>

                {teamPages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {teamPages.map((page) => (
                      <span
                        key={page.id}
                        className="rounded-full border border-border-base bg-background px-3 py-1 text-xs text-foreground"
                      >
                        {page.name} (@{page.slug})
                      </span>
                    ))}
                  </div>
                )}

                {teamMessage && (
                  <p className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
                    {teamMessage}
                  </p>
                )}

                {teamPages.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                      Permissões da equipe
                    </h3>

                    {teamPages.map((page) => {
                      const pageMembers = teamMembersByPage[page.id] ?? [];

                      return (
                        <div
                          key={page.id}
                          className="rounded-xl border border-border-base bg-background px-3 py-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{page.name}</p>
                              <p className="text-xs text-subtitle">@{page.slug}</p>
                            </div>
                            <span className="text-[11px] uppercase tracking-wider text-subtitle">
                              {pageMembers.length} membro(s)
                            </span>
                          </div>

                          {pageMembers.length === 0 ? (
                            <p className="text-sm text-subtitle">
                              Nenhum membro vinculado ainda.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {pageMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex flex-col gap-2 rounded-lg border border-border-base bg-background-raised p-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {member.name ?? "Usuário sem nome"}
                                    </p>
                                    <p className="text-xs text-subtitle">
                                      {member.username ? `@${member.username}` : "Perfil sem username"}
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                    <select
                                      value={member.role}
                                      onChange={(event) =>
                                        void handleTeamMemberPermissionChange(page.id, member, {
                                          role: event.target.value,
                                        })
                                      }
                                      className="rounded-lg border border-border-base bg-background px-2 py-1.5 text-xs text-foreground"
                                    >
                                      <option value="owner">Owner</option>
                                      <option value="admin">Admin</option>
                                      <option value="editor">Editor</option>
                                      <option value="member">Member</option>
                                    </select>

                                    <label className="flex items-center gap-2 text-xs text-subtitle">
                                      <input
                                        type="checkbox"
                                        checked={member.can_post}
                                        onChange={(event) =>
                                          void handleTeamMemberPermissionChange(page.id, member, {
                                            can_post: event.target.checked,
                                          })
                                        }
                                        className="h-4 w-4 rounded border-border-base"
                                      />
                                      Pode postar
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Sessao
              </h2>

              <div className="rounded-xl border border-border-base bg-background-raised p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
                    <SignOutIcon size={18} weight="fill" />
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-foreground">Sair da conta</h3>
                    <p className="text-sm text-subtitle">
                      Encerre sua sessao neste dispositivo com seguranca.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-70"
                >
                  {isSigningOut ? "Saindo..." : "Sair"}
                </button>
              </div>

              {logoutError && (
                <p className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
                  {logoutError}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
