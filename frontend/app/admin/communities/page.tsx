"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { COMMUNITY_COLUMNS, type Community, themeLabel } from "@/lib/communities";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { profileHref } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PendingCommunity = Community & {
  creator: { name: string | null; username: string | null; avatar_url: string | null } | null;
};

const supabase = createClient();
const REASON_MIN = 5;
const REASON_MAX = 500;

const REVIEW_ERRORS: Record<string, string> = {
  not_admin: "Apenas administradores podem analisar pedidos.",
  community_not_pending: "Este pedido já foi analisado.",
  rejection_reason_required: `Informe um motivo de ${REASON_MIN} a ${REASON_MAX} caracteres.`,
};

export default function AdminCommunitiesPage() {
  const { profile, loading: profileLoading, error: profileError } = useCurrentProfile();
  const isAdmin = !!profile?.isAdmin;
  const [requests, setRequests] = useState<PendingCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function load() {
      const { data, error: queryError } = await supabase
        .from("communities")
        .select(`${COMMUNITY_COLUMNS}, creator:profiles!communities_created_by_fkey(name, username, avatar_url)`)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .returns<PendingCommunity[]>();
      if (!active) return;
      if (queryError) {
        console.error("Erro ao carregar pedidos de comunidades:", queryError);
        setError("Não foi possível carregar os pedidos. Tente novamente.");
      } else {
        setRequests(data);
      }
      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [isAdmin]);

  async function review(request: PendingCommunity, approve: boolean) {
    if (busyId) return;
    const trimmed = reason.trim();
    if (!approve && (trimmed.length < REASON_MIN || trimmed.length > REASON_MAX)) {
      setActionError(REVIEW_ERRORS.rejection_reason_required);
      return;
    }
    setBusyId(request.id);
    setActionError("");
    setStatus("");

    const { error: rpcError } = await supabase.rpc("review_community", {
      p_community_id: request.id,
      p_approve: approve,
      p_reason: approve ? null : trimmed,
    });

    if (rpcError) {
      console.error("Erro ao analisar o pedido:", rpcError);
      setActionError(REVIEW_ERRORS[rpcError.message] ?? "Não foi possível analisar o pedido. Tente novamente.");
      // Se o pedido já foi analisado por outra pessoa, ele sai da lista.
      if (rpcError.message === "community_not_pending") {
        setRequests((previous) => previous.filter((item) => item.id !== request.id));
        setRejectingId(null);
        setReason("");
      }
    } else {
      setRequests((previous) => previous.filter((item) => item.id !== request.id));
      setRejectingId(null);
      setReason("");
      setStatus(approve ? `Comunidade "${request.name}" aprovada.` : `Pedido "${request.name}" recusado.`);
      // O botão clicado sai da tela com o pedido; o foco vai para a mensagem.
      setTimeout(() => statusRef.current?.focus(), 0);
    }
    setBusyId(null);
  }

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
            <div className="border-b border-border-base px-5 py-5">
              <h1 className="text-xl font-black text-foreground">Pedidos de comunidades</h1>
            </div>

            <p ref={statusRef} tabIndex={-1} role="status" className={status ? "px-5 py-3 text-sm text-foreground outline-none" : "sr-only"}>{status}</p>
            {actionError && <p role="alert" className="px-5 py-3 text-sm text-red-600">{actionError}</p>}

            {profileLoading ? (
              <p className="px-5 py-8 text-center text-subtitle">Carregando...</p>
            ) : !profile ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-red-600">
                {profileError ? "Não foi possível carregar seu usuário." : "Entre para continuar."}
              </p>
            ) : !isAdmin ? (
              <p className="px-5 py-8 text-center text-subtitle">Acesso restrito a administradores.</p>
            ) : (
              <>
                {error && <p role="alert" className="px-5 py-3 text-sm text-red-600">{error}</p>}
                {loading ? (
                  <p className="px-5 py-8 text-center text-subtitle">Carregando pedidos...</p>
                ) : !error && requests.length === 0 ? (
                  <p className="px-5 py-8 text-center text-subtitle">Nenhum pedido aguardando análise.</p>
                ) : (
                  <ul className="space-y-3 px-5 py-5">
                    {requests.map((request) => {
                      const rejecting = rejectingId === request.id;
                      const reasonId = `reason-${request.id}`;
                      const creatorHref = profileHref(request.creator?.username);
                      return (
                        <li key={request.id} className="rounded-card border border-border-base p-4">
                          <div className="flex gap-3">
                            <Avatar src={request.avatar_url} name={request.name} />
                            <div className="min-w-0 flex-1 text-sm">
                              <p className="font-bold text-foreground">
                                {request.name} <span className="font-normal text-subtitle">c/{request.slug}</span>
                              </p>
                              <p className="text-subtitle">{themeLabel(request.theme)}</p>
                              {request.description && (
                                <p className="mt-2 whitespace-pre-wrap break-words text-foreground">{request.description}</p>
                              )}
                              <p className="mt-2 text-subtitle">
                                Pedido por{" "}
                                {creatorHref ? (
                                  <Link
                                    href={creatorHref}
                                    className="font-semibold text-foreground hover:underline"
                                  >
                                    {request.creator?.name || request.creator?.username}
                                  </Link>
                                ) : (
                                  <span className="font-semibold text-foreground">{request.creator?.name || "Usuário"}</span>
                                )}{" "}
                                em{" "}
                                <time dateTime={request.created_at}>
                                  {new Date(request.created_at).toLocaleString("pt-BR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </time>
                              </p>
                            </div>
                          </div>

                          {rejecting ? (
                            <div className="mt-3">
                              <label htmlFor={reasonId} className="block text-sm font-semibold text-foreground">
                                Motivo da recusa (será mostrado a quem pediu)
                              </label>
                              <textarea
                                id={reasonId}
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                required
                                minLength={REASON_MIN}
                                maxLength={REASON_MAX}
                                rows={3}
                                className="mt-1 w-full rounded-control border border-border-base bg-background px-3 py-2 text-sm text-foreground"
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => void review(request, false)}
                                  disabled={busyId !== null}
                                  className="rounded-full px-4 py-1.5 text-xs font-bold btn-gradient hover:brightness-110 disabled:opacity-60"
                                >
                                  Confirmar recusa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setRejectingId(null); setReason(""); setActionError(""); }}
                                  disabled={busyId !== null}
                                  className="rounded-full border border-border-base px-4 py-1.5 text-xs font-bold text-foreground hover:bg-background-raised disabled:opacity-60"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => void review(request, true)}
                                disabled={busyId !== null}
                                className="rounded-full px-4 py-1.5 text-xs font-bold btn-gradient hover:brightness-110 disabled:opacity-60"
                              >
                                Aprovar
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectingId(request.id); setReason(""); setActionError(""); }}
                                disabled={busyId !== null}
                                className="rounded-full border border-border-base px-4 py-1.5 text-xs font-bold text-foreground hover:bg-background-raised disabled:opacity-60"
                              >
                                Recusar
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
