"use client";

import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { useInteractions } from "@/lib/hooks/useInteractions";
import { useComments, type CommentItem } from "@/lib/hooks/useComments";
import { type Post } from "@/lib/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeftIcon,
  CalendarDotsIcon,
  ChatCircleIcon,
  GlobeHemisphereWestIcon,
  MapPinIcon,
  PaperPlaneRightIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  { label: "Feed", to: "/", icon: UserIcon },
  { label: "Perfil", to: "/perfil", icon: UserIcon },
  { label: "Amigos", to: "/friends", icon: UsersIcon },
  { label: "Comunidade", to: "/communities", icon: UsersFourIcon },
  { label: "Mensagens", to: "/messages", icon: ChatCircleIcon },
  { label: "Configurações", to: "/settings", icon: UserIcon },
];

const PROFILE_LINKS = [
  { text: "Feed", redirect: "/", icon: UserIcon },
  { text: "Perfil", redirect: "/perfil", icon: UserIcon },
  { text: "Amigos", redirect: "/friends", icon: UsersIcon },
  { text: "Comunidade", redirect: "/communities", icon: UsersFourIcon },
  { text: "Mensagens", redirect: "/messages", icon: ChatCircleIcon },
  { text: "Configurações", redirect: "/settings", icon: UserIcon },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
  return `Há ${Math.floor(diff / 86400)} dias`;
}

function normalizeImages(post: Post | null) {
  if (!post) return [] as string[];

  return Array.isArray(post.image_urls) && post.image_urls.length > 0
    ? post.image_urls
    : post.image_url
      ? [post.image_url]
      : [];
}

