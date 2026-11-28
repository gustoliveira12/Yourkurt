"use client";

import { CommunityCard } from "@/components/communities/CommunityCard";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import {
  COMMUNITY_COLUMNS,
  COMMUNITY_THEMES,
  type Community,
  type CommunityTheme,
  normalizeSearch,
} from "@/lib/communities";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { createClient } from "@/lib/supabase/client";
import { removeUserFiles } from "@/lib/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

const supabase = createClient();

export default function CommunitiesPage() {
  const { profile, loading: profileLoading, error: profileError } = useCurrentProfile();
  const userId = profile?.id;
  const [communities, setCommunities] = useState<Community[]>([]);
  const [requests, setRequests] = useState<Community[]>([]);
  const [memberIds, setMemberIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<CommunityTheme | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function load(id: string) {
      const [approved, memberships, mine] = await Promise.all([
        supabase
          .from("communities")
          .select(COMMUNITY_COLUMNS)
          .eq("status", "approved")
          .order("members_count", { ascending: false })
          .order("name")
          .returns<Community[]>(),
        supabase.from("community_memberships").select("community_id").eq("user_id", id),
        supabase
          .from("communities")
          .select(COMMUNITY_COLUMNS)
          .eq("created_by", id)
          .in("status", ["pending", "rejected"])
          .order("created_at", { ascending: false })
          .returns<Community[]>(),
      ]);
      if (!active) return;

      if (approved.error || memberships.error || mine.error) {
        console.error("Erro ao carregar comunidades:", approved.error ?? memberships.error ?? mine.error);
        setError("Não foi possível carregar as comunidades. Tente novamente.");
      } else {
        setCommunities(approved.data);
        setMemberIds(new Set(memberships.data.map((row) => row.community_id)));
        setRequests(mine.data);
      }
      setLoading(false);
    }

    void load(userId);
    return () => { active = false; };
  }, [userId]);

  async function removeRequest(request: Community) {
    const question = request.status === "pending"
      ? `Cancelar o pedido da comunidade "${request.name}"?`
      : `Apagar o pedido recusado da comunidade "${request.name}"?`;
    if (removingId || !window.confirm(question)) return;
    setRemovingId(request.id);
    setRequestError("");

    try {
      await removeUserFiles(supabase, "community-images", request.id);
      const { data: deleted, error: deleteError } = await supabase
        .from("communities")
        .delete()
        .eq("id", request.id)
        .select("id");
      if (deleteError) throw new Error(deleteError.message);
      // A RLS não gera erro quando filtra: se o pedido já foi aprovado ou
      // recusado, nenhuma linha é apagada e o pedido segue existindo.
      if (deleted.length === 0) throw new Error("Nenhuma linha apagada: o pedido mudou de status.");
      setRequests((previous) => previous.filter((item) => item.id !== request.id));
    } catch (removeError) {
      console.error("Erro ao remover o pedido:", removeError);
      setRequestError(
        `Não foi possível ${request.status === "pending" ? "cancelar" : "apagar"} o pedido. Atualize a página e tente de novo.`,
      );
    }
    setRemovingId(null);
  }

  const term = normalizeSearch(search.trim());
  const visible = communities.filter(
    (community) =>
      (theme === "all" || community.theme === theme) && normalizeSearch(community.name).includes(term),
  );
  const filterClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand ${
      active
        ? "border-transparent btn-gradient"
        : "border-border-base text-foreground hover:bg-background-raised"
    }`;

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-card overflow-hidden border border-border-base bg-surface shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-base px-5 py-5">
              <h1 className="text-xl font-black text-foreground">Comunidades</h1>
              <Link
                href="/communities/create"
                className="rounded-full px-4 py-2 text-sm font-bold btn-gradient hover:brightness-110"
              >
                Criar comunidade
              </Link>
            </div>

            {!userId && !profileLoading && (
              <p role="alert" className="px-5 py-8 text-center text-sm text-red-600">
                {profileError ? "Não foi possível carregar seu usuário." : "Entre para ver as comunidades."}
              </p>
            )}

            {requests.length > 0 && (
              <div className="border-b border-border-base px-5 py-4">
                <h2 className="mb-3 text-lg font-bold text-foreground">Seus pedidos</h2>
                {requestError && <p role="alert" className="mb-2 text-sm text-red-600">{requestError}</p>}
                <ul className="space-y-3">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-base p-3"
                    >
                      <div className="min-w-0 text-sm">
                        <p className="font-bold text-foreground">
                          {request.name} <span className="font-normal text-subtitle">c/{request.slug}</span>
                        </p>
                        <p className="text-subtitle">
                          {request.status === "pending" ? "Aguardando aprovação" : "Recusada"}
                        </p>
                        {request.status === "rejected" && request.rejection_reason && (
                          <p className="text-foreground">Motivo: {request.rejection_reason}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeRequest(request)}
                        disabled={removingId !== null}
                        className="rounded-full border border-border-base px-4 py-1.5 text-xs font-bold text-foreground hover:bg-background-raised disabled:opacity-60"
                      >
                        {request.status === "pending" ? "Cancelar pedido" : "Apagar"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {userId && (
              <div className="space-y-3 px-5 py-4">
                <div role="group" aria-label="Filtrar por tema" className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={theme === "all"}
                    onClick={() => setTheme("all")}
                    className={filterClass(theme === "all")}
                  >
                    Todos
                  </button>
                  {COMMUNITY_THEMES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={theme === item.value}
                      onClick={() => setTheme(item.value)}
                      className={filterClass(theme === item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="community-search" className="sr-only">Buscar comunidade por nome</label>
                  <input
                    id="community-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar comunidade por nome"
                    className="w-full rounded-control border border-border-base bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
            )}

            {error && <p role="alert" className="px-5 py-3 text-sm text-red-600">{error}</p>}
            {profileLoading || (userId && loading) ? (
              <p className="px-5 py-8 text-center text-subtitle">Carregando comunidades...</p>
            ) : userId && !error && communities.length === 0 ? (
              <p className="px-5 py-8 text-center text-subtitle">
                Nenhuma comunidade ainda. Que tal criar a primeira?
              </p>
            ) : userId && !error && visible.length === 0 ? (
              <p className="px-5 py-8 text-center text-subtitle">Nenhuma comunidade encontrada.</p>
            ) : (
              <ul className="space-y-3 px-5 pb-5">
                {visible.map((community) => (
                  <li key={community.id}>
                    <CommunityCard community={community} isMember={memberIds.has(community.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
