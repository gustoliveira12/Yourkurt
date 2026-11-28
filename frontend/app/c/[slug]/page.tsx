"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import RightNavbar from "@/components/PostComposer";
import PostCard from "@/components/UserPost";
import { themeLabel } from "@/lib/communities";
import { useCommunity } from "@/lib/hooks/useCommunity";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { usePosts } from "@/lib/hooks/usePosts";
import Link from "next/link";
import { CheckIcon, CrownSimpleIcon, SignOutIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { useParams } from "next/navigation";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useCurrentProfile();
  const { community, role, loading, notFound, error, busy, join, leave } = useCommunity(slug);
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    addPost,
    deletePost,
    deletingPostId,
  } = usePosts({ communityId: community?.id ?? null });

  const members = community
    ? `${community.members_count} ${community.members_count === 1 ? "membro" : "membros"}`
    : "";
  const canPost = community?.status === "approved" && role !== null;

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-2">
      <PageAside />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-6 sm:pt-12 xl:pr-4">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <div className="flex min-w-0 max-w-174 flex-1 flex-col items-center md:px-3 pb-24 sm:pb-10">
        <section className="flex w-full max-w-2xl flex-col gap-4">
          {loading && <p className="py-8 text-center text-subtitle">Carregando comunidade...</p>}

          {!loading && notFound && (
            <div className="rounded-card border border-border-base bg-surface p-6 text-center shadow-card">
              <h1 className="text-xl font-black text-foreground">Comunidade não encontrada.</h1>
              <Link
                href="/communities"
                className="mt-3 inline-block font-semibold text-foreground-brand underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand"
              >
                Ver comunidades
              </Link>
            </div>
          )}

          {!loading && !community && !notFound && error && (
            <p role="alert" className="py-8 text-center text-sm text-red-600">{error}</p>
          )}

          {community && (
            <>
              <div className="mx-3 overflow-hidden rounded-card border border-border-base bg-surface shadow-card md:mx-0">
                {community.header_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={community.header_url} alt="" className="h-32 w-full object-cover sm:h-40" />
                ) : (
                  <div aria-hidden="true" className="h-32 w-full bg-linear-to-l from-purple-600 to-purple-300 sm:h-40" />
                )}
                <div className="flex flex-col gap-3 px-5 pb-5">
                  <div className="-mt-8 flex items-end justify-between gap-3">
                    {community.avatar_url ? (
                      <Avatar src={community.avatar_url} name={community.name} decorative />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-foreground-muted text-2xl font-bold text-foreground-inverted"
                      >
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {role === "owner" ? (
                      <span
                        title="Você é o dono desta comunidade"
                        className="btn-gradient inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold"
                      >
                        <CrownSimpleIcon size={16} weight="fill" aria-hidden="true" />
                        Dono
                      </span>
                    ) : community.status === "approved" && profile ? (
                      role ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Sair de c/${community.slug}?`)) void leave();
                          }}
                          disabled={busy}
                          aria-label={`Membro de c/${community.slug}. Ativar para sair da comunidade`}
                          className="group inline-flex min-w-52 items-center justify-center gap-1.5 rounded-full border border-border-base bg-background-raised px-5 py-2 text-sm font-bold text-foreground enabled:hover:border-red-700 enabled:hover:bg-red-600 enabled:hover:text-white enabled:focus-visible:border-red-700 enabled:focus-visible:bg-red-600 enabled:focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-busy={busy}
                        >
                          {busy ? (
                            <SpinnerGapIcon size={16} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              <CheckIcon size={16} weight="bold" aria-hidden="true" className="group-enabled:group-hover:hidden group-enabled:group-focus-visible:hidden" />
                              <SignOutIcon size={16} weight="bold" aria-hidden="true" className="hidden group-enabled:group-hover:block group-enabled:group-focus-visible:block" />
                            </>
                          )}
                          <span className="group-enabled:group-hover:hidden group-enabled:group-focus-visible:hidden">Membro</span>
                          <span className="hidden group-enabled:group-hover:inline group-enabled:group-focus-visible:inline">Sair da comunidade</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void join()}
                          disabled={busy}
                          aria-busy={busy}
                          className="btn-gradient inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy && <SpinnerGapIcon size={16} className="animate-spin" aria-hidden="true" />}
                          Entrar
                        </button>
                      )
                    ) : null}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-foreground">{community.name}</h1>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-subtitle">
                      <span>c/{community.slug}</span>
                      <span className="rounded-full border border-border-base bg-background-raised px-2 py-0.5 text-xs font-bold text-foreground-brand">
                        {themeLabel(community.theme)}
                      </span>
                      <span>{members}</span>
                    </p>
                  </div>
                  {community.description && <p className="text-sm text-foreground">{community.description}</p>}
                  {community.status === "pending" && (
                    <p role="status" className="rounded-sm border border-border-base bg-background-raised p-3 text-sm text-foreground">
                      Aguardando aprovação de um administrador.
                    </p>
                  )}
                  {community.status === "rejected" && (
                    <p role="status" className="rounded-sm border border-border-base bg-background-raised p-3 text-sm text-foreground">
                      Pedido recusado: {community.rejection_reason}
                    </p>
                  )}
                  {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                </div>
              </div>

              {canPost && (
                <RightNavbar
                  onPostCreated={addPost}
                  community={{ id: community.id, name: community.name, slug: community.slug }}
                  className="flex px-3 md:px-0"
                  fullWidth
                />
              )}

              {postsLoading && <p className="py-8 text-center text-foreground-muted">Carregando posts...</p>}
              {postsError && <p className="py-2 text-center text-sm text-red-600">{postsError}</p>}
              {!postsLoading && posts.length === 0 && (
                <p className="py-8 text-center text-foreground-muted">Nenhum post ainda nesta comunidade.</p>
              )}
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canDelete={
                    post.user_id === profile?.id ||
                    (Boolean(profile?.isAdmin) && post.community_id !== null)
                  }
                  deleting={deletingPostId === post.id}
                  onDelete={deletePost}
                  detailHref={`/post/${post.id}`}
                />
              ))}
            </>
          )}
        </section>
        </div>
        {/* Reserva a largura da coluna da direita da tela inicial para a coluna central ter a mesma largura do feed. */}
        <div aria-hidden="true" className="hidden w-80 shrink-0 xl:block" />
      </main>
      <MobileNav />
    </div>
  );
}