function mapCommentToItem(comment: CommentItem): CommentItem {
  return comment;
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { profile } = useCurrentProfile();
  const { interactions, loading: interactionsLoading } = useInteractions(postId);
  const { comments, loading: commentsLoading, error: commentsError, addComment } =
    useComments(postId);
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerZoomed, setViewerZoomed] = useState(false);

  const postImages = useMemo(() => normalizeImages(post), [post]);

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setPostError("Post não encontrado.");
        setLoadingPost(false);
        return;
      }

      setLoadingPost(true);
      setPostError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, user_id, content, image_url, image_urls, created_at, likes_count, profiles(name, username, avatar_url)",
        )
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        setPostError(error.message);
        setPost(null);
        setLoadingPost(false);
        return;
      }

      if (!data) {
        setPostError("Post não encontrado.");
        setPost(null);
        setLoadingPost(false);
        return;
      }

      setPost({
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        image_urls:
          Array.isArray((data as Post).image_urls) && (data as Post).image_urls.length > 0
            ? (data as Post).image_urls
            : data.image_url
              ? [data.image_url]
              : [],
        created_at: data.created_at,
        likes_count: data.likes_count,
        profiles:
          data.profiles && Array.isArray(data.profiles)
            ? data.profiles[0]
            : data.profiles,
      });
      setLoadingPost(false);
    }

    void loadPost();
  }, [postId]);

  async function handleSubmitComment() {
    const trimmed = commentContent.trim();
    if (!trimmed || !post || !profile || submittingComment) return;

    setSubmittingComment(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        user_id: profile.id,
        content: trimmed,
      })
      .select("id, post_id, user_id, content, created_at, profiles(name, username, avatar_url)")
      .single();

    if (error) {
      setSubmittingComment(false);
      return;
    }

    const mappedComment = {
      id: data.id,
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      profiles:
        data.profiles && Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    } satisfies CommentItem;

    addComment(mapCommentToItem(mappedComment));
    setCommentContent("");
    setSubmittingComment(false);
  }

  const currentImage = viewerIndex !== null ? postImages[viewerIndex] : null;

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />

      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        {profile ? (
          <ProfileSidebar
            alt="Foto de perfil"
            size={1}
            prop={PROFILE_LINKS}
            name={profile.name}
            at={profile.username}
            src={profile.avatarUrl ?? null}
            headerUrl={profile.headerUrl}
          />
        ) : null}

        <section className="w-full max-w-3xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-2xl border border-border-base bg-background-raised overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border-base px-4 py-3">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-background">
                <ArrowLeftIcon size={16} weight="bold" />
                Voltar
              </Link>
              <div>
                <h1 className="text-lg font-black text-foreground">Publicação</h1>
                <p className="text-sm text-subtitle">Veja os detalhes e comentários</p>
              </div>
            </div>

            {loadingPost ? (
              <div className="p-6 text-sm text-subtitle">Carregando publicação...</div>
            ) : postError ? (
              <div className="p-6 text-sm text-red-600">{postError}</div>
            ) : post ? (
              <article className="p-4 md:p-6 border-b border-border-base">
                <div className="flex items-start gap-3">
                  <div className="size-12 overflow-hidden rounded-full">
                    <Image
                      src={post.profiles?.avatar_url ?? "/favicon.ico"}
                      alt={post.profiles?.name ?? "Usuário"}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="font-bold text-foreground">{post.profiles?.name ?? "Usuário"}</h2>
                      <span className="text-subtitle">@{post.profiles?.username ?? "usuario"}</span>
                      <span className="text-subtitle">·</span>
                      <span className="text-subtitle">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-foreground leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                {postImages.length > 0 && (
                  <div className={postImages.length === 1 ? "mt-4" : "mt-4 grid gap-2 md:grid-cols-2"}>
                    {postImages.map((imageUrl, index) => (
                      <button
                        key={`${post.id}-viewer-${index}`}
                        type="button"
                        onClick={() => {
                          setViewerIndex(index);
                          setViewerZoomed(false);
                        }}
                        className={
                          postImages.length === 1
                            ? "relative aspect-video w-full overflow-hidden rounded-2xl border border-border-base bg-background"
                            : "relative aspect-square w-full overflow-hidden rounded-2xl border border-border-base bg-background"
                        }
                      >
                        <Image
                          fill
                          src={imageUrl}
                          alt={`Imagem ${index + 1} da publicação`}
                          className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                          sizes="(max-width: 768px) 100vw, 720px"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-subtitle">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon size={16} weight="fill" />
                    {post.profiles?.username ? `@${post.profiles.username}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDotsIcon size={16} weight="fill" />
                    {new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {post.profiles?.username && (
                    <span className="inline-flex items-center gap-1.5 text-foreground-brand">
                      <GlobeHemisphereWestIcon size={16} weight="fill" />
                      @{post.profiles.username}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-8 border-t border-border-base pt-4 text-sm text-subtitle">
                  <span>{interactionsLoading ? "..." : interactions.commentsCount} comentários</span>
                  <span>{interactionsLoading ? "..." : interactions.repostsCount} reposts</span>
                  <span>{post.likes_count} curtidas</span>
                </div>
              </article>
            ) : null}

            <section className="border-b border-border-base p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="size-10 overflow-hidden rounded-full">
                  <Image
                    src={profile?.avatarUrl ?? "/favicon.ico"}
                    alt={profile?.name ?? "Seu perfil"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Publicar sua resposta"
                    maxLength={500}
                    className="min-h-24 w-full resize-none rounded-2xl border border-border-base bg-background px-4 py-3 text-foreground placeholder:text-foreground-muted outline-none"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-subtitle">
                      Dê duplo clique na imagem para ampliar.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSubmitComment()}
                      disabled={!commentContent.trim() || submittingComment || !profile}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-foreground-inverted gradient-to-l disabled:opacity-60"
                    >
                      <PaperPlaneRightIcon size={16} weight="fill" />
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-4 md:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-subtitle">
                <ChatCircleIcon size={16} weight="fill" />
                Comentários
              </div>

              {commentsLoading ? (
                <div className="text-sm text-subtitle">Carregando comentários...</div>
              ) : commentsError ? (
                <div className="text-sm text-red-600">{commentsError}</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-subtitle">Ainda não há comentários.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 rounded-2xl border border-border-base bg-background p-4">
                      <div className="size-10 overflow-hidden rounded-full">
                        <Image
                          src={comment.profiles?.avatar_url ?? "/favicon.ico"}
                          alt={comment.profiles?.name ?? "Usuário"}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-bold text-foreground">
                            {comment.profiles?.name ?? "Usuário"}
                          </span>
                          <span className="text-subtitle">@{comment.profiles?.username ?? "usuario"}</span>
                          <span className="text-subtitle">·</span>
                          <span className="text-subtitle">{timeAgo(comment.created_at)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      <MobileNav />

      {currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setViewerIndex(null);
            setViewerZoomed(false);
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[92vh] max-w-[92vw]">
              <button
                type="button"
                onClick={() => {
                  setViewerIndex(null);
                  setViewerZoomed(false);
                }}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-2 text-white"
              >
                <X size={18} />
              </button>
              {postImages.length > 1 && viewerIndex !== null && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewerIndex((prev) => (prev === null ? prev : (prev - 1 + postImages.length) % postImages.length))}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerIndex((prev) => (prev === null ? prev : (prev + 1) % postImages.length))}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setViewerZoomed((prev) => !prev)}
                onDoubleClick={() => setViewerZoomed((prev) => !prev)}
                className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl outline-none"
              >
                <Image
                  src={currentImage}
                  alt="Imagem ampliada da publicação"
                  width={1600}
                  height={1600}
                  className={`max-h-[92vh] max-w-[92vw] object-contain transition-transform duration-200 ${
                    viewerZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
